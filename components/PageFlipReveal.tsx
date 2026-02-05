import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface PageFlipRevealProps {
    children: React.ReactNode;
}

export const PageFlipReveal: React.FC<PageFlipRevealProps> = ({ children }) => {
    const rotateY = useSharedValue(-90); // Start flipped away
    const opacity = useSharedValue(0);

    useEffect(() => {
        rotateY.value = withTiming(0, {
            duration: 700,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
        opacity.value = withTiming(1, {
            duration: 400,
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY.value}deg` },
            ],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.inner}>
                {children}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b18', // Match standardized background
    },
    inner: {
        flex: 1,
    },
});
