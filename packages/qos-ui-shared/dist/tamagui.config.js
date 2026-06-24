"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tamagui_1 = require("tamagui");
const v3_1 = require("@tamagui/config/v3");
// Our Cyberpunk Tokens
const color = {
    ...v3_1.config.tokens.color,
    background: '#0a0a0a',
    primary: '#00ff41',
    action: '#00d4ff',
    danger: '#ff003c',
    // Extra mapping
    text: '#00ff41',
};
const space = {
    ...v3_1.config.tokens.space,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};
const tokens = (0, tamagui_1.createTokens)({
    ...v3_1.config.tokens,
    color,
    space,
});
// Fira Code Font Configuration
const firaCodeFont = (0, tamagui_1.createFont)({
    family: 'FiraCode_400Regular, "Fira Code", monospace',
    size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
        6: 24,
        true: 16,
    },
    lineHeight: {
        1: 16,
        2: 20,
        3: 24,
        4: 28,
        5: 32,
        6: 36,
        true: 24,
    },
    weight: {
        1: '400',
        4: '400',
        true: '400',
    },
    letterSpacing: {
        1: 0,
        4: 0,
        true: 0,
    },
});
const appConfig = (0, tamagui_1.createTamagui)({
    ...v3_1.config,
    tokens,
    fonts: {
        heading: firaCodeFont,
        body: firaCodeFont,
    },
    themes: {
        dark: {
            background: tokens.color.background,
            color: tokens.color.text,
            primary: tokens.color.primary,
            action: tokens.color.action,
            danger: tokens.color.danger,
        },
        light: {
            background: tokens.color.background,
            color: tokens.color.text,
            primary: tokens.color.primary,
            action: tokens.color.action,
            danger: tokens.color.danger,
        }
    }
});
exports.default = appConfig;
