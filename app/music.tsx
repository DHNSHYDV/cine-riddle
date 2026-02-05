
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Info, Music as MusicIcon, Pause, Play, SkipForward } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioTrack, getMysteryAudio, getRandomMovieForLanguage, regionalPlaylists } from '../services/music-service';
import { supabase } from '../services/supabase';
import { fetchSouthIndianMovies } from '../services/tmdb';
import { useGameStore } from '../store/gameStore';

const { width } = Dimensions.get('window');
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function MusicGameScreen() {
    const router = useRouter();
    const { lang } = useLocalSearchParams<{ lang: string }>();
    const effectiveLang = lang || 'telugu';

    const [track, setTrack] = useState<AudioTrack | null>(null);
    const [correctMovie, setCorrectMovie] = useState('');
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [timer, setTimer] = useState(30);
    const [showClue, setShowClue] = useState(false);
    const [imageBlurAmount, setImageBlurAmount] = useState(80);
    const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'gameover', message: string } | null>(null);
    const { score, lives, incrementScore, decrementLives, playedTracks, addPlayedTrack } = useGameStore();


    const soundRef = useRef<Audio.Sound | null>(null);
    const blurIntensity = useSharedValue(100);

    // Initial Load
    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    interruptionModeIOS: 1, // interruptionModeIOS.DoNotMix
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: 1, // interruptionModeAndroid.DoNotMix
                    playThroughEarpieceAndroid: false,
                });
                console.log("[Music] Audio mode set successfully");
            } catch (err) {
                console.error("[Music] Error setting audio mode:", err);
            }
        };
        setupAudio();
        loadNewRound();
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(err => console.log("[Music] Cleanup error:", err));
            }
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!loading && !revealed && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
                // Reduce blur slightly as time runs out (Panic helper)
                if (timer < 10) {
                    blurIntensity.value = withTiming(blurIntensity.value - 5, { duration: 1000 });
                }
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && !revealed) {
            revealAnswer(false);
        }
    }, [timer, loading, revealed]);




    async function loadNewRound() {
        setLoading(true);
        setRevealed(false);
        setTimer(30);
        setImageBlurAmount(80);
        blurIntensity.value = withTiming(90, { duration: 1000 }); // User requested 90% blur for difficulty

        try {
            await stopAudio();
            setFeedback(null); // Fix: Clear previous result card

            let audioData = null;
            let attempts = 0;
            let selectedMovie = "";

            // 1. Try TMDB dynamic fetch first for vastness
            while (!audioData && attempts < 3) {
                const randomPage = Math.floor(Math.random() * 50) + 1;
                const moviesFromTMDB = await fetchSouthIndianMovies(randomPage, effectiveLang);

                if (moviesFromTMDB && moviesFromTMDB.length > 0) {
                    // Pick 3 random movies from this page to try (to speed up loading)
                    const candidatesFiltered = moviesFromTMDB.filter(m => !playedTracks.includes(m.title));
                    const candidates = candidatesFiltered.sort(() => 0.5 - Math.random()).slice(0, 3);

                    for (const m of candidates) {
                        console.log(`[Music] Trying dynamic movie: ${m.title}`);
                        const data = await getMysteryAudio(`${m.title} soundtrack`);
                        if (data && data.previewUrl) {
                            audioData = data;
                            selectedMovie = m.title;
                            break;
                        }
                    }
                }
                attempts++;
            }

            // 2. Fallback to hardcoded list if TMDB/iTunes combo fails or no connection
            if (!audioData) {
                console.log("[Music] Dynamic fetch failed or too slow, falling back to classic collection");
                let movieData = getRandomMovieForLanguage(effectiveLang);
                let fallbackAttempts = 0;
                while (playedTracks.includes(movieData.movie) && fallbackAttempts < 5) {
                    movieData = getRandomMovieForLanguage(effectiveLang);
                    fallbackAttempts++;
                }
                const { movie, searchTag } = movieData;
                selectedMovie = movie;
                audioData = await getMysteryAudio(`${movie} ${searchTag} movie songs`);

                if (!audioData || !audioData.previewUrl) {
                    audioData = await getMysteryAudio(`${movie} soundtrack`);
                }
            }

            if (!audioData) throw new Error("Could not find music");

            addPlayedTrack(selectedMovie); // Track globally
            setTrack(audioData);
            setCorrectMovie(audioData.movie);

            // 3. Load Audio Object
            console.log(`[Music] Loading sound from: ${audioData.previewUrl}`);
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioData.previewUrl },
                { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            setSound(newSound);
            soundRef.current = newSound; // Track for cleanup
            setIsPlaying(true);
            console.log("[Music] Sound loaded and playing");

        } catch (e) {
            console.error("[Music] Error loading round:", e);
            Alert.alert("Error", "Could not load music round. Check your connection.");
            router.back();
        } finally {
            setLoading(false);
        }
    }

    async function saveScore(finalScore: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('scores').insert({
                user_id: user.id,
                score: finalScore,
                language: effectiveLang,
                game_mode: 'soundtrack'
            });
            console.log("[Music] Score saved successfully");
        }
    }

    async function stopAudio() {
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
            soundRef.current = null;
            setIsPlaying(false);
        }
    }

    async function togglePlay() {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
        setIsPlaying(!isPlaying);
    }

    const revealAnswer = async (correct: boolean) => {
        if (correct) {
            setRevealed(true);
            setImageBlurAmount(0);
            blurIntensity.value = withTiming(0, { duration: 500 });
            incrementScore();
            setFeedback({ type: 'correct', message: `Yes! It's from ${correctMovie}` });
        } else {
            decrementLives();
            if (lives <= 1) {
                setRevealed(true);
                setImageBlurAmount(0);
                blurIntensity.value = withTiming(0, { duration: 500 });
                setFeedback({ type: 'gameover', message: `Game Over! It was ${correctMovie}` });
                await saveScore(score); // Await high score saving
            } else {
                // Wrong but can try again
                setImageBlurAmount(prev => Math.max(prev - 20, 20)); // Reduce blur slightly
                setFeedback({ type: 'wrong', message: "Oops! Try again." });
                setTimeout(() => setFeedback(null), 1500);
            }
        }
    };

    const handleGuess = (guess: string) => {
        if (revealed || feedback?.type === 'correct') return;
        const isCorrect = guess === correctMovie;
        revealAnswer(isCorrect);
    };

    // Generate Options (Quick & Dirty for V1)
    const options = React.useMemo(() => {
        if (!track || !correctMovie) return [];
        const correct = correctMovie;
        // Get 3 random others from the fallback pool
        const pool = regionalPlaylists[effectiveLang as keyof typeof regionalPlaylists] || regionalPlaylists['telugu'];
        const wrong = pool.filter((m: string) => !correct.toLowerCase().includes(m.toLowerCase())).sort(() => 0.5 - Math.random()).slice(0, 3);
        return [correct, ...wrong].sort(() => 0.5 - Math.random());
    }, [track, correctMovie]);

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 }]
    }));

    const animatedBlurProps = useAnimatedProps(() => ({
        intensity: blurIntensity.value
    }));

    const animatedBlurStyle = useAnimatedStyle(() => ({
        // Foolproof blur for Android (Image blurRadius doesn't support animation smoothly in all versions, 
        // but we can use it as a static-ish fallback or drive it via state/ref if needed.
        // Actually, we'll use conditional prop in the render.)
    }));

    if (loading) {
        return (
            <View className="flex-1 bg-[#0d0d1a] justify-center items-center">
                <ActivityIndicator size="large" color="#00ffaa" />
                <Text className="text-white mt-4 font-mono tracking-widest">LOADING TRACK...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0d0d1a]">
            {/* Background Blur of the same image for ambiance */}
            {track && (
                <View style={StyleSheet.absoluteFill}>
                    <Image source={{ uri: track.artworkUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} blurRadius={50} />
                    <LinearGradient colors={['#0d0d1a', 'transparent', '#0d0d1a']} style={StyleSheet.absoluteFill} />
                </View>
            )}

            <SafeAreaView className="flex-1 px-6">

                {/* Header (Matching Poster Game Style) */}
                <View className="flex-row justify-between items-center mb-8">
                    <Pressable onPress={() => router.back()} className="p-2 bg-white/10 rounded-full">
                        <ArrowLeft color="white" size={24} />
                    </Pressable>
                    <Text className="text-white text-lg font-bold">Score: {score}</Text>
                    <View className="flex-row items-center space-x-1">
                        <Heart color={lives > 0 ? "#f43f5e" : "gray"} fill={lives > 0 ? "#f43f5e" : "gray"} size={24} />
                        <Text className="text-white font-bold ml-1">{lives}</Text>
                    </View>
                </View>

                {/* Main Content: Blurred Art */}
                <View className="flex-1 items-center justify-center mb-10">
                    <Animated.View style={[{ width: width * 0.8, height: width * 0.8, borderRadius: 20, overflow: 'hidden', elevation: 20, shadowColor: '#00ffaa', shadowRadius: 20 }, animatedImageStyle]}>
                        {track && (
                            <Image
                                source={{ uri: track.artworkUrl }}
                                style={{ width: '100%', height: '100%' }}
                                blurRadius={revealed ? 0 : imageBlurAmount} // Dynamic blur for wrong answers
                            />
                        )}

                        {/* THE BLUR (Improved) */}
                        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
                            {!revealed && (
                                <AnimatedBlurView animatedProps={animatedBlurProps} tint="dark" style={StyleSheet.absoluteFill}>
                                    <View className="flex-1 items-center justify-center">
                                        <MusicIcon color="#00ffaa" size={60} opacity={0.5} />
                                    </View>
                                </AnimatedBlurView>
                            )}
                        </Animated.View>

                        {/* Pause/Play Button (Top Right) */}
                        {!loading && (
                            <Pressable
                                onPress={togglePlay}
                                style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}
                                className="p-3 bg-black/50 border border-white/20 rounded-full shadow-lg"
                            >
                                {isPlaying ? <Pause color="white" size={24} fill="white" /> : <Play color="white" size={24} fill="white" />}
                            </Pressable>
                        )}

                        {/* Clue Overlay */}
                        {showClue && !revealed && (
                            <View className="absolute bottom-0 w-full bg-black/80 p-4">
                                <Text className="text-white italic text-center text-xs">Artist: {track?.artist}</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Timer Bar (The "Sand") */}
                    <View className="w-full h-1.5 bg-white/10 mt-8 rounded-full overflow-hidden border border-white/5">
                        <Animated.View style={{ width: `${(timer / 30) * 100}%`, height: '100%', backgroundColor: timer < 10 ? '#f43f5e' : '#00ffaa' }} />
                    </View>
                    <Text className="text-gray-400 mt-2 font-mono text-xs tracking-widest">{timer} SECONDS REMAINING</Text>
                </View>

                {/* Options / Feedback Layer */}
                <View className="mb-8 gap-3">
                    {feedback ? (
                        <Animated.View entering={FadeIn} className={`w-full p-4 rounded-xl mb-2 flex-row items-center justify-between ${feedback.type === 'correct' ? 'bg-green-600' :
                            feedback.type === 'gameover' ? 'bg-red-600' : 'bg-red-500/80'
                            }`}>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">{feedback.type === 'correct' ? 'Correct!' : feedback.type === 'gameover' ? 'Game Over' : 'Oops!'}</Text>
                                <Text className="text-white text-sm">{feedback.message}</Text>
                            </View>

                            {feedback.type === 'correct' && (
                                <Pressable onPress={loadNewRound} className="bg-white p-2 rounded-full">
                                    <SkipForward color="green" size={24} />
                                </Pressable>
                            )}

                            {feedback.type === 'gameover' && (
                                <Pressable onPress={() => router.replace('/results')} className="bg-white p-2 rounded-full">
                                    <Text className="text-red-600 font-bold px-2">Results</Text>
                                </Pressable>
                            )}
                        </Animated.View>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => setShowClue(!showClue)}
                                className="mb-2 flex-row items-center self-center bg-white/5 border border-white/10 px-4 py-1.5 rounded-full"
                            >
                                <Info color="#00ffaa" size={14} />
                                <Text className="text-white ml-2 text-xs">Show Clue</Text>
                            </Pressable>

                            {options.map((option, idx) => (
                                <Pressable
                                    key={idx}
                                    onPress={() => handleGuess(option)}
                                    className="bg-white/5 border border-white/10 p-4 rounded-xl active:bg-white/20 transition-colors"
                                >
                                    <Text className="text-white text-center font-bold text-lg">{option}</Text>
                                </Pressable>
                            ))}
                        </>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({});
