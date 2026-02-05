import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatrixBackground } from '../components/MatrixBackground';
import { supabase } from '../services/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    // Auth State
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');

    // Profile State
    const [username, setUsername] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            setLoading(true);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            setSession(session);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();

            if (data) {
                setUsername(data.username || '');
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        }
    }

    // --- Actions ---

    async function handleLogin() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (error) Alert.alert('Login Failed', error.message);
        else {
            checkSession(); // Refresh state
        }
    }

    async function handleSignup() {
        if (!newUsername.trim()) {
            Alert.alert('Required', 'Please enter a username.');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        setLoading(false);

        if (error) {
            Alert.alert('Signup Failed', error.message);
        } else {
            console.log("Signup success, user:", data.user?.id);

            // Create Profile immediately
            if (data.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    username: newUsername
                });
            }

            // Minimal, subtle spam warning as requested
            Alert.alert(
                'Verify Identity',
                'A confirmation link has been sent.\n\nPlease authorize access via your inbox (check spam if hidden).',
                [{ text: 'OK', onPress: () => setAuthMode('login') }]
            );
        }
    }

    async function updateProfile() {
        if (!session?.user) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').upsert({
            id: session.user.id,
            username: username,
            updated_at: new Date()
        });
        setSaving(false);

        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Codename updated.');
    }

    async function signOut() {
        await supabase.auth.signOut();
        setSession(null);
        setAuthMode('login');
        setEmail('');
        setPassword('');
    }

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0b0b18', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#00ffaa" size="large" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0b0b18' }}>
            <MatrixBackground />
            <SafeAreaView className="flex-1 px-8 z-10">
                {/* Header */}
                <View className="items-center mt-12 mb-12">
                    <Text className="text-4xl font-bold text-white tracking-widest">
                        {session ? 'USER' : 'SYSTEM'} <Text className="text-[#00ffaa]">{session ? 'PROFILE' : 'AUTH'}</Text>
                    </Text>
                    <Text className="text-gray-400 mt-2 tracking-widest text-xs uppercase">
                        {session ? 'Manage your account' : 'Log in to continue'}
                    </Text>
                </View>

                {session ? (
                    // --- LOGGED IN VIEW ---
                    <View className="gap-6">
                        <View>
                            <Text className="text-gray-400 mb-2 text-xs uppercase tracking-wider">Username</Text>
                            <TextInput
                                onChangeText={setUsername}
                                value={username}
                                placeholder="Enter Username"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider text-lg"
                            />
                        </View>
                        <View className="mt-4 gap-4">
                            <Pressable onPress={updateProfile} disabled={saving} className="overflow-hidden rounded-lg">
                                <LinearGradient
                                    colors={['#00ffaa', '#00b8ff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="p-4 items-center"
                                >
                                    {saving ? <ActivityIndicator color="#000" /> : (
                                        <Text className="text-[#000] font-bold text-lg tracking-widest uppercase">Update Profile</Text>
                                    )}
                                </LinearGradient>
                            </Pressable>

                            <Pressable onPress={signOut} className="p-4 items-center rounded-lg border border-[#ff3333] bg-[#1a0505]">
                                <Text className="text-[#ff3333] font-bold text-lg tracking-widest uppercase">Log Out</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    // --- LOGGED OUT VIEW ---
                    <View className="gap-4">
                        {/* Tab Switcher */}
                        <View className="flex-row mb-4 bg-[#1a1a2e] p-1 rounded-lg">
                            <Pressable
                                onPress={() => setAuthMode('login')}
                                className={`flex-1 p-3 rounded-md items-center ${authMode === 'login' ? 'bg-[#333]' : ''}`}
                            >
                                <Text className={`font-bold ${authMode === 'login' ? 'text-white' : 'text-gray-500'}`}>LOGIN</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setAuthMode('signup')}
                                className={`flex-1 p-3 rounded-md items-center ${authMode === 'signup' ? 'bg-[#333]' : ''}`}
                            >
                                <Text className={`font-bold ${authMode === 'signup' ? 'text-white' : 'text-gray-500'}`}>SIGN UP</Text>
                            </Pressable>
                        </View>

                        {/* Signup-only field */}
                        {authMode === 'signup' && (
                            <View>
                                <TextInput
                                    onChangeText={setNewUsername}
                                    value={newUsername}
                                    placeholder="Username"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                    className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider"
                                />
                            </View>
                        )}

                        <View>
                            <TextInput
                                onChangeText={setEmail}
                                value={email}
                                placeholder="Email"
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
                                placeholder="Password"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider"
                            />
                        </View>

                        <Pressable
                            onPress={authMode === 'login' ? handleLogin : handleSignup}
                            className="mt-4 overflow-hidden rounded-lg"
                        >
                            <LinearGradient
                                colors={['#00ffaa', '#00b8ff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-4 items-center"
                            >
                                <Text className="text-[#000] font-bold text-lg tracking-widest uppercase">
                                    {authMode === 'login' ? 'Log In' : 'Sign Up'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}

                <Pressable onPress={() => router.back()} className="items-center mt-auto mb-8">
                    <Text className="text-gray-500 text-xs uppercase tracking-widest">
                        Back
                    </Text>
                </Pressable>
            </SafeAreaView>
        </View>
    );
}
