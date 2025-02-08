"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomColor = void 0;
const generateRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};
exports.generateRandomColor = generateRandomColor;
