import express from "express";

const app = express();
app.use(express.json());

let cachedApp: any = null;

app.all("*", async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      // Dynamic import inside route handler avoids top-level await issues
      const serverModule = await import("../server.js");
      cachedApp = serverModule.default;
    }
    // Delegate to the real Express app instance
    return cachedApp(req, res);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Server dynamic load failed",
      error: err.message,
      stack: err.stack,
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  }
});

export default app;
