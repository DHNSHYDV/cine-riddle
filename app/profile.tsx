import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

export default function ProfileScreen() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace('/auth');
                return;
            }

            setUser(user);
            console.log('Fetching profile for user:', user.id);

            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (error) {
                console.log('Error fetching profile (might not exist yet):', error.message);
            }

            if (data) {
                console.log('Profile loaded:', data);
                setUsername(data.username || '');
            } else {
                console.log('No profile found, defaulting to empty.');
            }
        } catch (error) {
            console.error('Unexpected error in getProfile:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            console.log('Updating profile for:', user?.id, 'with username:', username);

            if (!user) {
                Alert.alert('Error', 'No user session found.');
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username,
                    updated_at: new Date(),
                });

            if (error) {
                console.error('Profile update failed:', error);
                throw error;
            }

            console.log('Profile update success');
            Alert.alert('Success', 'Codename updated successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
        router.replace('/');
    }

    if (loading) {
        return (
            <View className="flex-1 bg-[#0d0d1a] justify-center items-center">
                <ActivityIndicator color="#00ffaa" size="large" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0d0d1a]">
            {/* Background Matrix/Grid Overlay (Subtle) */}
            <View className="absolute inset-0 opacity-20 bg-[#0d0d1a] z-0" pointerEvents="none" />

            <SafeAreaView className="flex-1 px-8 z-10">
                <View className="items-center mt-12 mb-12">
                    <Text className="text-4xl font-bold text-white tracking-widest">
                        OPERATOR <Text className="text-[#00ffaa]">PROFILE</Text>
                    </Text>
                    <Text className="text-gray-400 mt-2 tracking-widest text-xs uppercase">
                        Manage your identity
                    </Text>
                </View>

                <View className="space-y-6">
                    <View>
                        <Text className="text-gray-400 mb-2 text-xs uppercase tracking-wider">Codename</Text>
                        <TextInput
                            onChangeText={setUsername}
                            value={username}
                            placeholder="Enter Codename"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            className="bg-[#1a1a2e] text-[#00ffaa] p-4 rounded-lg border border-[#333] font-medium tracking-wider text-lg"
                        />
                    </View>

                    <View className="mt-4 gap-4">
                        <Pressable
                            onPress={updateProfile}
                            disabled={saving}
                            className="overflow-hidden rounded-lg"
                        >
                            <LinearGradient
                                colors={['#00ffaa', '#00b8ff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="p-4 items-center"
                            >
                                {saving ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text className="text-[#000] font-bold text-lg tracking-widest uppercase">
                                        Update Identity
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            onPress={signOut}
                            className="p-4 items-center rounded-lg border border-[#ff3333] bg-[#1a0505]"
                        >
                            <Text className="text-[#ff3333] font-bold text-lg tracking-widest uppercase">
                                Terminate Session
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <Pressable onPress={() => router.back()} className="items-center mt-auto mb-8">
                    <Text className="text-gray-500 text-xs uppercase tracking-widest">
                        [ Return to Mainframe ]
                    </Text>
                </Pressable>
            </SafeAreaView>
        </View>
    );
}
