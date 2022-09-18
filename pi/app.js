const express = require("express");
const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");

const { on, standby, status } = require("./cec.js");

const app = express();

const version = () => {
  const pjson = path.resolve(__dirname, "../package.json");
  const data = fs.readFileSync(pjson);

  return JSON.parse(data).version;
};

app.get("/version", (_, res) => {
  res.status(200).send(version());
});

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
