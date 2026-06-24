"use strict";
"use client";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsWidget = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
const MetricsWidget = ({ cpuFuel, maxCpuFuel = 10000, peakMemoryBytes, maxMemoryBytes = 5 * 1024 * 1024, }) => {
    const fuelProgress = (0, react_native_reanimated_1.useSharedValue)(0);
    const memProgress = (0, react_native_reanimated_1.useSharedValue)(0);
    (0, react_1.useEffect)(() => {
        fuelProgress.value = (0, react_native_reanimated_1.withTiming)(Math.min((cpuFuel / maxCpuFuel) * 100, 100), {
            duration: 500,
            easing: react_native_reanimated_1.Easing.out(react_native_reanimated_1.Easing.exp),
        });
    }, [cpuFuel, maxCpuFuel]);
    (0, react_1.useEffect)(() => {
        memProgress.value = (0, react_native_reanimated_1.withTiming)(Math.min((peakMemoryBytes / maxMemoryBytes) * 100, 100), {
            duration: 500,
            easing: react_native_reanimated_1.Easing.out(react_native_reanimated_1.Easing.exp),
        });
    }, [peakMemoryBytes, maxMemoryBytes]);
    const fuelBarStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => ({
        width: `${fuelProgress.value}%`,
    }));
    const memBarStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => ({
        width: `${memProgress.value}%`,
    }));
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.metricBox}>
        <react_native_1.Text style={styles.metricLabel}>CPU FUEL</react_native_1.Text>
        <react_native_1.Text style={styles.metricValue}>{cpuFuel}</react_native_1.Text>
        <react_native_1.View style={styles.barBackground}>
          <react_native_reanimated_1.default.View style={[styles.barFill, { backgroundColor: '#00d4ff' }, fuelBarStyle]}/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.metricBox}>
        <react_native_1.Text style={styles.metricLabel}>PEAK MEM</react_native_1.Text>
        <react_native_1.Text style={styles.metricValue}>{(peakMemoryBytes / 1024).toFixed(1)} KB</react_native_1.Text>
        <react_native_1.View style={styles.barBackground}>
          <react_native_reanimated_1.default.View style={[styles.barFill, { backgroundColor: '#ff003c' }, memBarStyle]}/>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.MetricsWidget = MetricsWidget;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricBox: {
        flex: 1,
        padding: 8,
        marginHorizontal: 4,
        justifyContent: 'center',
    },
    metricLabel: {
        color: '#555555',
        fontFamily: 'FiraCode_400Regular, "Fira Code", monospace',
        fontSize: 12,
        marginBottom: 4,
    },
    metricValue: {
        color: '#00ff41',
        fontFamily: 'FiraCode_400Regular, "Fira Code", monospace',
        fontSize: 16,
        textShadowColor: '#00ff41',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        marginBottom: 8,
    },
    barBackground: {
        height: 4,
        backgroundColor: '#333333',
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    }
});
