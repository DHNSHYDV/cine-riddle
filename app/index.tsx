import { useRouter } from 'expo-router';
import { Github, Mail, MessageSquare, Trophy, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { supabase } from '../services/supabase';
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d0d1a' }]} />

            {/* SVG Grid Pattern */}
            <View style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}>
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

            {/* Grid Box Shadow / Border Effect Simulation */}
            {/* Using absoluteFill to ensure it covers the screen and doesn't collapse */}
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderWidth: 1,
                        borderColor: 'rgba(0, 255, 170, 0.1)',
                        // Shadows on Android require elevation, but effectively invisible on full-screen absolute views usually
                        // We'll keep it simple to avoid artifacts
                    }
                ]}
            />
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
                {/* Button Content (Text) */}
                <Text style={buttonStyles.text}>Start Show</Text>
            </View>
        </Pressable>
    );
};


export default function LandingScreen() {
    const router = useRouter();
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    async function submitFeedback() {
        if (!feedbackText.trim()) {
            Alert.alert('Empty', 'Please enter some feedback.');
            return;
        }

        try {
            setSendingFeedback(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Error', 'You must be logged in to send feedback.');
                setFeedbackVisible(false);
                router.push('/auth');
                return;
            }

            const { error } = await supabase.from('feedback').insert({
                user_id: user.id,
                email: user.email,
                message: feedbackText.trim(),
            });

            if (error) throw error;

            Alert.alert('Thank You', 'Your feedback has been sent!');
            setFeedbackText('');
            setFeedbackVisible(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSendingFeedback(false);
        }
    }

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
                <View style={{ alignItems: 'center' }}>
                    <StartShowButton onPress={() => router.push('/language-select')} />
                </View>

                {/* Footer: Social Links */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 30, paddingHorizontal: 30, width: '100%', position: 'relative' }}>
                    {/* Contact - Bottom Left */}
                    <Pressable
                        onPress={() => Linking.openURL('mailto:dhanushyadavkrish@gmail.com')}
                        style={{ position: 'absolute', left: 30, bottom: 30, opacity: 0.8 }}
                    >
                        <Mail color="#fff" size={24} />
                    </Pressable>

                    {/* GitHub - Bottom Center */}
                    <Pressable
                        onPress={() => Linking.openURL('https://github.com/DHNSHYDV/cine-riddle')}
                        style={{ opacity: 0.8 }}
                    >
                        <Github color="#fff" size={24} />
                    </Pressable>

                    {/* Feedback - Bottom Right */}
                    <Pressable
                        onPress={() => setFeedbackVisible(true)}
                        style={{ position: 'absolute', right: 30, bottom: 30, opacity: 0.8 }}
                    >
                        <MessageSquare color="#fff" size={24} />
                    </Pressable>
                </View>

                {/* Feedback Modal */}
                <Modal
                    visible={feedbackVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setFeedbackVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFeedbackVisible(false)} />

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ width: '100%', alignItems: 'center' }}
                        >
                            <View style={{
                                width: '85%',
                                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                                borderRadius: 24,
                                padding: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.5,
                                shadowRadius: 20,
                                elevation: 10
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Send Feedback</Text>
                                    <Pressable onPress={() => setFeedbackVisible(false)} hitSlop={10}>
                                        <Text style={{ color: '#999', fontSize: 16 }}>Close</Text>
                                    </Pressable>
                                </View>

                                <TextInput
                                    style={{
                                        backgroundColor: '#0d0d1a',
                                        color: '#fff',
                                        borderRadius: 12,
                                        padding: 16,
                                        height: 140,
                                        textAlignVertical: 'top',
                                        borderWidth: 1,
                                        borderColor: '#333',
                                        fontSize: 16,
                                        marginBottom: 12
                                    }}
                                    placeholder="What's on your mind? (max 500 chars)"
                                    placeholderTextColor="#666"
                                    multiline
                                    maxLength={500}
                                    value={feedbackText}
                                    onChangeText={setFeedbackText}
                                />
                                <Text style={{ color: '#666', textAlign: 'right', marginBottom: 20, fontSize: 12 }}>
                                    {feedbackText.length}/500
                                </Text>

                                <Pressable
                                    onPress={submitFeedback}
                                    disabled={sendingFeedback}
                                    style={{
                                        backgroundColor: '#00ffaa',
                                        borderRadius: 12,
                                        padding: 16,
                                        alignItems: 'center',
                                        opacity: sendingFeedback ? 0.7 : 1
                                    }}
                                >
                                    {sendingFeedback ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Send Feedback
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
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
