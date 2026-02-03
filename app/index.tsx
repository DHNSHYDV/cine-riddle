import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Trophy, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// --- 1. Matrix Background Component (Pure implementation of CSS) ---
const MatrixBackground = () => {
    // Pulse Animation for the radial glow
    const pulseScale = useSharedValue(0.85);
    const pulseOpacity = useSharedValue(0.2);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withTiming(1.1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
        pulseOpacity.value = withRepeat(
            withTiming(0.5, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value
    }));

    return (
        <View style={styles.container}>
            {/* Base Dark Color */}
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#0d0d1a' }} />

            {/* SVG Grid Pattern 
                CSS: repeating-linear-gradient(45deg, rgba(0, 255, 170, 0.05) 0px 1px, transparent 1px 12px)
            */}
            <View style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
                <Svg height="100%" width="100%">
                    <Defs>
                        {/* Diagonal Line Pattern */}
                        <Pattern id="gridPattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <Rect x="0" y="0" width="12" height="1" fill="rgba(0, 255, 170, 0.15)" />
                        </Pattern>
                        <Pattern id="gridPatternRev" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <Rect x="0" y="0" width="12" height="1" fill="rgba(0, 255, 170, 0.15)" />
                        </Pattern>

                        {/* Radial Glow for center */}
                        <RadialGradient id="centerGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                            <Stop offset="0%" stopColor="#0a0a1a" />
                            <Stop offset="100%" stopColor="#000" />
                        </RadialGradient>
                    </Defs>

                    {/* Background Radial Base */}
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#centerGlow)" />

                    {/* The Grid Lines */}
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridPatternRev)" />
                </Svg>
            </View>

            {/* Grid Box Shadow / Border Effect Simulation
                CSS: box-shadow: inset 0 0 40px rgba(0, 255, 170, 0.1)
            */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute', inset: 0,
                    borderWidth: 1, borderColor: 'rgba(0, 255, 170, 0.1)',
                    shadowColor: 'rgba(0, 255, 170, 0.5)', shadowRadius: 40, shadowOpacity: 0.2
                }}
            />

            {/* The Border Flow Animation (::before)
                Simulated with a moving gradient overlay or simple opacity pulse for now
            */}
        </View>
    );
};


// --- 2. Button Component (.button) ---
const StartShowButton = ({ onPress }: { onPress: () => void }) => {
    const rotation = useSharedValue(0);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 3000, easing: Easing.linear }),
            -1, false
        );
    }, []);

    const animatedGradientStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={{ transform: [{ scale: isPressed ? 0.97 : 1 }] }}
        >
            <View style={buttonStyles.buttonContainer}>
                {/* The Rotating ".hoverEffect div" 
                    CSS: width: 10rem (160px), height: 10rem... linear-gradient... filter: blur(20px)
                */}
                <View style={[buttonStyles.hoverEffect, { opacity: 0.5 }]}>
                    <Animated.View style={[{ width: 200, height: 200, borderRadius: 100 }, animatedGradientStyle]}>
                        <LinearGradient
                            colors={['rgba(222, 0, 75, 1)', 'rgba(191, 70, 255, 1)', 'rgba(0, 212, 255, 1)']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{ flex: 1, borderRadius: 100 }}
                        />
                    </Animated.View>
                </View>

                {/* Button Content (Text) */}
                <Text style={buttonStyles.text}>Start Show</Text>
            </View>
        </Pressable>
    );
};


export default function LandingScreen() {
    const router = useRouter();

    return (
        <View style={{ flex: 1, backgroundColor: '#0d0d1a' }}>
            <MatrixBackground />

            <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
                {/* Top Left Text 
                    "Cine"
                    "   Riddle" (Indented next line)
                */}
                {/* Top Left Text 
                    "Cine"
                    "   Riddle" (Indented next line)
                */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ paddingLeft: 30, paddingTop: 40 }}>
                        <Text style={{ fontFamily: 'monospace', fontSize: 60, fontWeight: 'bold', color: '#fff', lineHeight: 65, letterSpacing: -2 }}>
                            Cine
                        </Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 60, fontWeight: 'bold', color: '#00ffaa', lineHeight: 65, letterSpacing: -2 }}>
                            Riddle
                        </Text>
                    </View>

                    {/* Auth & Leaderboard Buttons */}
                    <View style={{ paddingRight: 20, paddingTop: 50, gap: 15 }}>
                        <Pressable onPress={() => router.push('/profile')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 50 }}>
                            <User color="#00ffaa" size={24} />
                        </Pressable>
                        <Pressable onPress={() => router.push('/leaderboard')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 50 }}>
                            <Trophy color="#ffd700" size={24} />
                        </Pressable>
                    </View>
                </View>

                {/* Centered Button */}
                <View style={{ alignItems: 'center', marginBottom: 150 }}>
                    <StartShowButton onPress={() => router.push('/language-select')} />
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
});

const buttonStyles = StyleSheet.create({
    buttonContainer: {
        // padding: 15px 30px
        width: 180,
        height: 60,
        borderRadius: 50,
        // backgroundColor: '#fff', // Removed duplicate

        // Wait, .button ONLY has padding, border:0. 
        // BUT .button:hover has background: rgb(193, 228, 248).
        // Let's assume white/light base for visibility? 
        // Actually CSS .button has no background initially, just box-shadow? 
        // Ah, the .hoverEffect div creates the background? No, it's Z-index 1.
        // Let's give it a clean white background as a base to match the "Cine Riddle" text cleanliness.
        backgroundColor: '#e6e6e6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 7,
        elevation: 5
    },
    hoverEffect: {
        position: 'absolute',
        top: -70, bottom: -70, left: -10, right: -10, // Oversize to cover
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        // We use opacity 0.5 as per CSS
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(37, 37, 37)',
        zIndex: 2, // Above the hover effect
        textTransform: 'uppercase'
    }
});
