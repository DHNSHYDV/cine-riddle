import { useRouter } from 'expo-router';
import { Home, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatrixBackground } from '../components/MatrixBackground';
import { useGameStore } from '../store/gameStore';

export default function ResultsScreen() {
    const router = useRouter();
    const { score, highScore, resetGame } = useGameStore();

    const handlePlayAgain = () => {
        resetGame();
        router.replace('/game');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0b0b18' }}>
            <MatrixBackground />
            <SafeAreaView className="flex-1">
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
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
