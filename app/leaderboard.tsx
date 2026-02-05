import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
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

// Simple session-level cache to make screen transitions instant
const leaderboardCache: Record<string, ScoreEntry[]> = {};

// Memoized Item for smoother scrolling
const ScoreItem = memo(({ item, index }: { item: ScoreEntry; index: number }) => {
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
});

export default function LeaderboardScreen() {
    const router = useRouter();
    const [activeMode, setActiveMode] = useState<'poster' | 'soundtrack'>('poster');
    const [scores, setScores] = useState<ScoreEntry[]>(leaderboardCache[activeMode] || []);
    const [loading, setLoading] = useState(!leaderboardCache[activeMode]);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchLeaderboard(mode = activeMode, isRefresh = false) {
        if (!isRefresh && !leaderboardCache[mode]) setLoading(true);
        if (isRefresh) setRefreshing(true);

        try {
            let query = supabase
                .from('scores')
                .select(`
                    id,
                    score,
                    language,
                    created_at,
                    user_id,
                    profiles (username)
                `);

            if (mode === 'poster') {
                query = query.or('game_mode.eq.poster,game_mode.is.null');
            } else {
                query = query.eq('game_mode', mode);
            }

            const { data, error } = await query
                .order('score', { ascending: false })
                .limit(100); // Reduced limit for faster join and transmission

            if (error) throw error;

            // Filter unique users per mode server-side (if possible, but here we do it fast in JS)
            const uniqueScores: ScoreEntry[] = [];
            const seenUsers = new Set<string>();

            for (const entry of data || []) {
                if (!seenUsers.has(entry.user_id)) {
                    seenUsers.add(entry.user_id);
                    const profiles = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                    uniqueScores.push({ ...entry, profiles } as ScoreEntry);
                    if (uniqueScores.length >= 50) break;
                }
            }

            // Update cache and state
            leaderboardCache[mode] = uniqueScores;
            setScores(uniqueScores);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchLeaderboard(activeMode);
        }, [activeMode])
    );

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
                            Hall of Fame
                        </Text>
                        <Text className="text-xs text-gray-500 tracking-widest">
                            TOP 50 OPERATORS
                        </Text>
                    </View>
                    <View className="w-12" />
                </View>

                {/* Mode Switcher */}
                <View className="flex-row bg-[#1a1a2e] p-1 rounded-xl mb-6 border border-[#333]">
                    <Pressable
                        onPress={() => {
                            setActiveMode('poster');
                            setScores(leaderboardCache['poster'] || []);
                        }}
                        className={`flex-1 py-3 rounded-lg items-center ${activeMode === 'poster' ? 'bg-[#00ffaa]/20 border border-[#00ffaa]/30' : ''}`}
                    >
                        <Text className={`font-bold tracking-widest ${activeMode === 'poster' ? 'text-[#00ffaa]' : 'text-gray-500'}`}>POSTERS</Text>
                    </Pressable>
                    <View className="w-2" />
                    <Pressable
                        onPress={() => {
                            setActiveMode('soundtrack');
                            setScores(leaderboardCache['soundtrack'] || []);
                        }}
                        className={`flex-1 py-3 rounded-lg items-center ${activeMode === 'soundtrack' ? 'bg-[#00ffaa]/20 border border-[#00ffaa]/30' : ''}`}
                    >
                        <Text className={`font-bold tracking-widest ${activeMode === 'soundtrack' ? 'text-[#00ffaa]' : 'text-gray-500'}`}>SOUNDTRACKS</Text>
                    </Pressable>
                </View>

                {loading && scores.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00ffaa" />
                    </View>
                ) : (
                    <FlatList
                        data={scores}
                        renderItem={({ item, index }) => <ScoreItem item={item} index={index} />}
                        keyExtractor={(item) => `${activeMode}-${item.id}`}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        // Performance Props
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={true}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => fetchLeaderboard(activeMode, true)}
                                tintColor="#00ffaa"
                            />
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
