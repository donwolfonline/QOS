"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanlineOverlay = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ScanlineOverlay = ({ opacity = 0.1, color = '#ffffff' }) => {
    return (<react_native_1.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      {Array.from({ length: 150 }).map((_, i) => (<react_native_1.View key={i} style={[styles.scanline, { backgroundColor: color }]}/>))}
    </react_native_1.View>);
};
exports.ScanlineOverlay = ScanlineOverlay;
const styles = react_native_1.StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        overflow: 'hidden',
    },
    scanline: {
        height: 1,
        marginBottom: 4,
    }
});
