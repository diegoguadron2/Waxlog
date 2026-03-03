// components/album/StateSelector/index.js
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Alert,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BlurView from '../../shared/BlurView';

const { width, height } = Dimensions.get('window');

/**
 * Componente StateSelector
 * Modal para seleccionar estado del álbum y otras opciones
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Visibilidad del modal
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSelect - Función para seleccionar estado
 * @param {Function} props.onToggleFavorite - Función para toggle favorito
 * @param {Function} props.onDelete - Función para eliminar álbum
 * @param {Function} props.onRefresh - Función para actualizar información
 * @param {string} props.currentState - Estado actual del álbum
 * @param {boolean} props.isFavorite - Si es favorito
 */
const StateSelector = ({
    visible,
    onClose,
    onSelect,
    onToggleFavorite,
    onDelete,
    onRefresh,
    currentState,
    isFavorite
}) => {
    const states = [
        { id: 'listened', label: 'Escuchado', icon: 'checkmark-circle', color: '#4ADE80' },
        { id: 'listening', label: 'Escuchando', icon: 'headset', color: '#60A5FA' },
        { id: 'to_listen', label: 'Por escuchar', icon: 'time', color: '#FBBF24' },
    ];

    const handleDelete = () => {
        onClose();
        Alert.alert('Eliminar álbum', '¿Estás seguro? Esta acción eliminará el álbum y todas sus canciones.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', onPress: onDelete, style: 'destructive' }
        ]);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <BlurView intensity={30} style={styles.modalContainer}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />

                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Opciones del álbum</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </View>

                    {/* Estados */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estado</Text>
                        {states.map(state => (
                            <TouchableOpacity
                                key={state.id}
                                style={[
                                    styles.item,
                                    currentState === state.id && styles.itemActive
                                ]}
                                onPress={() => { onSelect(state.id); onClose(); }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: state.color + '20' }]}>
                                    <Ionicons name={state.icon} size={22} color={state.color} />
                                </View>
                                <Text style={[
                                    styles.itemText,
                                    currentState === state.id && styles.itemTextActive
                                ]}>
                                    {state.label}
                                </Text>
                                {currentState === state.id && (
                                    <Ionicons name="checkmark-circle" size={22} color={state.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Favorito */}
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => { onToggleFavorite(); onClose(); }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: isFavorite ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)' }]}>
                            <Ionicons
                                name={isFavorite ? 'star' : 'star-outline'}
                                size={22}
                                color={isFavorite ? '#FFD700' : 'rgba(255,255,255,0.6)'}
                            />
                        </View>
                        <Text style={styles.itemText}>
                            {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        </Text>
                    </TouchableOpacity>

                    {/* Actualizar información */}
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => { onRefresh(); onClose(); }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(147,51,234,0.1)' }]}>
                            <Ionicons name="refresh" size={22} color="#9333EA" />
                        </View>
                        <Text style={styles.itemText}>Actualizar información</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Eliminar */}
                    <TouchableOpacity
                        style={[styles.item, styles.deleteItem]}
                        onPress={handleDelete}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="trash-outline" size={22} color="#ef4444" />
                        </View>
                        <Text style={[styles.itemText, styles.deleteText]}>Eliminar álbum</Text>
                    </TouchableOpacity>
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
        backgroundColor: '#1a1a1a',
        borderRadius: 28,
        width: width - 48,
        maxHeight: height * 0.9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 20,
        paddingBottom: 70,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 4,
    },
    itemActive: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    itemText: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    itemTextActive: {
        color: 'white',
    },
    deleteItem: {
        marginTop: 4,
    },
    deleteText: {
        color: '#ef4444',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 16,
    },
});

export default StateSelector;