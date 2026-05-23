import express from "express";
import serverApp from "../server";

const app = express();
app.use(express.json());

app.all("*", (req: any, res: any) => {
  return serverApp(req, res);
});

export default app;
