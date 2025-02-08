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
exports.isAuthenticatedUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const isAuthenticatedUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) ||
            ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", ""));
        if (!token) {
            res.status(401).json({ message: "Unauthorized request" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield database_1.default.user.findUnique({
            where: {
                id: decoded.id,
            },
        });
        if (!user) {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.status(401).json({ message: "User does not exist" });
            return;
        }
        req.body.user = user;
        next();
    }
    catch (error) {
        if (error.name === "JsonWebTokenError") {
            res.status(401).json({ message: "Invalid token" });
            return;
        }
        if (error.name === "TokenExpiredError") {
            res.status(401).json({ message: "Token expired" });
            return;
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(500).json({ message: error.message });
    }
});
exports.isAuthenticatedUser = isAuthenticatedUser;
