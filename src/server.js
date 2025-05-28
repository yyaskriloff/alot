import express from "express";
const {
  setupKinde,
  protectRoute,
  getUser,
} = require("@kinde-oss/kinde-node-express");
const app = express();

const port = process.env.PORT || 3000;

const config = {
  clientId: "72e83200490b41c4a0e4d54851662088",
  issuerBaseUrl: "https://alot.kinde.com",
  siteUrl: "http://localhost:3000",
  secret: "FFcWSO7G5ZeXiZHbjIir5QofN2xpdcotSh6LYqaRFIldbEwkZK",
  redirectUrl: "http://localhost:3000/kinde_callback",
};
setupKinde(config, app);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
