import express from "express";

const app = express();
app.use(express.json());

let cachedApp: any = null;

app.all("*", async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      // Dynamic import from the pre-compiled server.cjs to avoid typescript/vite packaging errors on Vercel
      const serverModule = await import("../dist/server.cjs");
      // CommonJS default export could be nested under serverModule.default or serverModule.default.default
      cachedApp = serverModule.default;
      if (cachedApp && cachedApp.default) {
        cachedApp = cachedApp.default;
      }
    }
    return cachedApp(req, res);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Server dynamic load from dist/server.cjs failed",
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
