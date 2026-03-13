import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente AlbumComment
 * 
 * 
 * @param {Object} props
 * @param {string} props.comment
 * @param {boolean} props.isSaved 
 * @param {Function} props.onSaveComment 
 */
const AlbumComment = ({ comment, isSaved, onSaveComment }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempComment, setTempComment] = useState('');

    if (!isSaved) return null;

    const handleStartEdit = () => {
        setTempComment(comment || '');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setTempComment(comment || '');
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (tempComment !== comment) {
            const success = await onSaveComment(tempComment);
            if (success) {
                setIsEditing(false);
            }
        } else {
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe un comentario sobre el álbum..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={tempComment}
                    onChangeText={setTempComment}
                    multiline
                    textAlignVertical="top"
                />
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (comment) {
        return (
            <TouchableOpacity onPress={handleStartEdit} style={styles.container}>
                <Text style={styles.label}>Comentario</Text>
                <Text style={styles.commentText}>{comment}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={handleStartEdit} style={[styles.container, styles.addContainer]}>
            <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.5)" />
            <Text style={styles.addText}>Agregar comentario</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    input: {
        color: 'white',
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    cancelButton: {
        marginRight: 16,
    },
    cancelButtonText: {
        color: 'rgba(255,255,255,0.6)',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    saveButton: {},
    saveButtonText: {
        color: '#9333EA',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    label: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    commentText: {
        color: 'white',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    addContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addText: {
        color: 'rgba(255,255,255,0.5)',
        marginLeft: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
});

export default AlbumComment;