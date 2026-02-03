import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSouthIndianMovies, getImageUrl } from '../services/tmdb';
import { useGameStore } from '../store/gameStore';
import { Movie } from '../types';

export default function GameScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [currentRoundMovies, setCurrentRoundMovies] = useState<Movie[]>([]);
    const [targetMovie, setTargetMovie] = useState<Movie | null>(null);
    const [blurAmount, setBlurAmount] = useState(20);
    const [showClue, setShowClue] = useState(false);

    const { score, lives, incrementScore, decrementLives, resetGame, setLastTargetMovie } = useGameStore();

    useEffect(() => {
        loadGame();
    }, []);

    const loadGame = async () => {
        setLoading(true);
        // Fetch random page between 1 and 10 to get variety
        const randomPage = Math.floor(Math.random() * 10) + 1;
        try {
            const fetchedMovies = await fetchSouthIndianMovies(randomPage);

            if (fetchedMovies.length > 3) {
                setMovies(fetchedMovies);
                startRound(fetchedMovies);
            } else {
                Alert.alert("Error", "Could not load movies. Please check your internet.");
            }
        } catch (e) {
            console.error("Fetch error in GameScreen:", e);
            Alert.alert("Error", "Could not fetch movies.");
        }
        setLoading(false);
    };

    const startRound = (availableMovies: Movie[]) => {
        // Pick 4 unique movies for options
        const shuffled = [...availableMovies].sort(() => 0.5 - Math.random());
        const roundOptions = shuffled.slice(0, 4);
        const target = roundOptions[Math.floor(Math.random() * roundOptions.length)];

        setCurrentRoundMovies(roundOptions);
        setTargetMovie(target);
        setBlurAmount(20);
        setShowClue(false);
    };

    const handleGuess = (movieId: number) => {
        if (movieId === targetMovie?.id) {
            // Correct!
            incrementScore();
            Alert.alert("Correct!", `It was ${targetMovie?.title}`, [
                { text: "Next Movie", onPress: () => startRound(movies) }
            ]);
            setBlurAmount(0); // Reveal
        } else {
            // Wrong!
            decrementLives();
            if (lives <= 1) {
                // Game Over
                if (targetMovie) setLastTargetMovie(targetMovie);
                Alert.alert("Game Over", `The movie was ${targetMovie?.title}. Final Score: ${score}`, [
                    { text: "See Results", onPress: () => router.replace('/results') }
                ]);
            } else {
                Alert.alert("Wrong!", "Try again or use a clue. Life lost.");
                setBlurAmount(blurAmount - 5); // Reduces blur slightly as "punishment" or help? Actually keeping it blurred is the challenge.
            }
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-900 justify-center items-center">
                <ActivityIndicator size="large" color="#EAB308" />
                <Text className="text-white mt-4">Loading Cinema...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-neutral-900">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Score: {score}</Text>
                <View className="flex-row items-center space-x-1">
                    <Heart color={lives > 0 ? "red" : "gray"} fill={lives > 0 ? "red" : "gray"} size={24} />
                    <Text className="text-white font-bold">{lives}</Text>
                </View>
            </View>

            {/* Main Content */}
            <View className="flex-1 items-center justify-center px-4">
                {targetMovie && (
                    <Animated.View entering={FadeIn} key={targetMovie.id} className="w-full h-96 mb-6 rounded-2xl overflow-hidden bg-neutral-800 shadow-xl border border-neutral-700 relative">
                        <Image
                            source={{ uri: getImageUrl(targetMovie.poster_path) }}
                            className="w-full h-full"
                            resizeMode="cover"
                            blurRadius={blurAmount}
                        />
                        {/* Clue Overlay if active */}
                        {showClue && (
                            <View className="absolute bottom-0 w-full bg-black/80 p-4">
                                <Text className="text-white italic text-center">"{targetMovie.overview.substring(0, 100)}..."</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                <TouchableOpacity
                    onPress={() => setShowClue(!showClue)}
                    className="mb-6 flex-row items-center bg-blue-600/30 px-4 py-2 rounded-full"
                >
                    <Info color="white" size={16} />
                    <Text className="text-white ml-2">Show Clue (-10 pts? Just kidding)</Text>
                </TouchableOpacity>

                {/* Options */}
                <View className="w-full gap-3">
                    {currentRoundMovies.map((movie) => (
                        <TouchableOpacity
                            key={movie.id}
                            onPress={() => handleGuess(movie.id)}
                            className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 active:bg-neutral-700"
                        >
                            <Text className="text-white text-center font-semibold text-lg">{movie.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}
