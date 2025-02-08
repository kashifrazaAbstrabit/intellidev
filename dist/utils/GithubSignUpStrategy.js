"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubSignUpStrategy = void 0;
const passport_github2_1 = require("passport-github2");
const userController_1 = require("../controllers/userController");
const passport_1 = __importDefault(require("passport"));
exports.GithubSignUpStrategy = new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_SIGNUP_CLIENT_ID,
    clientSecret: process.env.GITHUB_SIGNUP_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_SIGNUP_CALLBACK,
    passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inviteToken = req.session.inviteToken;
        const user = yield (0, userController_1.signupWithGithub)(profile, inviteToken);
        if (!user) {
            return done(new Error("User not found"), null);
        }
        done(null, user);
    }
    catch (error) {
        done(null, false, { message: error.message });
    }
}));
passport_1.default.use("github-signup", exports.GithubSignUpStrategy);
