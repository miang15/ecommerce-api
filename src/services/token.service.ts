import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh-token.model.js";
import { env } from "../config/env.js";

// Refresh tokens are valid for 7 days
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

// Hash the token using SHA-256 to store in the database
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createAccessToken = (user: {
  _id: { toString(): string };
  role: "user" | "admin";
}) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

export const createRefreshToken = async (
  userId: string,
  familyId: string = randomUUID(),
) => {
  // Generate a secure random token and store its hash in the database
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS);

  // Store the refresh token in the database
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(token),
    familyId,
    expiresAt,
  });

  return token;
};

export const rotateRefreshToken = async (token: string) => {
  const tokenHash = hashToken(token);
  // Find the refresh token record in the database
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  if (record.usedAt) {
    // A previously rotated token was presented again.
    // Revoke the remaining session family.
    // Fail closed: don't leave a partially usable session if
    // a reused token is detected.
    await RefreshToken.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    throw new Error("REFRESH_TOKEN_REUSE");
  }

  if (record.revokedAt || record.expiresAt <= new Date()) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Atomically claim the token so concurrent requests cannot
  // both rotate it successfully.
  const claimed = await RefreshToken.findOneAndUpdate(
    {
      _id: record._id,
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true },
  );

  if (!claimed) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const User = (await import("../models/user.model.js")).default;
  const user = await User.findById(record.userId);

  if (!user) {
    // User no longer exists, revoke the remaining session family.
    await RefreshToken.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    throw new Error("INVALID_REFRESH_TOKEN");
  }

  try {
    // Create a new refresh token for the user and return it along with a new access token
    const newRefreshToken = await createRefreshToken(
      user._id.toString(),
      record.familyId,
    );

    return {
      accessToken: createAccessToken(user),
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    // Fail closed: don't leave a partially usable session if
    // issuing the replacement token fails.
    await RefreshToken.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    throw error;
  }
};

export const revokeRefreshToken = async (token: string) => {
  // Revoke the refresh token by setting its revokedAt field to the current date
  await RefreshToken.updateOne(
    {
      tokenHash: hashToken(token),
      usedAt: null,
      revokedAt: null,
    },
    { $set: { revokedAt: new Date() } },
  );
};
