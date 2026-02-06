
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Info, Music as MusicIcon, Pause, Play, SkipForward } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioTrack, getMysteryAudioWithLang, getRandomMovieForLanguage, regionalPlaylists } from '../services/music-service';
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
    const { score, lives, incrementScore, decrementLives, playedTracks, addPlayedTrack, markPageVisited, getUnvisitedRandomPage } = useGameStore();

    const soundRef = useRef<Audio.Sound | null>(null);
    const blurIntensity = useSharedValue(100);

    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    interruptionModeIOS: 1,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: 1,
                    playThroughEarpieceAndroid: false,
                });
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

    useEffect(() => {
        if (!loading && !revealed && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
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
        blurIntensity.value = withTiming(90, { duration: 1000 });

        try {
            await stopAudio();
            setFeedback(null);

            let audioData = null;
            let attempts = 0;
            let selectedMovie = "";

            while (!audioData && attempts < 10) { // Increased attempts
                // Use unvisited page logic
                const randomPage = getUnvisitedRandomPage(effectiveLang, 300);
                console.log(`[Music] Fetching ${effectiveLang} movies (Page ${randomPage})`);

                const moviesFromTMDB = await fetchSouthIndianMovies(randomPage, effectiveLang);

                if (moviesFromTMDB && moviesFromTMDB.length > 0) {
                    markPageVisited(effectiveLang, randomPage);

                    const candidatesFiltered = moviesFromTMDB.filter(m => !playedTracks.includes(m.title));
                    const candidates = candidatesFiltered.sort(() => 0.5 - Math.random()).slice(0, 3);

                    for (const m of candidates) {
                        const data = await getMysteryAudioWithLang(m.title, effectiveLang);
                        if (data && data.previewUrl) {
                            if (effectiveLang !== 'all') {
                                const lowerTitle = data.title.toLowerCase();
                                const lowerMovie = data.movie.toLowerCase();
                                const targetMovieLower = m.title.toLowerCase();
                                const isEnglishGeneric = ['the', 'and', 'my', 'me', 'you', 'love'].every(w => lowerTitle.includes(w)) && !lowerMovie.includes(targetMovieLower);
                                if (isEnglishGeneric) continue;
                            }
                            audioData = data;
                            selectedMovie = m.title;
                            break;
                        }
                    }
                }
                attempts++;
            }

            if (!audioData) {
                let movieData = getRandomMovieForLanguage(effectiveLang);
                let fallbackAttempts = 0;
                while (playedTracks.includes(movieData.movie) && fallbackAttempts < 5) {
                    movieData = getRandomMovieForLanguage(effectiveLang);
                    fallbackAttempts++;
                }
                selectedMovie = movieData.movie;
                audioData = await getMysteryAudioWithLang(selectedMovie, effectiveLang);
            }

            if (!audioData) throw new Error("Could not find music");

            addPlayedTrack(selectedMovie);
            setTrack(audioData);
            setCorrectMovie(audioData.movie);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioData.previewUrl },
                { shouldPlay: true, isLooping: true, volume: 1.0 }
            );
            setSound(newSound);
            soundRef.current = newSound;
            setIsPlaying(true);
        } catch (e) {
            console.error("[Music] Error loading round:", e);
            Alert.alert("Error", "Could not load music round.");
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
        if (isPlaying) await sound.pauseAsync();
        else await sound.playAsync();
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
                await saveScore(score);
            } else {
                setImageBlurAmount(prev => Math.max(prev - 20, 20));
                setFeedback({ type: 'wrong', message: "Oops! Try again." });
                setTimeout(() => setFeedback(null), 1500);
            }
        }
    };

    const handleGuess = (guess: string) => {
        if (revealed || feedback?.type === 'correct') return;
        revealAnswer(guess === correctMovie);
    };

    const options = React.useMemo(() => {
        if (!track || !correctMovie) return [];
        const correct = correctMovie;
        const pool = regionalPlaylists[effectiveLang as keyof typeof regionalPlaylists] || regionalPlaylists['telugu'];
        const wrong = pool.filter((m: string) => !correct.toLowerCase().includes(m.toLowerCase())).sort(() => 0.5 - Math.random()).slice(0, 3);
        return [correct, ...wrong].sort(() => 0.5 - Math.random());
    }, [track, correctMovie]);

    const animatedImageStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 }] }));
    const animatedBlurProps = useAnimatedProps(() => ({ intensity: blurIntensity.value }));

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
            {track && (
                <View style={StyleSheet.absoluteFill}>
                    <Image source={{ uri: track.artworkUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} blurRadius={50} />
                    <LinearGradient colors={['#0d0d1a', 'transparent', '#0d0d1a']} style={StyleSheet.absoluteFill} />
                </View>
            )}
            <SafeAreaView className="flex-1 px-6">
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
                <View className="flex-1 items-center justify-center mb-10">
                    <Animated.View style={[{ width: width * 0.8, height: width * 0.8, borderRadius: 20, overflow: 'hidden', elevation: 20, shadowColor: '#00ffaa', shadowRadius: 20 }, animatedImageStyle]}>
                        {track && <Image source={{ uri: track.artworkUrl }} style={{ width: '100%', height: '100%' }} blurRadius={revealed ? 0 : imageBlurAmount} />}
                        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
                            {!revealed && (
                                <AnimatedBlurView animatedProps={animatedBlurProps} tint="dark" style={StyleSheet.absoluteFill}>
                                    <View className="flex-1 items-center justify-center">
                                        <MusicIcon color="#00ffaa" size={60} opacity={0.5} />
                                    </View>
                                </AnimatedBlurView>
                            )}
                        </Animated.View>
                        {!loading && (
                            <Pressable onPress={togglePlay} style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }} className="p-3 bg-black/50 border border-white/20 rounded-full shadow-lg">
                                {isPlaying ? <Pause color="white" size={24} fill="white" /> : <Play color="white" size={24} fill="white" />}
                            </Pressable>
                        )}
                        {showClue && !revealed && (
                            <View className="absolute bottom-0 w-full bg-black/80 p-4">
                                <Text className="text-white italic text-center text-xs">Artist: {track?.artist}</Text>
                            </View>
                        )}
                    </Animated.View>
                    <View className="w-full h-1.5 bg-white/10 mt-8 rounded-full overflow-hidden border border-white/5">
                        <Animated.View style={{ width: `${(timer / 30) * 100}%`, height: '100%', backgroundColor: timer < 10 ? '#f43f5e' : '#00ffaa' }} />
                    </View>
                    <Text className="text-gray-400 mt-2 font-mono text-xs tracking-widest">{timer} SECONDS REMAINING</Text>
                </View>
                <View className="mb-8 gap-3">
                    {feedback ? (
                        <Animated.View entering={FadeIn} className={`w-full p-4 rounded-xl mb-2 flex-row items-center justify-between ${feedback.type === 'correct' ? 'bg-green-600' : feedback.type === 'gameover' ? 'bg-red-600' : 'bg-red-500/80'}`}>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">{feedback.type === 'correct' ? 'Correct!' : feedback.type === 'gameover' ? 'Game Over' : 'Oops!'}</Text>
                                <Text className="text-white text-sm">{feedback.message}</Text>
                            </View>
                            {feedback.type === 'correct' && <Pressable onPress={loadNewRound} className="bg-white p-2 rounded-full"><SkipForward color="green" size={24} /></Pressable>}
                            {feedback.type === 'gameover' && <Pressable onPress={() => router.replace('/results')} className="bg-white p-2 rounded-full"><Text className="text-red-600 font-bold px-2">Results</Text></Pressable>}
                        </Animated.View>
                    ) : (
                        <>
                            <Pressable onPress={() => setShowClue(!showClue)} className="mb-2 flex-row items-center self-center bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                                <Info color="#00ffaa" size={14} /><Text className="text-white ml-2 text-xs">Show Clue</Text>
                            </Pressable>
                            {options.map((option, idx) => (
                                <Pressable key={idx} onPress={() => handleGuess(option)} className="bg-white/5 border border-white/10 p-4 rounded-xl active:bg-white/20 transition-colors">
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
