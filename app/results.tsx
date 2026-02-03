import { useRouter } from 'expo-router';
import { Home, RefreshCw, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSimilarMovies, getImageUrl } from '../services/tmdb';
import { useGameStore } from '../store/gameStore';
import { Movie } from '../types';

export default function ResultsScreen() {
    const router = useRouter();
    const { score, highScore, resetGame, lastTargetMovie } = useGameStore();
    const [recommendations, setRecommendations] = useState<Movie[]>([]);

    useEffect(() => {
        if (lastTargetMovie) {
            loadRecommendations();
        }
    }, [lastTargetMovie]);

    const loadRecommendations = async () => {
        if (!lastTargetMovie) return;
        const recs = await fetchSimilarMovies(lastTargetMovie.id);
        setRecommendations(recs);
    };

    const handlePlayAgain = () => {
        resetGame();
        router.replace('/game');
    };

    return (
        <SafeAreaView className="flex-1 bg-neutral-900">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="items-center p-6 border-b border-neutral-800">
                    <Text className="text-white text-3xl font-bold mb-2">Game Over</Text>
                    <Text className="text-neutral-400 text-lg mb-6">Better luck next time!</Text>

                    <View className="bg-neutral-800 w-full p-6 rounded-2xl items-center mb-6">
                        <Text className="text-neutral-400 text-sm uppercase tracking-widest mb-1">Final Score</Text>
                        <Text className="text-yellow-500 text-6xl font-bold">{score}</Text>
                        <View className="mt-2 bg-neutral-700 px-3 py-1 rounded-full">
                            <Text className="text-neutral-300 text-xs">High Score: {highScore}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-4 w-full">
                        <TouchableOpacity
                            onPress={handlePlayAgain}
                            className="flex-1 bg-red-600 p-4 rounded-xl flex-row justify-center items-center"
                        >
                            <RefreshCw color="white" size={20} />
                            <Text className="text-white font-bold ml-2">Play Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { resetGame(); router.replace('/'); }}
                            className="flex-1 bg-neutral-700 p-4 rounded-xl flex-row justify-center items-center"
                        >
                            <Home color="white" size={20} />
                            <Text className="text-white font-bold ml-2">Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recommendations Section */}
                {lastTargetMovie && (
                    <View className="mt-8 px-4">
                        <Text className="text-white text-xl font-bold mb-1">Because you saw</Text>
                        <Text className="text-yellow-500 text-lg italic mb-4">"{lastTargetMovie.title}"</Text>

                        <Text className="text-neutral-400 mb-4">You might enjoy these similar South Indian gems:</Text>

                        <FlatList
                            data={recommendations}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingRight: 20 }}
                            renderItem={({ item }) => (
                                <View className="mr-4 w-36">
                                    <Image
                                        source={{ uri: getImageUrl(item.poster_path) }}
                                        className="w-36 h-56 rounded-xl bg-neutral-800 mb-2"
                                    />
                                    <Text className="text-white font-semibold text-sm" numberOfLines={2}>{item.title}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Star size={12} color="#EAB308" fill="#EAB308" />
                                        <Text className="text-yellow-500 text-xs ml-1">{item.vote_average.toFixed(1)}</Text>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
