import express from "express";

let app: any;

try {
  // Use dynamic import to catch boot/module resolution errors on Vercel
  const serverModule = await import("../server.js");
  app = serverModule.default;
} catch (err: any) {
  app = express();
  app.use(express.json());
  app.all("*", (req: any, res: any) => {
    res.status(500).json({
      success: false,
      message: "Server initialization failed dynamically on Vercel",
      error: err.message,
      stack: err.stack,
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  });
}

export default app;
