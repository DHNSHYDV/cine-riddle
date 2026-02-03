import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center p-4">
            <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-yellow-500 mb-2">Cine Riddle</Text>
                <Text className="text-white text-lg">The Ultimate Movie Quiz</Text>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/game')}
                className="bg-red-600 px-8 py-4 rounded-full"
            >
                <Text className="text-white font-bold text-xl">Start Game</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
