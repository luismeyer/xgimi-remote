const express = require("express");
const localtunnel = require("localtunnel");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const { on, standby, status } = require("./cec.js");

const app = express();

const { PASSWORD, SUB_DOMAIN } = process.env;

if (!PASSWORD || !SUB_DOMAIN) {
  throw new Error("Missing env");
}

const version = () => {
  const pjson = path.resolve(__dirname, "../package.json");
  const data = fs.readFileSync(pjson);

  return JSON.parse(data).version;
};

app.use((req, res, next) => {
  const { authorization } = req.headers;

  if (authorization !== PASSWORD) {
    console.info("Unauthorized request with header: ", authorization);

    res.status(401).send({ message: "Wrong pw" });
    return;
  }

  next();
});

app.get("/version", (_, res) => {
  res.status(200).send({ version: version() });
});

app.get("/on", async (_, res) => {
  await on()
    .then(() => res.status(200).send({ state: true }))
    .catch(() => res.status(400).send({ state: true }));
});

app.get("/standby", async (_, res) => {
  await standby()
    .then(() => res.status(200).send({ state: false }))
    .catch(() => res.status(400).send({ state: false }));
});

app.get("/status", async (_, res) => {
  await status()
    .then((state) => res.status(200).json({ state }))
    .catch(() => res.status(400).json({ state: undefined }));
});

const port = 8080;

app.listen(port, async () => {
  console.log(`App running on http://localhost:${port}/`);

  const tunnel = await localtunnel({ port: port, subdomain: SUB_DOMAIN });

  console.log(`Tunnel open: ${tunnel.url}`);
});
