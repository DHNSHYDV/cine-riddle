import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Github, Mail, Trophy, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { MatrixBackground } from '../components/MatrixBackground';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

// --- 1. Refined iOS 26 "Glossy Liquid" Start Button ---
const StartShowButton = ({ onPress, text }: { onPress: () => void, text: string }) => {
    const pressAnim = useSharedValue(0);
    const shimmerAnim = useSharedValue(-1);

    useEffect(() => {
        // Silky smooth, organic liquid sweep
        shimmerAnim.value = withRepeat(
            withTiming(1, {
                duration: 4500,
                easing: Easing.bezier(0.4, 0, 0.2, 1)
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withTiming(pressAnim.value ? 0.97 : 1, { duration: 150 }) }],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerAnim.value * 400 }],
        opacity: withTiming(pressAnim.value ? 0.4 : 0.3, { duration: 200 }),
    }));

    // High-fidelity liquid palette
    const liquidColors = [
        'rgba(255, 255, 255, 0)',
        'rgba(255, 255, 255, 0.03)',
        'rgba(255, 255, 255, 0.15)',
        'rgba(255, 255, 255, 0.03)',
        'rgba(255, 255, 255, 0)',
    ];

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => pressAnim.value = 1}
            onPressOut={() => pressAnim.value = 0}
        >
            <Animated.View style={[glassStyles.container, animatedStyle]}>
                {/* 1. Deep Shadow Layer */}
                <View style={glassStyles.deepShadow} />

                {/* 2. Main Glass Body */}
                <View style={glassStyles.glassBase}>
                    {/* Animated Liquid Shimmer */}
                    <Animated.View style={[glassStyles.shimmerWrapper, shimmerStyle]}>
                        <LinearGradient
                            colors={liquidColors}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>

                    {/* 3. Static Gloss Sheen (Studio Light Reflection) */}
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0)']}
                        style={glassStyles.glossSheen}
                        pointerEvents="none"
                    />

                    {/* 4. Refractive Edge Highlights (The "Spark") */}
                    <View style={glassStyles.refractionInnerRim} pointerEvents="none" />
                    <View style={glassStyles.refractionTopEdge} pointerEvents="none" />

                    <Text style={[glassStyles.text, { fontSize: text.length > 12 ? 14 : 18 }]}>
                        {text.toUpperCase()}
                    </Text>
                </View>

                {/* 5. Surface Sparkle Overlay */}
                <View style={glassStyles.surfaceSparkle} pointerEvents="none" />
            </Animated.View>
        </Pressable>
    );
};

// --- 2. Sketch Units ---
const SketchUnit = ({ Icon, label, onPress, sketchyStyle }: any) => {
    return (
        <Pressable onPress={onPress}>
            <Animated.View style={[sketchyStyle, { width: 120, height: 160, alignItems: 'center', justifyContent: 'center' }]}>
                <Svg width="115" height="155" viewBox="0 0 160 220">
                    <G transform="translate(30, 35)">
                        <Path
                            d="M10 25 C 10 5, 25 -3, 40 0 C 50 -5, 65 -3, 70 10 C 80 10, 85 25, 75 35 C 85 50, 70 60, 60 55 C 50 65, 35 70, 25 60 C 10 70, 2 55, 5 50 C -5 40, -5 30, 10 25 Z"
                            fill="none"
                            stroke="#00ffcc"
                            strokeWidth="2.5"
                            strokeDasharray="6 3"
                        />
                        <SvgText x="40" y="35" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                            {label.toUpperCase()}
                        </SvgText>
                        <Path
                            d="M45 70 C 35 85, 55 95, 45 115"
                            fill="none"
                            stroke="#00ffcc"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            opacity="0.8"
                        />
                        <G transform="translate(30, 130)">
                            <Icon color="#00ffcc" size={26} strokeWidth={2.5} />
                        </G>
                    </G>
                </Svg>
            </Animated.View>
        </Pressable>
    );
};

export default function LandingScreen() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [hasSession, setHasSession] = useState(false);

    const sketchScale = useSharedValue(1);
    const sketchSway = useSharedValue(0);

    // Fetch User Profile on Focus
    useFocusEffect(
        useCallback(() => {
            checkUser();
        }, [])
    );

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setHasSession(!!session);

            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', session.user.id)
                    .single();
                if (data) setUsername(data.username);
            } else {
                setUsername(null);
            }
        } catch (error) {
            console.log('Error fetching user:', error);
            setHasSession(false);
        }
    }

    // Sketch Animation Logic
    useEffect(() => {
        sketchScale.value = withRepeat(withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
        sketchSway.value = withRepeat(withTiming(3, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, []);

    const sketchyIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sketchScale.value }, { rotate: `${sketchSway.value}deg` }]
    }));

    return (
        <View style={{ flex: 1, backgroundColor: '#0b0b18' }}>
            <MatrixBackground />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 30, paddingTop: 50 }}>
                        <View style={{ backgroundColor: 'transparent' }}>
                            <Text style={{ fontSize: 64, fontWeight: 'bold', color: '#fff' }}>Cine</Text>
                            <Text style={{ fontSize: 64, fontWeight: 'bold', color: '#00ffcc' }}>Riddle</Text>
                        </View>
                        <View style={{ gap: 20, paddingTop: 15, alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                {username && (
                                    <View style={{ backgroundColor: 'rgba(0, 255, 204, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.2)' }}>
                                        <Text style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: 12 }}>Hi, {username}</Text>
                                    </View>
                                )}
                                <Pressable onPress={() => router.push('/profile')} style={{ backgroundColor: 'rgba(0, 255, 204, 0.1)', padding: 12, borderRadius: 50 }}>
                                    <User color="#00ffcc" size={26} />
                                </Pressable>
                            </View>
                            <Pressable onPress={() => router.push('/leaderboard')} style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 12, borderRadius: 50 }}>
                                <Trophy color="#ffd700" size={26} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <StartShowButton
                            onPress={() => router.push('/language-select')}
                            text={hasSession ? "START SHOW" : "START AS GUEST"}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', paddingBottom: 40, width: '100%' }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <SketchUnit Icon={Mail} label="Contact" onPress={() => Linking.openURL('mailto:dhanushyadavkrish@gmail.com')} sketchyStyle={sketchyIconStyle} />
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <SketchUnit Icon={Github} label="Github" onPress={() => Linking.openURL('https://github.com/DHNSHYDV/cine-riddle')} sketchyStyle={sketchyIconStyle} />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const glassStyles = StyleSheet.create({
    container: {
        width: 280,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deepShadow: {
        position: 'absolute',
        width: '90%',
        height: '80%',
        bottom: 0,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    glassBase: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shimmerWrapper: {
        position: 'absolute',
        width: '240%',
        height: '100%',
        left: '-70%',
    },
    glossSheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%',
        borderTopLeftRadius: 999,
        borderTopRightRadius: 999,
    },
    refractionInnerRim: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    refractionTopEdge: {
        position: 'absolute',
        top: 1.5,
        left: 30,
        right: 30,
        height: 0.8,
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        borderRadius: 999,
    },
    surfaceSparkle: {
        position: 'absolute',
        top: 10,
        right: '15%',
        width: 40,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 999,
        transform: [{ rotate: '-15deg' }],
    },
    text: {
        color: '#fff',
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    }
});
