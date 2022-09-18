import express from "express";
import ngrok from "ngrok";

import { on, standby, status } from "./cec.js";

const app = express();

app.get("/on", async (_, res) => {
  await on()
    .then(() => res.status(200))
    .catch(() => res.status(400));
});

app.get("/standby", async (_, res) => {
  await standby()
    .then(() => res.status(200))
    .catch(() => res.status(400));
});

app.get("/status", async (_, res) => {
  await status()
    .then((state) => res.status(200).json({ state }))
    .catch(() => res.status(400));
});

const port = 8080;

app.listen(port, async () => {
  console.log(`App running on http://localhost:${8080}/`);

  const tunnel = await ngrok.connect(port);

  console.log("Opened ngrok tunnel ", tunnel);
});
