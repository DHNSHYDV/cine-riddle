import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clapperboard, Music } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Reusing Matrix Background for consistency
const MatrixBackground = () => (
    <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d0d1a' }]} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.1, backgroundColor: '#00ffaa' }]} />
    </View>
);

export default function ModeSelectScreen() {
    const router = useRouter();
    const { lang } = useLocalSearchParams();

    const selectMode = (mode: 'poster' | 'music') => {
        if (mode === 'poster') {
            router.push({ pathname: '/game', params: { lang } });
        } else {
            router.push({ pathname: '/music', params: { lang } });
        }
    };

    return (
        <View className="flex-1 bg-[#0d0d1a]">
            <MatrixBackground />
            <SafeAreaView className="flex-1 justify-center px-6">
                <View className="items-center mb-16">
                    <Text className="text-4xl font-bold text-white tracking-widest text-center">
                        SELECT <Text className="text-[#00ffaa]">MODE</Text>
                    </Text>
                    <Text className="text-gray-400 mt-2 tracking-widest text-xs uppercase">
                        Choose your challenge
                    </Text>
                </View>

                <View className="gap-6">
                    {/* Poster Mode Button */}
                    <Pressable onPress={() => selectMode('poster')} className="active:scale-95 transition-transform">
                        <LinearGradient
                            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                            className="p-6 rounded-2xl border border-[#333] flex-row items-center gap-6"
                        >
                            <View className="w-16 h-16 rounded-full bg-[#00ffaa]/10 items-center justify-center border border-[#00ffaa]/30">
                                <Clapperboard color="#00ffaa" size={32} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-xl font-bold tracking-wider">Poster Riddle</Text>
                                <Text className="text-gray-400 text-sm mt-1">Guess the movie from minimal posters and clues.</Text>
                            </View>
                        </LinearGradient>
                    </Pressable>

                    {/* Music Mode Button */}
                    <Pressable onPress={() => selectMode('music')} className="active:scale-95 transition-transform">
                        <LinearGradient
                            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                            className="p-6 rounded-2xl border border-[#333] flex-row items-center gap-6"
                        >
                            <View className="w-16 h-16 rounded-full bg-[#f43f5e]/10 items-center justify-center border border-[#f43f5e]/30">
                                <Music color="#f43f5e" size={32} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-xl font-bold tracking-wider">Soundtrack</Text>
                                <Text className="text-gray-400 text-sm mt-1">Guess from 30s clips of songs and BGM.</Text>
                            </View>
                        </LinearGradient>
                    </Pressable>
                </View>

                <Pressable onPress={() => router.back()} className="items-center mt-12">
                    <Text className="text-[#666] text-xs uppercase tracking-widest">
                        [ Back to Language ]
                    </Text>
                </Pressable>

            </SafeAreaView>
        </View>
    );
}
