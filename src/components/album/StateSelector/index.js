import React, { useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    Modal, Alert, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import BlurView from '../../shared/BlurView';

const { width, height } = Dimensions.get('window');

const STATES = [
    { id: 'listened', label: 'Escuchado',    icon: 'checkmark-circle', color: '#4ADE80' },
    { id: 'listening', label: 'Escuchando',  icon: 'headset',          color: '#60A5FA' },
    { id: 'to_listen', label: 'Por escuchar', icon: 'time',            color: '#FBBF24' },
];

const StateSelector = ({
    visible, onClose, onSelect,
    onToggleFavorite, onDelete, onRefresh,
    currentState, isFavorite,
}) => {
    const translateY = useSharedValue(400);
    const opacity    = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value    = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        } else {
            opacity.value    = withTiming(0, { duration: 180 });
            translateY.value = withTiming(400, { duration: 220 });
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    const handleDelete = () => {
        onClose();
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
                onPress={onClose}
                activeOpacity={1}
            />

            {/* Sheet */}
            <Animated.View style={[styles.sheet, sheetStyle]}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Estado actual — pill en el header */}
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
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                {/* Estados — 3 cards horizontales */}
                <View style={styles.statesRow}>
                    {STATES.map(s => {
                        const active = currentState === s.id;
                        return (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.stateCard,
                                    active && { borderColor: s.color, backgroundColor: s.color + '15' },
                                ]}
                                onPress={() => { onSelect(s.id); onClose(); }}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.stateIconWrap, { backgroundColor: s.color + (active ? '30' : '15') }]}>
                                    <Ionicons name={s.icon} size={22} color={s.color} />
                                </View>
                                <Text style={[styles.stateLabel, active && { color: 'white', fontWeight: '700' }]}>
                                    {s.label}
                                </Text>
                                {active && (
                                    <View style={[styles.activeCheck, { backgroundColor: s.color }]}>
                                        <Ionicons name="checkmark" size={10} color="#000" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.divider} />

                {/* Acciones secundarias */}
                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => { onToggleFavorite(); onClose(); }}
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
                    onPress={() => { onRefresh(); onClose(); }}
                >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(147,51,234,0.12)' }]}>
                        <Ionicons name="cloud-download-outline" size={20} color="#A78BFA" />
                    </View>
                    <View style={styles.actionTextWrap}>
                        <Text style={styles.actionLabel}>Actualizar información</Text>
                        <Text style={styles.actionSub}>Sincronizar con Deezer</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Eliminar */}
                <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                        <Ionicons name="trash-outline" size={20} color="#f87171" />
                    </View>
                    <View style={styles.actionTextWrap}>
                        <Text style={[styles.actionLabel, { color: '#f87171' }]}>Eliminar álbum</Text>
                        <Text style={styles.actionSub}>Se eliminan también las canciones</Text>
                    </View>
                </TouchableOpacity>

                {/* Safe area */}
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