import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const MatrixBackground = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a3a', '#0b0b18']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#00ffcc' }} />
                    ))}
                </View>
                <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'space-around' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <View key={i} style={{ width: '100%', height: 1, backgroundColor: '#00ffcc' }} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0b0b18',
        overflow: 'hidden'
    },
});
