import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

interface ScoreEntry {
    id: number;
    score: number;
    language: string;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
    } | null;
}

export default function LeaderboardScreen() {
    const router = useRouter();
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchLeaderboard() {
        setLoading(true);
        // Join with profiles table to get usernames
        const { data, error } = await supabase
            .from('scores')
            .select(`
                id,
                score,
                language,
                created_at,
                user_id,
                profiles (username)
            `)
            .order('score', { ascending: false })
            .limit(50);

        if (error) console.error('Error fetching leaderboard:', error);
        else setScores(data || []);

        setLoading(false);
    }

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const renderItem = ({ item, index }: { item: ScoreEntry; index: number }) => {
        const isTop3 = index < 3;
        const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#fff';

        return (
            <View className="flex-row items-center bg-[#1a1a2e] mb-2 p-4 rounded-lg border border-[#333]">
                {/* Rank */}
                <View className="w-10 items-center justify-center">
                    <Text className="text-xl font-bold font-mono" style={{ color: rankColor }}>
                        #{index + 1}
                    </Text>
                </View>

                {/* Details */}
                <View className="flex-1 ml-4">
                    <Text className="text-white font-bold text-lg tracking-wide">
                        {item.profiles?.username || 'Anonymous Agent'}
                    </Text>
                    <Text className="text-gray-500 text-xs uppercase">
                        {item.language} Sector
                    </Text>
                </View>

                {/* Score */}
                <View>
                    <Text className="text-[#00ffaa] font-bold text-xl font-mono">
                        {item.score} PTS
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#0d0d1a]">
            {/* Background Matrix Overlay */}
            <View className="absolute inset-0 opacity-10 bg-[#0d0d1a]" pointerEvents="none" />

            <SafeAreaView className="flex-1 px-4">
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header */}
                <View className="flex-row items-center justify-between mb-6 mt-4">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-3 bg-[#1a1a2e] rounded-lg border border-[#333]"
                    >
                        <ArrowLeft color="#fff" size={24} />
                    </Pressable>
                    <View className="items-center">
                        <Text className="text-[#00ffaa] font-bold text-xl tracking-widest uppercase">
                            Global Rankings
                        </Text>
                        <Text className="text-xs text-gray-500 tracking-widest">
                            TOP 50 OPERATORS
                        </Text>
                    </View>
                    <View className="w-12" />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00ffaa" />
                    </View>
                ) : (
                    <FlatList
                        data={scores}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchLeaderboard} tintColor="#00ffaa" />
                        }
                        ListEmptyComponent={
                            <View className="items-center mt-20">
                                <Trophy size={64} color="#333" />
                                <Text className="text-gray-500 mt-4 font-mono">NO DATA FOUND</Text>
                                <Text className="text-gray-600 text-xs">Be the first to upload a score.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
