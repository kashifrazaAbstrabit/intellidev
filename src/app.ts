import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import projectRoute from "./routes/projectRoutes";
import { PasspORt } from "./utils/passport";
import session from "express-session";
import { GoogleLoginStrategy } from "./utils/GoogleLoginStrategy";
import { GoogleSignUpStrategy } from "./utils/GoogleSignUpStrategy";
import { GithubLoginStrategy } from "./utils/GithubLoginStrategy";
import { GithubSignUpStrategy } from "./utils/GithubSignUpStrategy";
import devRoute from "./routes/devRoutes";

dotenv.config();

//sever
const app = express();

//middleware
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://your-production-frontend-domain.com",
    ],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false,
    
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(PasspORt.initialize());
app.use(PasspORt.session());
PasspORt.use("google-signup", GoogleSignUpStrategy);
PasspORt.use("google-login", GoogleLoginStrategy);

PasspORt.use("github-signup", GithubSignUpStrategy);
PasspORt.use("github-login", GithubLoginStrategy);

//router
app.use("/api/v1", userRoutes);
app.use("/api/v1", devRoute);
app.use("/api/v1", projectRoute);

export default app;
