import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, TextInput,
    Modal, StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withSpring, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import BlurView from '../../shared/BlurView';
import { getRatingColor, getDecimalColor } from '../../shared/RatingBadge';

const { width, height } = Dimensions.get('window');
const MODAL_WIDTH = width - 40;
const BTN = (MODAL_WIDTH - 48 - 36) / 5; // 5 columnas con padding y gaps

// ─── Botón numérico animado ───────────────────────────────────────────────────
const NumBtn = ({ value, label, selected, onPress, color }) => {
    const scale = useSharedValue(1);

    const handlePress = () => {
        scale.value = withSequence(
            withSpring(0.88, { damping: 10, stiffness: 300 }),
            withSpring(1,    { damping: 10, stiffness: 300 })
        );
        onPress();
    };

    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={anim}>
            <TouchableOpacity
                onPress={handlePress}
                style={[
                    styles.numBtn,
                    { width: BTN, height: BTN, backgroundColor: color + '18' },
                    selected && { backgroundColor: color, borderColor: color },
                ]}
            >
                <Text style={[styles.numText, { color: selected ? '#000' : color }]}>
                    {label ?? value}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Preview animado ──────────────────────────────────────────────────────────
const Preview = ({ value, color }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSequence(
            withSpring(1.15, { damping: 8 }),
            withSpring(1,    { damping: 8 })
        );
    }, [value]);

    const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={anim}>
            <Text style={[styles.previewNum, { color }]}>{value}</Text>
        </Animated.View>
    );
};

// ─── Modal principal ──────────────────────────────────────────────────────────
const RatingModal = ({ visible, onClose, onSave, currentRating, trackTitle }) => {
    const [integer, setInteger] = useState(5);
    const [decimal, setDecimal] = useState(0);
    const [comment, setComment] = useState('');

    const slideY  = useSharedValue(60);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            slideY.value  = withSpring(0,  { damping: 18, stiffness: 200 });
            opacity.value = withTiming(1,  { duration: 180, easing: Easing.out(Easing.ease) });

            if (currentRating) {
                setInteger(Math.floor(currentRating));
                setDecimal(Math.round((currentRating - Math.floor(currentRating)) * 10));
            } else {
                setInteger(5);
                setDecimal(0);
            }
            setComment('');
        } else {
            slideY.value  = withTiming(60, { duration: 150 });
            opacity.value = withTiming(0,  { duration: 150 });
        }
    }, [visible, currentRating]);

    const backdropAnim = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const cardAnim     = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: slideY.value }],
    }));

    const finalRating  = integer === 10 ? 10 : integer + decimal / 10;
    const ratingColor  = getDecimalColor(finalRating);
    const displayValue = integer === 10 ? '10' : `${integer}.${decimal}`;

    const DECIMALS = integer === 10 ? [0] : [0,1,2,3,4,5,6,7,8,9];

    return (
        <Modal visible={visible} transparent animationType="none">
            <KeyboardAvoidingView
                style={styles.root}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Backdrop */}
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropAnim]}>
                    <BlurView intensity={25} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

                {/* Card */}
                <Animated.View style={[styles.card, cardAnim]}>

                    {/* Header con preview integrado */}
                    <View style={[styles.header, { borderBottomColor: ratingColor + '30' }]}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.trackName} numberOfLines={1}>{trackTitle}</Text>
                            <Text style={styles.subtitle}>Calificar canción</Text>
                        </View>
                        {/* Preview de nota en el header */}
                        <View style={styles.headerRight}>
                            <Preview value={displayValue} color={ratingColor} />
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        {/* Grid 5×2 de números */}
                        <Text style={styles.label}>Nota</Text>
                        <View style={styles.numGrid}>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                <NumBtn
                                    key={n}
                                    value={n}
                                    label={String(n)}
                                    selected={integer === n}
                                    onPress={() => { setInteger(n); if (n === 10) setDecimal(0); }}
                                    color={getRatingColor(n)}
                                />
                            ))}
                        </View>

                        {/* Decimales — fila horizontal compacta */}
                        {integer < 10 && (
                            <>
                                <Text style={styles.label}>Decimal</Text>
                                <View style={styles.decimalRow}>
                                    {DECIMALS.map(d => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[
                                                styles.decBtn,
                                                decimal === d && { backgroundColor: ratingColor, borderColor: ratingColor },
                                            ]}
                                            onPress={() => setDecimal(d)}
                                        >
                                            <Text style={[
                                                styles.decText,
                                                { color: decimal === d ? '#000' : ratingColor },
                                            ]}>
                                                .{d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Comentario */}
                        <Text style={styles.label}>Comentario <Text style={styles.optional}>(opcional)</Text></Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="¿Qué opinas de esta canción?"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />

                        {/* Botones */}
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: ratingColor }]}
                                onPress={() => { onSave(finalRating, comment); onClose(); }}
                            >
                                <Ionicons name="checkmark" size={18} color="#000" />
                                <Text style={styles.saveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 24,
    },
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
        marginHorizontal: 16,
        backgroundColor: '#111',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        gap: 10,
    },
    headerLeft: { flex: 1 },
    trackName: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    headerRight: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
    },
    previewNum: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
    },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Body
    body: { padding: 20 },
    label: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    optional: {
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 0,
    },

    // Grid números
    numGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    numBtn: {
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    numText: {
        fontSize: 17,
        fontWeight: '700',
    },

    // Decimales
    decimalRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    decBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 44,
        alignItems: 'center',
    },
    decText: {
        fontSize: 14,
        fontWeight: '700',
    },

    // Comentario
    commentInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 14,
        color: 'white',
        fontSize: 14,
        minHeight: 80,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 20,
    },

    // Botones
    btnRow: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    cancelText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
    saveBtn: {
        flex: 2, paddingVertical: 14, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
    },
    saveText: { color: '#000', fontSize: 15, fontWeight: '800' },
});

export default RatingModal;