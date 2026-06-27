const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function parseServiceAccountJson(rawJson) {
  const parsed = JSON.parse(rawJson);

  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const fileContent = fs.readFileSync(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      "utf8"
    );

    return parseServiceAccountJson(fileContent);
  }

  const renderSecretPath = "/etc/secrets/serviceAccountKey.json";

  if (fs.existsSync(renderSecretPath)) {
    const fileContent = fs.readFileSync(renderSecretPath, "utf8");
    return parseServiceAccountJson(fileContent);
  }

  return require("../serviceAccountKey.json");
}

const serviceAccount = loadServiceAccount();

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

const db = getFirestore(app);

module.exports = {
  app,
  db,
};