import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity,
    Modal, Alert, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, runOnJS, Easing,
} from 'react-native-reanimated';
import BlurView from '../../shared/BlurView';

const { width, height } = Dimensions.get('window');

const STATES = [
    { id: 'listened',  label: 'Escuchado',    icon: 'checkmark-circle', color: '#4ADE80' },
    { id: 'listening', label: 'Escuchando',   icon: 'headset',          color: '#60A5FA' },
    { id: 'to_listen', label: 'Por escuchar', icon: 'time',             color: '#FBBF24' },
];

const EASE_OUT = Easing.out(Easing.ease);

const StateSelector = ({
    visible, onClose, onSelect,
    onToggleFavorite, onDelete, onShare,
    currentState, isFavorite, isSharing,
}) => {
    const translateY = useSharedValue(300);
    const opacity    = useSharedValue(0);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    // Animación de entrada/salida
    useEffect(() => {
        if (visible) {
            // Entrada suave sin rebote
            opacity.value    = withTiming(1, { duration: 180, easing: EASE_OUT });
            translateY.value = withTiming(0, { duration: 260, easing: EASE_OUT });
            setSelectedFeedback(null);
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    // Cerrar con animación de salida
    const closeWithAnimation = (callback) => {
        opacity.value    = withTiming(0, { duration: 160, easing: EASE_OUT });
        translateY.value = withTiming(300, { duration: 200, easing: EASE_OUT },
            (finished) => { if (finished) runOnJS(onClose)(); }
        );
        if (callback) callback();
    };

    // Seleccionar estado con feedback visual antes de cerrar
    const handleSelectState = (stateId) => {
        if (stateId === currentState) { closeWithAnimation(); return; }
        // Flash de feedback — mostrar estado seleccionado brevemente
        setSelectedFeedback(stateId);
        onSelect(stateId);
        setTimeout(() => closeWithAnimation(), 320);
    };

    const handleDelete = () => {
        closeWithAnimation();
        setTimeout(() => {
            Alert.alert(
                'Eliminar álbum',
                '¿Estás seguro? Se eliminarán el álbum y todas sus canciones.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', onPress: onDelete, style: 'destructive' },
                ]
            );
        }, 300);
    };

    const currentStateData = STATES.find(s => s.id === currentState);

    return (
        <Modal visible={visible} transparent animationType="none">
            {/* Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}>
                <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
            <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                onPress={() => closeWithAnimation()}
                activeOpacity={1}
            />

            {/* Sheet */}
            <Animated.View style={[styles.sheet, sheetStyle]}>
                <View style={styles.handle} />

                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Opciones del álbum</Text>
                        {currentStateData && (
                            <View style={[styles.currentBadge, { backgroundColor: currentStateData.color + '20' }]}>
                                <Ionicons name={currentStateData.icon} size={12} color={currentStateData.color} />
                                <Text style={[styles.currentBadgeText, { color: currentStateData.color }]}>
                                    {currentStateData.label}
                                </Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => closeWithAnimation()}>
                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                {/* Estados — 3 cards con feedback */}
                <View style={styles.statesRow}>
                    {STATES.map(s => {
                        const active   = currentState === s.id;
                        const feedback = selectedFeedback === s.id;
                        return (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.stateCard,
                                    active    && { borderColor: s.color, backgroundColor: s.color + '15' },
                                    feedback  && { borderColor: s.color, backgroundColor: s.color + '35' },
                                ]}
                                onPress={() => handleSelectState(s.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.stateIconWrap, {
                                    backgroundColor: s.color + (active || feedback ? '35' : '15'),
                                }]}>
                                    <Ionicons
                                        name={feedback ? 'checkmark-circle' : s.icon}
                                        size={22}
                                        color={s.color}
                                    />
                                </View>
                                <Text style={[styles.stateLabel, (active || feedback) && { color: 'white', fontWeight: '700' }]}>
                                    {feedback ? '¡Listo!' : s.label}
                                </Text>
                                {(active || feedback) && (
                                    <View style={[styles.activeCheck, { backgroundColor: s.color }]}>
                                        <Ionicons name="checkmark" size={10} color="#000" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => { onToggleFavorite(); closeWithAnimation(); }}
                >
                    <View style={[styles.actionIcon, {
                        backgroundColor: isFavorite ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                    }]}>
                        <Ionicons
                            name={isFavorite ? 'star' : 'star-outline'}
                            size={20}
                            color={isFavorite ? '#FFD700' : 'rgba(255,255,255,0.6)'}
                        />
                    </View>
                    <View style={styles.actionTextWrap}>
                        <Text style={styles.actionLabel}>
                            {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        </Text>
                        <Text style={styles.actionSub}>
                            {isFavorite ? 'Actualmente en favoritos' : 'Marcar como favorito'}
                        </Text>
                    </View>
                    {isFavorite && <Ionicons name="star" size={16} color="#FFD700" />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => { closeWithAnimation(); setTimeout(onShare, 300); }}
                    disabled={isSharing}
                >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                        <Ionicons name="share-social-outline" size={20} color="#818CF8" />
                    </View>
                    <View style={styles.actionTextWrap}>
                        <Text style={styles.actionLabel}>
                            {isSharing ? 'Generando imagen...' : 'Compartir álbum'}
                        </Text>
                        <Text style={styles.actionSub}>Comparte tu reseña como imagen</Text>
                    </View>
                    {isSharing && <Ionicons name="hourglass-outline" size={16} color="rgba(255,255,255,0.3)" />}
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                        <Ionicons name="trash-outline" size={20} color="#f87171" />
                    </View>
                    <View style={styles.actionTextWrap}>
                        <Text style={[styles.actionLabel, { color: '#f87171' }]}>Eliminar álbum</Text>
                        <Text style={styles.actionSub}>Se eliminan también las canciones</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 28 }} />
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.55)',
    },

    // Sheet
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    handle: {
        width: 36, height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginBottom: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    currentBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    closeBtn: {
        width: 32, height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Estados en 3 cards horizontales
    statesRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    stateCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 8,
        position: 'relative',
    },
    stateIconWrap: {
        width: 44, height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    activeCheck: {
        position: 'absolute',
        top: 8, right: 8,
        width: 18, height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },

    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginBottom: 8,
    },

    // Acciones
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 13,
    },
    actionIcon: {
        width: 42, height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextWrap: { flex: 1 },
    actionLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionSub: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
    },
});

export default StateSelector;