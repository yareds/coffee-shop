const { onRequest } = require("firebase-functions/v2/https");

process.env.FUNCTIONS_TARGET = "true";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const { app } = require("./bundled-server.cjs");

exports.api = onRequest({ region: "us-central1" }, app);
