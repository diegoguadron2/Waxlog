import React, { useState } from 'react';
import {
    View, Text, TextInput,
    TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AlbumComment = ({ comment, isSaved, onSaveComment, dominantColor }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempComment, setTempComment] = useState('');

    if (!isSaved) return null;

    const accent = dominantColor || 'rgba(255,255,255,0.6)';

    const handleStartEdit = () => {
        setTempComment(comment || '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setTempComment('');
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (tempComment.trim() !== comment) {
            const success = await onSaveComment(tempComment.trim());
            if (success) setIsEditing(false);
        } else {
            setIsEditing(false);
        }
    };

    // ── Modo edición ──────────────────────────────────────────────────────────
    if (isEditing) {
        return (
            <View style={styles.editContainer}>
                <View style={styles.editHeader}>
                    <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.editLabel}>Tu reseña</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="¿Qué opinas de este álbum?"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={tempComment}
                    onChangeText={setTempComment}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                />
                <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: accent + '25', borderColor: accent + '60' }]}
                        onPress={handleSave}
                    >
                        <Ionicons name="checkmark" size={14} color={accent} />
                        <Text style={[styles.saveText, { color: accent }]}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Con comentario ────────────────────────────────────────────────────────
    if (comment) {
        return (
            <TouchableOpacity
                style={styles.commentCard}
                onPress={handleStartEdit}
                activeOpacity={0.8}
            >
                <Text style={styles.commentText}>{comment}</Text>
                <TouchableOpacity style={styles.editIconBtn} onPress={handleStartEdit}>
                    <Ionicons name="pencil" size={13} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    // ── Sin comentario ────────────────────────────────────────────────────────
    return (
        <TouchableOpacity style={styles.emptyContainer} onPress={handleStartEdit} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Agregar reseña del álbum</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // Estado con comentario
    commentCard: {
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        position: 'relative',
    },
    commentText: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        paddingRight: 24,
    },
    editIconBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 4,
    },

    // Estado vacío
    emptyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    emptyText: {
        flex: 1,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },

    // Modo edición
    editContainer: {
        marginBottom: 20,
    },
    editHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    editLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 14,
        color: 'white',
        fontSize: 15,
        lineHeight: 22,
        minHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 10,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    cancelText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default AlbumComment;