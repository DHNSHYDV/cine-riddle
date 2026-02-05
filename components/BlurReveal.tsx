import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface BlurRevealProps {
    children: React.ReactNode;
    duration?: number;
}

export const BlurReveal: React.FC<BlurRevealProps> = ({ children, duration = 800 }) => {
    const blurOpacity = useSharedValue(1);

    useEffect(() => {
        blurOpacity.value = withTiming(0, {
            duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [duration, blurOpacity]);

    const blurStyle = useAnimatedStyle(() => ({
        opacity: blurOpacity.value,
    }));

    return (
        <Animated.View style={styles.container}>
            {children}
            <AnimatedBlurView
                tint="dark"
                intensity={40}
                style={[StyleSheet.absoluteFill, blurStyle]}
                pointerEvents="none"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
