import { Stack, useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatrixBackground } from '../components/MatrixBackground';

export default function HomeScreen() {
    const router = useRouter();

    const languages = [
        { id: 'telugu', label: 'Telugu', color: 'bg-emerald-500' },
        { id: 'tamil', label: 'Tamil', color: 'bg-orange-500' },
        { id: 'malayalam', label: 'Malayalam', color: 'bg-pink-500' },
        { id: 'all', label: 'All', color: 'bg-indigo-500' },
        { id: 'disabled', label: 'Other (Coming Soon)', color: 'bg-gray-400', disabled: true }
    ];

    const startGame = (langId: string) => {
        router.push({ pathname: '/mode-select', params: { lang: langId } });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0b0b18' }}>
            <MatrixBackground />
            <SafeAreaView className="flex-1">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 px-4 py-8">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <Text className="text-4xl font-bold text-yellow-500 mb-2">Cine Riddle</Text>
                        <Text className="text-neutral-400 text-lg text-center">Select your cinema language</Text>
                    </View>

                    {/* Language Options */}
                    <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 16 }}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.id}
                                disabled={lang.disabled}
                                onPress={() => !lang.disabled && startGame(lang.id)}
                                activeOpacity={0.8}
                                className={`relative w-full h-20 rounded-2xl overflow-hidden mb-2 ${lang.disabled ? 'opacity-50' : ''}`}
                            >
                                {/* Card Background - slightly lighter than main bg */}
                                <View className="absolute inset-0 bg-[#1a1a2e]" />

                                {/* Glow Effect (Pseudo-element simulation) */}
                                <View className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-60 ${lang.color}`} />

                                {/* Content */}
                                <View className="flex-1 flex-row items-center justify-between px-6 z-10">
                                    <Text className={`text-2xl font-bold ${lang.disabled ? 'text-neutral-500' : 'text-white'}`}>
                                        {lang.label}
                                    </Text>

                                    {!lang.disabled && (
                                        <View className={`w-10 h-10 rounded-full items-center justify-center bg-white/10`}>
                                            <Play fill="white" size={16} color="white" />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}
