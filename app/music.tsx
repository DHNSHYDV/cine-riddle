
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Music as MusicIcon, Pause, Play, SkipForward } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AudioTrack, getMysteryAudio, getRandomMovieForLanguage, regionalPlaylists } from '../services/music-service';

const { width } = Dimensions.get('window');

export default function MusicGameScreen() {
    const router = useRouter();
    const { lang } = useLocalSearchParams<{ lang: string }>();
    const effectiveLang = lang || 'telugu';

    const [track, setTrack] = useState<AudioTrack | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [timer, setTimer] = useState(30);
    const [score, setScore] = useState(0);

    // Animation Values
    const blurIntensity = useSharedValue(90);
    const pulseScale = useSharedValue(1);

    // Initial Load
    useEffect(() => {
        loadNewRound();
        return () => {
            stopAudio();
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

    // Pulse Animation for "Listening" state
    useEffect(() => {
        if (isPlaying) {
            pulseScale.value = withRepeat(
                withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })),
                -1, true
            );
        } else {
            pulseScale.value = withTiming(1);
        }
    }, [isPlaying]);


    async function loadNewRound() {
        setLoading(true);
        setRevealed(false);
        setTimer(30);
        blurIntensity.value = withTiming(40, { duration: 1000 }); // Reset blur to high (visual bug fix: 90 sometimes too heavy, 40-50 is good)

        try {
            await stopAudio();

            // 1. Pick a movie
            const movieQuery = getRandomMovieForLanguage(effectiveLang);

            // 2. Fetch Audio
            const audioData = await getMysteryAudio(movieQuery + " soundtrack");

            if (!audioData || !audioData.previewUrl) {
                // Retry once if failed
                console.log("Retrying fetch...");
                const retryData = await getMysteryAudio(getRandomMovieForLanguage(effectiveLang) + " song");
                if (retryData) setTrack(retryData);
                else throw new Error("Could not find music");
            } else {
                setTrack(audioData);
            }

            // 3. Load Audio Object
            if (audioData?.previewUrl) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioData.previewUrl },
                    { shouldPlay: true, isLooping: true }
                );
                setSound(newSound);
                setIsPlaying(true);
            }

        } catch (e) {
            Alert.alert("Error", "Could not load music round. Check connection.");
            router.back();
        } finally {
            setLoading(false);
        }
    }

    async function stopAudio() {
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
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

    const revealAnswer = (correct: boolean) => {
        setRevealed(true);
        blurIntensity.value = withTiming(0, { duration: 500 });
        if (correct) setScore(s => s + 10);
    };

    const handleGuess = (guess: string) => {
        if (revealed) return;
        // Simple logic for now: Check if movie title is in the guess (Since we don't have 4 options yet, just simulating "Reveal")
        // Ideally we fetch 3 fake options. For now, let's just make it a "Reveal" button game or self-verify.
        // Wait, the user prompt implied multiple choice.
        // Let's implement a "Skip/Next" flow for V1 or a simple input?
        // Let's do: Show 4 options (1 correct, 3 random from our list).

        const isCorrect = guess === track?.movie;
        revealAnswer(isCorrect);
    };

    // Generate Options (Quick & Dirty for V1)
    const options = React.useMemo(() => {
        if (!track) return [];
        const correct = track.movie;
        // Get 3 random others
        const pool = regionalPlaylists[effectiveLang as keyof typeof regionalPlaylists] || regionalPlaylists['telugu'];
        const wrong = pool.filter((m: string) => !correct.includes(m)).sort(() => 0.5 - Math.random()).slice(0, 3);
        return [correct, ...wrong].sort(() => 0.5 - Math.random());
    }, [track]);

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }]
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

                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <Pressable onPress={() => router.back()} className="p-2 bg-white/10 rounded-full">
                        <ArrowLeft color="white" size={24} />
                    </Pressable>
                    <View className="items-center">
                        <Text className="text-gray-400 text-xs font-bold tracking-[2px]">LEVEL {score / 10 + 1}</Text>
                        <Text className="text-[#00ffaa] text-lg font-black tracking-widest">SCORE: {score}</Text>
                    </View>
                    <View className="w-10" />
                </View>

                {/* Main Content: Blurred Art */}
                <View className="flex-1 items-center justify-center mb-10">
                    <Animated.View style={[{ width: width * 0.8, height: width * 0.8, borderRadius: 20, overflow: 'hidden', elevation: 20, shadowColor: '#00ffaa', shadowRadius: 20 }, animatedImageStyle]}>
                        {track && <Image source={{ uri: track.artworkUrl }} style={{ width: '100%', height: '100%' }} />}
                        {/* The Magic Blur Layer */}
                        <BlurView intensity={revealed ? 0 : 50} tint="dark" style={StyleSheet.absoluteFill}>
                            {!revealed && (
                                <View className="flex-1 items-center justify-center">
                                    <View className="bg-black/40 p-4 rounded-full backdrop-blur-md">
                                        <MusicIcon color="#fff" size={40} />
                                    </View>
                                </View>
                            )}
                        </BlurView>
                    </Animated.View>

                    {/* Timer Bar */}
                    <View className="w-full h-1 bg-gray-800 mt-8 rounded-full overflow-hidden">
                        <Animated.View style={{ width: `${(timer / 30) * 100}%`, height: '100%', backgroundColor: timer < 10 ? '#f43f5e' : '#00ffaa' }} />
                    </View>
                    <Text className="text-white mt-2 font-mono">{timer}s</Text>
                </View>

                {/* Options / Controls */}
                <View className="mb-8 gap-3">
                    {revealed ? (
                        <View className="items-center gap-4">
                            <Text className="text-white text-2xl font-bold text-center">{track?.movie}</Text>
                            <Text className="text-gray-400 text-sm text-center mb-4">{track?.title} • {track?.artist}</Text>
                            <Pressable onPress={loadNewRound} className="bg-[#00ffaa] px-10 py-4 rounded-full active:scale-95">
                                <Text className="text-black font-bold text-lg tracking-widest">NEXT TRACK <SkipForward size={18} color="black" /></Text>
                            </Pressable>
                        </View>
                    ) : (
                        options.map((option, idx) => (
                            <Pressable
                                key={idx}
                                onPress={() => handleGuess(option)}
                                className="bg-white/5 border border-white/10 p-4 rounded-xl active:bg-white/20 transition-colors"
                            >
                                <Text className="text-white text-center font-bold text-lg">{option}</Text>
                            </Pressable>
                        ))
                    )}
                </View>

                {/* Playback Controls Check */}
                <Pressable onPress={togglePlay} className="absolute bottom-6 right-6 p-4 bg-[#00ffaa] rounded-full shadow-lg">
                    {isPlaying ? <Pause color="black" fill="black" /> : <Play color="black" fill="black" />}
                </Pressable>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({});
