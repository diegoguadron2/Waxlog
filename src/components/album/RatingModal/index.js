// components/album/RatingModal/index.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    interpolate,
    runOnJS,
    Easing
} from 'react-native-reanimated';
import BlurView from '../../shared/BlurView';
import { getRatingColor, getDecimalColor } from '../../shared/RatingBadge';

const { width, height } = Dimensions.get('window');

// Componente de botón animado para números
const AnimatedNumberButton = ({ number, selected, onPress, color }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePress = () => {
        // Animación de "pop"
        scale.value = withSequence(
            withSpring(1.2, { damping: 8, stiffness: 150 }),
            withSpring(1, { damping: 8, stiffness: 150 })
        );
        
        // Pequeño fade para feedback visual
        opacity.value = withSequence(
            withTiming(0.7, { duration: 50 }),
            withTiming(1, { duration: 100 })
        );

        // Llamar a la función original
        onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.ratingNumberButton,
                    { backgroundColor: color + '20' },
                    selected && {
                        backgroundColor: color,
                        borderColor: 'white',
                        borderWidth: 2
                    }
                ]}
            >
                <Text style={[
                    styles.ratingNumberText,
                    { color: color },
                    selected && styles.ratingNumberTextSelected
                ]}>
                    {number}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Componente de texto animado para el preview
const AnimatedPreview = ({ value, color }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        // Animar cuando cambia el valor
        scale.value = withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
        );
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Text style={[styles.previewValue, { color }]}>
                {value}
            </Text>
        </Animated.View>
    );
};

// Componente principal
const RatingModal = ({ visible, onClose, onSave, currentRating, trackTitle }) => {
    const [selectedRating, setSelectedRating] = useState(5);
    const [decimal, setDecimal] = useState('0');
    const [comment, setComment] = useState('');

    // Animaciones del modal - ULTRA RÁPIDAS
    const modalScale = useSharedValue(0);
    const modalOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Entrada instantánea - 50ms es casi imperceptible
            modalScale.value = withTiming(1, {
                duration: 50, // 50 milisegundos
                easing: Easing.linear
            });
            modalOpacity.value = withTiming(1, {
                duration: 50,
                easing: Easing.linear
            });

            // Configurar valores iniciales
            if (currentRating) {
                setSelectedRating(Math.floor(currentRating));
                setDecimal(Math.round((currentRating - Math.floor(currentRating)) * 10).toString());
            } else {
                setSelectedRating(5);
                setDecimal('0');
            }
            setComment('');
        } else {
            // Salida aún más rápida
            modalScale.value = withTiming(0, { 
                duration: 30 // 30ms - desaparece al instante
            });
            modalOpacity.value = withTiming(0, { 
                duration: 30 
            });
        }
    }, [visible, currentRating]);

    const finalRating = selectedRating + (parseInt(decimal) / 10);
    const ratingColor = getDecimalColor(finalRating);

    const handleSave = () => {
        // Guardar inmediatamente, sin animación extra
        onSave(finalRating, comment);
        onClose();
    };

    const modalAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: modalScale.value }],
        opacity: modalOpacity.value,
    }));

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: modalOpacity.value,
    }));

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.modalContainer, containerAnimatedStyle]}>
                <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />

                <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.modalScrollContent}
                    >
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle} numberOfLines={1}>
                                    {trackTitle}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    Calificar canción
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Número</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.ratingScroll}
                            contentContainerStyle={styles.ratingContentContainer}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <AnimatedNumberButton
                                    key={num}
                                    number={num}
                                    selected={selectedRating === num}
                                    onPress={() => setSelectedRating(num)}
                                    color={getRatingColor(num)}
                                />
                            ))}
                        </ScrollView>

                        <Text style={styles.modalLabel}>Decimal</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.ratingScroll}
                            contentContainerStyle={styles.ratingContentContainer}
                        >
                            {selectedRating === 10 ? (
                                <AnimatedNumberButton
                                    number=".0"
                                    selected={decimal === '0'}
                                    onPress={() => setDecimal('0')}
                                    color={ratingColor}
                                />
                            ) : (
                                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <AnimatedNumberButton
                                        key={num}
                                        number={`.${num}`}
                                        selected={decimal === num.toString()}
                                        onPress={() => setDecimal(num.toString())}
                                        color={ratingColor}
                                    />
                                ))
                            )}
                        </ScrollView>

                        <Text style={styles.modalLabel}>Comentario (opcional)</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Escribe un comentario sobre la canción..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <View style={[styles.previewContainer, { borderColor: ratingColor + '40' }]}>
                            <Text style={styles.previewLabel}>Nota final</Text>
                            <AnimatedPreview
                                value={finalRating.toFixed(1)}
                                color={ratingColor}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 24,
        width: width - 40,
        maxHeight: height * 0.8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modalScrollContent: {
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
        maxWidth: width - 120,
    },
    modalSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 12,
    },
    ratingScroll: {
        marginBottom: 20,
    },
    ratingContentContainer: {
        paddingHorizontal: 4,
        gap: 8,
    },
    ratingNumberButton: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ratingNumberText: {
        fontSize: 18,
        fontWeight: '600',
    },
    ratingNumberTextSelected: {
        color: 'white',
    },
    commentInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 14,
        minHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    previewContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 20,
    },
    previewLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        marginBottom: 4,
    },
    previewValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cancelButtonText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RatingModal;