import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, Heart, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { fetchSouthIndianMovies, getImageUrl } from '../services/tmdb';
import { useGameStore } from '../store/gameStore';
import { Movie } from '../types';

export default function GameScreen() {
    const router = useRouter();
    const { lang } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [currentRoundMovies, setCurrentRoundMovies] = useState<Movie[]>([]);
    const [targetMovie, setTargetMovie] = useState<Movie | null>(null);
    const [blurAmount, setBlurAmount] = useState(20);
    const [showClue, setShowClue] = useState(false);

    // Custom Feedback State instead of Alerts
    const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'gameover', message: string } | null>(null);

    const { score, lives, incrementScore, decrementLives, resetGame, setLastTargetMovie, history, addToHistory, markPageVisited, getUnvisitedRandomPage } = useGameStore();

    useEffect(() => {
        loadGame();
    }, []);

    const loadGame = async () => {
        setLoading(true);
        setFeedback(null);

        try {
            // Use store logic to get a fresh page
            const currentLang = (lang as string) || 'all';
            const randomPage = getUnvisitedRandomPage(currentLang, 300);

            console.log(`[Game] Fetching ${currentLang} movies from page ${randomPage}`);

            const fetchedMovies = await fetchSouthIndianMovies(randomPage, currentLang);

            if (fetchedMovies.length > 3) {
                // Mark this page as visited so we don't fetch it again this session
                markPageVisited(currentLang, randomPage);

                // Filter out movies already seen in this session
                const uniqueMovies = fetchedMovies.filter(m => !history.includes(m.id));

                // If we ran out of unique movies on this page, just use available ones (fallback)
                const finalMovies = uniqueMovies.length >= 4 ? uniqueMovies : fetchedMovies;

                // Retry if still not enough unique movies (very unlikely with page tracking)
                if (finalMovies.length < 4) {
                    console.log('[Game] Not enough unique movies, retrying...');
                    return loadGame();
                }

                setMovies(finalMovies);
                startRound(finalMovies);
            } else {
                // If page is empty (rare), try again
                console.log('[Game] Empty page, retrying...');
                return loadGame();
            }
        } catch (e) {
            console.error("Fetch error in GameScreen:", e);
            Alert.alert("Error", "Could not fetch movies.");
        }
        setLoading(false);
    };

    const startRound = (availableMovies: Movie[]) => {
        setFeedback(null);

        // Pick 4 unique movies for options
        const shuffled = [...availableMovies].sort(() => 0.5 - Math.random());
        const roundOptions = shuffled.slice(0, 4);
        const target = roundOptions[Math.floor(Math.random() * roundOptions.length)];

        setCurrentRoundMovies(roundOptions);
        setTargetMovie(target);
        addToHistory(target.id); // Add to session history

        setBlurAmount(20);
        setShowClue(false);
    };

    const handleGuess = (movieId: number) => {
        if (feedback) return; // Prevent double guessing

        if (movieId === targetMovie?.id) {
            // Correct!
            incrementScore();
            setBlurAmount(0); // Reveal perfectly
            setFeedback({ type: 'correct', message: `Yes! It's ${targetMovie?.title}` });
        } else {
            // Wrong!
            decrementLives();
            if (lives <= 1) {
                // Game Over
                if (targetMovie) setLastTargetMovie(targetMovie);
                setBlurAmount(0); // Reveal on fail
                setFeedback({ type: 'gameover', message: `Game Over! It was ${targetMovie?.title}` });
                saveScore(score); // Save to cloud
            } else {
                setBlurAmount(blurAmount - 5); // Reduce blur slightly
                setFeedback({ type: 'wrong', message: "Wrong! Try again." });
                // Auto-clear wrong message after 1s so they can guess again
                setTimeout(() => setFeedback(null), 1500);
            }
        }
    };

    const saveScore = async (finalScore: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('scores').insert({
                user_id: user.id,
                score: finalScore,
                language: lang as string || 'mixed',
                game_mode: 'poster'
            });
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
                            resizeMode="contain"
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

                {/* Feedback Section (Replaces Clue button temporarily if active, or sits below) */}
                {feedback ? (
                    <Animated.View entering={FadeIn} className={`w-full p-4 rounded-xl mb-6 flex-row items-center justify-between ${feedback.type === 'correct' ? 'bg-green-600' :
                        feedback.type === 'gameover' ? 'bg-red-600' : 'bg-red-500/80'
                        }`}>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg">{feedback.type === 'correct' ? 'Correct!' : feedback.type === 'gameover' ? 'Game Over' : 'Oops!'}</Text>
                            <Text className="text-white text-sm">{feedback.message}</Text>
                        </View>

                        {feedback.type === 'correct' && (
                            <TouchableOpacity onPress={() => startRound(movies)} className="bg-white p-3 rounded-full">
                                <ArrowRight color="green" size={24} />
                            </TouchableOpacity>
                        )}

                        {feedback.type === 'gameover' && (
                            <TouchableOpacity onPress={() => router.replace('/results')} className="bg-white p-3 rounded-full">
                                <Text className="text-red-600 font-bold px-2">Results</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                ) : (
                    <TouchableOpacity
                        onPress={() => setShowClue(!showClue)}
                        className="mb-6 flex-row items-center bg-blue-600/30 px-4 py-2 rounded-full"
                    >
                        <Info color="white" size={16} />
                        <Text className="text-white ml-2">Show Clue (-10 pts? Just kidding)</Text>
                    </TouchableOpacity>
                )}

                {/* Options */}
                <View className="w-full gap-3">
                    {currentRoundMovies.map((movie) => (
                        <TouchableOpacity
                            key={movie.id}
                            disabled={!!feedback && feedback.type !== 'wrong'} // Disable interaction if correct/gameover
                            onPress={() => handleGuess(movie.id)}
                            className={`p-4 rounded-xl border active:bg-neutral-700 ${
                                // Highlight correct/wrong logic visually if needed, but for now just standard
                                feedback && movie.id === targetMovie?.id && feedback.type !== 'wrong' ? 'bg-green-500/50 border-green-500' :
                                    'bg-neutral-800 border-neutral-700'
                                }`}
                        >
                            <Text className="text-white text-center font-semibold text-lg">{movie.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}
