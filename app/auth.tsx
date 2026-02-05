import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        else router.replace('/'); // Go back to Home / Landing
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        console.log('Attempting signup...');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            console.log('Signup successful, data:', data);

            if (data?.user) {
                // Check if we have a session (Email confirmation might be off, or auto-login)
                if (data.session) {
                    // Initialize Profile
                    const profileData = {
                        id: data.user.id,
                        username: email.split('@')[0] || 'Operator',
                    };
                    console.log('Creating profile with:', profileData);

                    const { error: profileError } = await supabase.from('profiles').insert(profileData);

                    if (profileError) {
                        console.error('Profile creation failed:', profileError);
                        // Don't alert the user if it's just a duplicate or RLS issue that doesn't block login
                        // Alert.alert('Warning', 'Account created but profile setup failed: ' + profileError.message);
                    } else {
                        Alert.alert('Success', 'Account & Profile created! Welcome.');
                        // Optional: Auto-redirect if you want
                        // router.replace('/');
                    }
                } else {
                    // No session = Email verification likely required
                    Alert.alert('Check your Email', 'Please confirm your email address to complete registration.');
                }
            }

            setIsLogin(true); // Switch to login view
        }
        setLoading(false);
    }

    return (
        <View className="flex-1 bg-[#0d0d1a]">
            {/* Background Matrix/Grid Overlay (Subtle) */}
            <View className="absolute inset-0 opacity-20 bg-[#0d0d1a] z-0" pointerEvents="none" />

            <SafeAreaView className="flex-1 justify-center px-8 z-10">
                <View className="items-center mb-12">
                    <Text className="text-4xl font-bold text-white tracking-widest">
                        SYSTEM <Text className="text-[#00ffaa]">AUTH</Text>
                    </Text>
                    <Text className="text-gray-400 mt-2 tracking-widest text-xs uppercase">
                        Identify yourself to the network
                    </Text>
                </View>

                <View className="space-y-4 gap-4">

                    <View>
                        <TextInput
                            onChangeText={setEmail}
                            value={email}
                            placeholder="OPERATOR EMAIL"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider"
                        />
                    </View>
                    <View>
                        <TextInput
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={true}
                            placeholder="ACCESS CODE"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider"
                        />
                    </View>

                    <Pressable
                        onPress={isLogin ? signInWithEmail : signUpWithEmail}
                        disabled={loading}
                        className="mt-4 overflow-hidden rounded-lg"
                    >
                        <LinearGradient
                            colors={['#00ffaa', '#00b8ff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="p-4 items-center"
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text className="text-[#000] font-bold text-lg tracking-widest uppercase">
                                    {isLogin ? 'Initialize Session' : 'Create Profile'}
                                </Text>
                            )}
                        </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => setIsLogin(!isLogin)} className="items-center mt-4">
                        <Text className="text-gray-500 text-sm">
                            {isLogin ? "No access ID? Create one" : "Already have ID? Login"}
                        </Text>
                    </Pressable>

                    <Pressable onPress={() => router.back()} className="items-center mt-8">
                        <Text className="text-[#00ffaa] text-xs uppercase tracking-widest">
                            [ Abort Sequence ]
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}
