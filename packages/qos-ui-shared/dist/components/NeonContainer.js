"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeonContainer = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const NeonContainer = ({ children, style, color = '#00ff41', glowIntensity = 4 }) => {
    const isWeb = react_native_1.Platform.OS === 'web';
    return (<react_native_1.View style={[styles.container, style, isWeb && {
                boxShadow: `0 0 ${glowIntensity * 3}px ${color}`,
                borderColor: color,
                borderWidth: 1.5,
                borderRadius: 4,
            }]}>
      {!isWeb && (<react_native_1.View style={react_native_1.StyleSheet.absoluteFill}>
          <react_native_svg_1.default width="100%" height="100%">
            <react_native_svg_1.Defs>
              <react_native_svg_1.Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <react_native_svg_1.FeDropShadow dx="0" dy="0" stdDeviation={glowIntensity} floodColor={color} floodOpacity="0.8"/>
              </react_native_svg_1.Filter>
            </react_native_svg_1.Defs>
            <react_native_svg_1.Rect x="2" y="2" width="99%" height="99%" rx="4" ry="4" fill="transparent" stroke={color} strokeWidth="1.5" filter="url(#glow)"/>
          </react_native_svg_1.default>
        </react_native_1.View>)}
      <react_native_1.View style={styles.content}>
        {children}
      </react_native_1.View>
    </react_native_1.View>);
};
exports.NeonContainer = NeonContainer;
const styles = react_native_1.StyleSheet.create({
    container: {
        position: 'relative',
        backgroundColor: 'rgba(18, 18, 18, 0.7)', // Glassmorphism base
    },
    content: {
        padding: 16,
    }
});
