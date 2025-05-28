import express from "express";
import {
  setupKinde,
  protectRoute,
  getUser,
  GrantType,
} from "@kinde-oss/kinde-node-express";
const app = express();

const port = process.env.PORT || 3000;

const config = {
  clientId: process.env.KINDE_CLIENT_ID,
  issuerBaseUrl: process.env.KINDE_ISSUER_BASE_URL,
  siteUrl: process.env.KINDE_SITE_URL,
  secret: process.env.KINDE_SECRET,
  redirectUrl: process.env.KINDE_REDIRECT_URL,
  scope: "openid profile email",
  grantType: GrantType.AUTHORIZATION_CODE,
  unAuthorisedUrl: "http://localhost:3000/unauthorised",
  postLogoutRedirectUrl: "http://localhost:3000",
};
setupKinde(config, app);

app.set("views", "./src/views");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
