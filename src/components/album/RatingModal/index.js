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
import BlurView from '../../shared/BlurView';
import { getRatingColor, getDecimalColor } from '../../shared/RatingBadge';

const { width, height } = Dimensions.get('window');

/**
 * Componente RatingModal
 * Modal para calificar una canción
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Visibilidad del modal
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSave - Función para guardar la calificación
 * @param {number} props.currentRating - Calificación actual
 * @param {string} props.trackTitle - Título de la canción
 */
const RatingModal = ({ visible, onClose, onSave, currentRating, trackTitle }) => {
    const [selectedRating, setSelectedRating] = useState(5);
    const [decimal, setDecimal] = useState('0');
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (visible) {
            if (currentRating) {
                setSelectedRating(Math.floor(currentRating));
                setDecimal(Math.round((currentRating - Math.floor(currentRating)) * 10).toString());
            } else {
                setSelectedRating(5);
                setDecimal('0');
            }
            setComment('');
        }
    }, [visible, currentRating]);

    const finalRating = selectedRating + (parseInt(decimal) / 10);
    const ratingColor = getDecimalColor(finalRating);

    const handleSave = () => {
        onSave(finalRating, comment);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <BlurView intensity={30} style={styles.modalContainer}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />

                <View style={styles.modalContent}>
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
                                <TouchableOpacity
                                    key={num}
                                    onPress={() => setSelectedRating(num)}
                                    style={[
                                        styles.ratingNumberButton,
                                        { backgroundColor: getRatingColor(num) + '20' },
                                        selectedRating === num && {
                                            backgroundColor: getRatingColor(num),
                                            borderColor: 'white',
                                            borderWidth: 2
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.ratingNumberText,
                                        { color: getRatingColor(num) },
                                        selectedRating === num && styles.ratingNumberTextSelected
                                    ]}>
                                        {num}
                                    </Text>
                                </TouchableOpacity>
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
                                <TouchableOpacity
                                    onPress={() => setDecimal('0')}
                                    style={[
                                        styles.ratingNumberButton,
                                        { backgroundColor: ratingColor + '20' },
                                        decimal === '0' && {
                                            backgroundColor: ratingColor,
                                            borderColor: 'white',
                                            borderWidth: 2
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.ratingNumberText,
                                        { color: ratingColor },
                                        decimal === '0' && styles.ratingNumberTextSelected
                                    ]}>
                                        .0
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <TouchableOpacity
                                        key={num}
                                        onPress={() => setDecimal(num.toString())}
                                        style={[
                                            styles.ratingNumberButton,
                                            { backgroundColor: ratingColor + '20' },
                                            decimal === num.toString() && {
                                                backgroundColor: ratingColor,
                                                borderColor: 'white',
                                                borderWidth: 2
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.ratingNumberText,
                                            { color: ratingColor },
                                            decimal === num.toString() && styles.ratingNumberTextSelected
                                        ]}>
                                            .{num}
                                        </Text>
                                    </TouchableOpacity>
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
                            <Text style={[styles.previewValue, { color: ratingColor }]}>
                                {finalRating.toFixed(1)}
                            </Text>
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
                </View>
            </BlurView>
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