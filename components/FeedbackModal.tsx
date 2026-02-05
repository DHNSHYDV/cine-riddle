import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
    const [feedbackText, setFeedbackText] = useState('');
    const [sending, setSending] = useState(false);

    const modalBoxWidth = width * 0.9;
    const modalBoxHeight = 460;
    const modalBoxTop = (height - modalBoxHeight) / 2;
    const modalBoxLeft = (width - modalBoxWidth) / 2;

    async function submitFeedback() {
        console.log('[Feedback] Submit pressed v2');
        if (!feedbackText.trim()) {
            Alert.alert('Empty', 'Please enter some feedback.');
            return;
        }

        try {
            setSending(true);
            console.log('[Feedback] Starting submission...');

            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Check your connection.')), 10000)
            );

            // Submission logic wrapped in a promise
            const submission = async () => {
                // Use getSession() instead of getUser() for faster local retrieval
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('[Feedback] Session User ID:', session?.user?.id);

                const payload = {
                    message: feedbackText.trim(),
                    user_id: session?.user?.id || null,
                    email: session?.user?.email || null,
                    metadata: {
                        platform: Platform.OS,
                        version: '1.0.2',
                    }
                };
                console.log('[Feedback] Sending payload...');

                const { error } = await supabase.from('feedback').insert(payload);
                if (error) throw error;
                return true;
            };

            // Race against the timeout
            await Promise.race([submission(), timeout]);

            Alert.alert('Success', 'Feedback Transmission Successful! 🎬');
            setFeedbackText('');
            onClose();
        } catch (error: any) {
            console.error('[Feedback] Error:', error);
            Alert.alert('Transmission Failed', error.message || 'Unknown error occurred.');
        } finally {
            setSending(false);
            console.log('[Feedback] Finished.');
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                {/* Modal Container */}
                <View style={[styles.modalContainer, {
                    top: modalBoxTop,
                    left: modalBoxLeft,
                    width: modalBoxWidth,
                    height: modalBoxHeight,
                }]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>FEEDBACK</Text>
                                <Text style={styles.subtitle}>TRANSMISSION_OPEN</Text>
                            </View>

                            <View style={styles.headerControls}>
                                <TouchableOpacity
                                    onPress={submitFeedback}
                                    disabled={sending}
                                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <Text style={styles.sendButtonText}>SEND</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Input Area */}
                        <TextInput
                            style={styles.input}
                            placeholder="TYPE_MESSAGE..."
                            placeholderTextColor="#555"
                            multiline
                            maxLength={500}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            autoFocus={visible} // autoFocus only when visible
                        />

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.counter}>{feedbackText.length}/500</Text>
                            <Text style={styles.version}>v1.0.2</Text>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
    },
    modalContainer: {
        position: 'absolute',
        backgroundColor: '#16162a',
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: '#00ffcc',
        shadowColor: '#00ffcc',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#00ffcc',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    headerControls: {
        flexDirection: 'row',
        gap: 10,
        zIndex: 2000, // Ensure it's above everything
    },
    sendButton: {
        backgroundColor: '#00ffcc',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    sendButtonDisabled: {
        backgroundColor: '#444',
    },
    sendButtonText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 12,
    },
    closeButton: {
        backgroundColor: '#0d0d1a',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#0d0d1a',
        color: '#fff',
        borderRadius: 16,
        padding: 16,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    counter: {
        color: '#00ffcc',
        fontSize: 14,
        fontWeight: 'bold',
    },
    version: {
        color: '#444',
        fontSize: 10,
    },
});
