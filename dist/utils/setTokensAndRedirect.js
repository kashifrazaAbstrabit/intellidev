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
exports.setTokensAndRedirect = setTokensAndRedirect;
const sendToken_1 = require("./sendToken");
const ms_1 = __importDefault(require("ms"));
function setTokensAndRedirect(req, res, user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const { accessToken, refreshToken } = yield (0, sendToken_1.generateAccessAndRefreshTokens)(user.id);
        const accessTokenExpire = process.env.ACCESS_TOKEN_EXPIRE || "30m";
        const refreshTokenExpire = process.env.REFRESH_TOKEN_EXPIRE || "1d";
        if (!accessTokenExpire || !refreshTokenExpire) {
            throw new Error("Environment variables for token expiration are not defined.");
        }
        const optionsForAccessToken = {
            expires: new Date(Date.now() + ((0, ms_1.default)(accessTokenExpire) || 0)),
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "strict",
        };
        const optionsForRefreshToken = {
            expires: new Date(Date.now() + ((0, ms_1.default)(refreshTokenExpire) || 0)),
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
        };
        res
            .cookie("accessToken", accessToken, optionsForAccessToken)
            .cookie("refreshToken", refreshToken, optionsForRefreshToken);
        res.redirect(`${process.env.CLIENT_URL}/success?token=${accessToken}`);
    });
}
