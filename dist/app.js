"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const passport_1 = require("./utils/passport");
const express_session_1 = __importDefault(require("express-session"));
const GoogleLoginStrategy_1 = require("./utils/GoogleLoginStrategy");
const GoogleSignUpStrategy_1 = require("./utils/GoogleSignUpStrategy");
const GithubLoginStrategy_1 = require("./utils/GithubLoginStrategy");
const GithubSignUpStrategy_1 = require("./utils/GithubSignUpStrategy");
const devRoutes_1 = __importDefault(require("./routes/devRoutes"));
dotenv_1.default.config();
//sever
const app = (0, express_1.default)();
//middleware
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://your-production-frontend-domain.com",
    ],
    credentials: true,
}));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(passport_1.PasspORt.initialize());
app.use(passport_1.PasspORt.session());
passport_1.PasspORt.use("google-signup", GoogleSignUpStrategy_1.GoogleSignUpStrategy);
passport_1.PasspORt.use("google-login", GoogleLoginStrategy_1.GoogleLoginStrategy);
passport_1.PasspORt.use("github-signup", GithubSignUpStrategy_1.GithubSignUpStrategy);
passport_1.PasspORt.use("github-login", GithubLoginStrategy_1.GithubLoginStrategy);
//router
app.use("/api/v1", userRoutes_1.default);
app.use("/api/v1", devRoutes_1.default);
app.use("/api/v1", projectRoutes_1.default);
exports.default = app;
