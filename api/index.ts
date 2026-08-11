import app from "../src/app.js";
import connectDB from "../src/config/database.js";

const handler = async (req: any, res: any) => {
  await connectDB();

  return app(req, res);
};

export default handler;
