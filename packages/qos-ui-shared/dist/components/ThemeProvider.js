"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = void 0;
const react_1 = __importDefault(require("react"));
const tamagui_1 = require("tamagui");
const tamagui_config_1 = __importDefault(require("../tamagui.config"));
const ThemeProvider = ({ children }) => {
    return (<tamagui_1.TamaguiProvider config={tamagui_config_1.default} defaultTheme="dark">
      {children}
    </tamagui_1.TamaguiProvider>);
};
exports.ThemeProvider = ThemeProvider;
