// screens/TierListScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Dimensions, FlatList, Alert, ActivityIndicator,
    Modal, ScrollView, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { executeDBOperation } from '../database/Index';

const { width } = Dimensions.get('window');

const TIERS = [
    { id: 'S', label: 'S', color: '#FF4D4D' },
    { id: 'A', label: 'A', color: '#FF8C00' },
    { id: 'B', label: 'B', color: '#FFD700' },
    { id: 'C', label: 'C', color: '#4ADE80' },
    { id: 'D', label: 'D', color: '#60A5FA' },
    { id: 'unranked', label: '?', color: 'rgba(255,255,255,0.35)' },
];

const COVER_SIZE = Math.floor((width - 56 - 20) / 5);
const LABEL_W = 48;
const SHARE_COVER = 52;

const TAB_BAR_STYLE = {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 0,
    elevation: 0,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
};

// ─── Fila de tier ──────────────────────────────────────────────────────────
const TierRow = React.memo(({ tier, albums, onAlbumPress, selectedAlbumId }) => (
    <View style={styles.tierRow}>
        <View style={[styles.tierLabel, {
            backgroundColor: tier.id === 'unranked' ? 'rgba(255,255,255,0.1)' : tier.color
        }]}>
            <Text style={styles.tierLabelText}>{tier.label}</Text>
        </View>
        <View style={[styles.tierContent, { backgroundColor: tier.color + '18' }]}>
            {albums.length === 0 ? (
                <Text style={styles.emptyTier}>—</Text>
            ) : (
                <View style={styles.tierList}>
                    {albums.map(album => (
                        <TouchableOpacity
                            key={album.id}
                            style={[styles.coverWrap, selectedAlbumId === album.id && styles.coverSelected]}
                            onPress={() => onAlbumPress(album, tier.id)}
                            activeOpacity={0.75}
                        >
                            <Image
                                source={{ uri: album.cover }}
                                style={{ width: COVER_SIZE, height: COVER_SIZE, borderRadius: 4 }}
                                contentFit="cover"
                            />
                            {selectedAlbumId === album.id && (
                                <View style={styles.coverOverlay}>
                                    <Ionicons name="checkmark" size={14} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    </View>
));

// ─── Card para compartir (fuera de pantalla) ───────────────────────────────
const ShareTierCard = ({ tierData, title }) => {
    const ranked = TIERS.filter(t => t.id !== 'unranked' && (tierData[t.id]?.length || 0) > 0);

    return (
        <View style={shareStyles.card}>
            <LinearGradient
                colors={['#1a1a1a', '#0a0a0a']}
                style={StyleSheet.absoluteFillObject}
            />
            <Text style={shareStyles.title}>{title || 'Tier List'}</Text>

            {ranked.map(tier => (
                <View key={tier.id} style={shareStyles.row}>
                    <View style={[shareStyles.label, { backgroundColor: tier.color }]}>
                        <Text style={shareStyles.labelText}>{tier.label}</Text>
                    </View>
                    <View style={shareStyles.covers}>
                        {tierData[tier.id].slice(0, 8).map(album => (
                            <Image
                                key={album.id}
                                source={{ uri: album.cover }}
                                style={shareStyles.cover}
                                contentFit="cover"
                            />
                        ))}
                        {tierData[tier.id].length > 8 && (
                            <View style={shareStyles.more}>
                                <Text style={shareStyles.moreText}>+{tierData[tier.id].length - 8}</Text>
                            </View>
                        )}
                    </View>
                </View>
            ))}

            <Text style={shareStyles.footer}>WaxLog</Text>
        </View>
    );
};

const SHARE_W = width - 40;

const shareStyles = StyleSheet.create({
    card: {
        width: SHARE_W,
        padding: 20,
        borderRadius: 20,
        overflow: 'hidden',
        gap: 6,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    label: {
        width: 42,
        height: 42,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    labelText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
    },
    covers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
    },
    cover: {
        width: SHARE_COVER,
        height: SHARE_COVER,
        borderRadius: 6,
    },
    more: {
        width: SHARE_COVER,
        height: SHARE_COVER,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginTop: 12,
        textAlign: 'right',
    },
});

// ─── Pantalla principal ────────────────────────────────────────────────────
export default function TierListScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [tierData, setTierData] = useState({ S: [], A: [], B: [], C: [], D: [], unranked: [] });
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selectedFromTier, setSelectedFromTier] = useState(null);
    const [sharing, setSharing] = useState(false);
    const [listTitle, setListTitle] = useState('Tier List');
    const [editingTitle, setEditingTitle] = useState(false);
    const shareRef = useRef(null);

    // Filtros
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterMode, setFilterMode] = useState('all');
    const [filterValue, setFilterValue] = useState(null);
    const [genres, setGenres] = useState([]);
    const [artists, setArtists] = useState([]);

    useFocusEffect(
        useCallback(() => {
            navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
        }, [navigation])
    );

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await executeDBOperation(async (db) => {
                const albums = await db.getAllAsync(`
                    SELECT a.id, a.title, a.cover, a.genres,
                           ar.name as artist_name, ar.id as artist_id
                    FROM albums a
                    LEFT JOIN artists ar ON a.artist_id = ar.id
                    WHERE a.cover IS NOT NULL AND a.state = 'listened'
                    ORDER BY a.downloaded_at DESC
                `);

                const clean = (albums || []).map(a => ({
                    id: parseInt(a.id, 10),
                    title: String(a.title || ''),
                    cover: String(a.cover || ''),
                    genres: a.genres || null,
                    artist_name: String(a.artist_name || ''),
                    artist_id: a.artist_id ? parseInt(a.artist_id, 10) : null,
                }));

                setTierData({ S: [], A: [], B: [], C: [], D: [], unranked: clean });

                const genreSet = new Set();
                clean.forEach(a => {
                    if (a.genres) {
                        try {
                            JSON.parse(a.genres).forEach(g => {
                                const name = typeof g === 'object' ? g.name : g;
                                if (name) genreSet.add(name);
                            });
                        } catch (_) {}
                    }
                });
                setGenres([...genreSet].sort());

                const artistMap = new Map();
                clean.forEach(a => {
                    if (a.artist_id && a.artist_name) artistMap.set(a.artist_id, a.artist_name);
                });
                setArtists([...artistMap.entries()]
                    .map(([id, name]) => ({ id, name }))
                    .sort((a, b) => a.name.localeCompare(b.name)));
            });
        } catch (err) {
            if (__DEV__) console.error('Error cargando tier list:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAlbumPress = useCallback((album, tierId) => {
        if (selectedAlbum?.id === album.id) {
            setSelectedAlbum(null);
            setSelectedFromTier(null);
            return;
        }
        setSelectedAlbum(album);
        setSelectedFromTier(tierId);
    }, [selectedAlbum]);

    const moveToTier = useCallback((targetTier) => {
        if (!selectedAlbum) return;
        if (targetTier === selectedFromTier) {
            setSelectedAlbum(null);
            setSelectedFromTier(null);
            return;
        }
        setTierData(prev => {
            const next = {};
            Object.entries(prev).forEach(([tid, albums]) => {
                next[tid] = albums.filter(a => a.id !== selectedAlbum.id);
            });
            next[targetTier] = [...next[targetTier], { ...selectedAlbum }];
            return next;
        });
        setSelectedAlbum(null);
        setSelectedFromTier(null);
    }, [selectedAlbum, selectedFromTier]);

    const handleShare = async () => {
        const hasRanked = TIERS.filter(t => t.id !== 'unranked').some(t => tierData[t.id]?.length > 0);
        if (!hasRanked) {
            Alert.alert('Tier list vacía', 'Agrega álbumes a las tiers antes de compartir');
            return;
        }
        try {
            setSharing(true);
            const uri = await shareRef.current.capture();
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Mi Tier List — WaxLog',
            });
        } catch (err) {
            if (__DEV__) console.error('Error compartiendo tier list:', err);
        } finally {
            setSharing(false);
        }
    };

    const resetAll = () => {
        Alert.alert('Reiniciar', '¿Mover todos los álbumes a sin clasificar?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Reiniciar', style: 'destructive',
                onPress: () => {
                    const all = Object.values(tierData).flat();
                    setTierData({ S: [], A: [], B: [], C: [], D: [], unranked: all });
                    setSelectedAlbum(null);
                }
            },
        ]);
    };

    const getFilteredData = useCallback(() => {
        if (filterMode === 'all' || !filterValue) return tierData;
        const result = {};
        Object.entries(tierData).forEach(([tid, albums]) => {
            result[tid] = albums.filter(a => {
                if (filterMode === 'genre') {
                    if (!a.genres) return false;
                    try {
                        return JSON.parse(a.genres).some(g => {
                            const name = typeof g === 'object' ? g.name : g;
                            return name === filterValue;
                        });
                    } catch (_) { return false; }
                }
                return filterMode === 'artist' ? a.artist_id === filterValue : true;
            });
        });
        return result;
    }, [tierData, filterMode, filterValue]);

    const filteredData = getFilteredData();
    const totalRanked = TIERS.filter(t => t.id !== 'unranked').reduce((acc, t) => acc + (tierData[t.id]?.length || 0), 0);
    const filterLabel = filterMode === 'all' ? '' :
        filterMode === 'genre' ? filterValue :
        artists.find(a => a.id === filterValue)?.name || '';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Cargando álbumes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['rgba(255,255,255,0.04)', 'transparent']} style={styles.headerBg} pointerEvents="none" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    {editingTitle ? (
                        <TextInput
                            style={styles.titleInput}
                            value={listTitle}
                            onChangeText={setListTitle}
                            onBlur={() => setEditingTitle(false)}
                            onSubmitEditing={() => setEditingTitle(false)}
                            autoFocus
                            selectTextOnFocus
                            returnKeyType="done"
                            maxLength={30}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setEditingTitle(true)} activeOpacity={0.7}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>{listTitle}</Text>
                                <Ionicons name="pencil" size={13} color="rgba(255,255,255,0.3)" />
                            </View>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.subtitle}>
                        {totalRanked} clasificados · {tierData.unranked?.length || 0} sin clasificar
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.iconBtn, filterMode !== 'all' && styles.iconBtnActive]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="funnel" size={17} color={filterMode !== 'all' ? '#60A5FA' : 'rgba(255,255,255,0.5)'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={resetAll}>
                        <Ionicons name="refresh-outline" size={17} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.shareBtn, sharing && { opacity: 0.6 }]}
                        onPress={handleShare}
                        disabled={sharing}
                    >
                        {sharing
                            ? <ActivityIndicator size="small" color="white" />
                            : <Ionicons name="share-social" size={17} color="white" />
                        }
                    </TouchableOpacity>
                </View>
            </View>

            {/* Instrucción selección */}
            {selectedAlbum && (
                <View style={styles.instructionBar}>
                    <Image source={{ uri: selectedAlbum.cover }} style={styles.instructionCover} contentFit="cover" />
                    <Text style={styles.instructionText} numberOfLines={1}>
                        Toca un tier para mover{' '}
                        <Text style={{ fontWeight: '700', color: 'white' }}>{selectedAlbum.title}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => { setSelectedAlbum(null); setSelectedFromTier(null); }}>
                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Tiers */}
            <FlatList
                data={TIERS}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                renderItem={({ item: tier }) => (
                    <TouchableOpacity
                        activeOpacity={selectedAlbum ? 0.7 : 1}
                        onPress={() => selectedAlbum && moveToTier(tier.id)}
                    >
                        <TierRow
                            tier={tier}
                            albums={filteredData[tier.id] || []}
                            onAlbumPress={handleAlbumPress}
                            selectedAlbumId={selectedAlbum?.id}
                        />
                    </TouchableOpacity>
                )}
                ListFooterComponent={<View style={{ height: 100 }} />}
            />

            {/* ShareCard fuera de pantalla */}
            <View style={styles.offscreen}>
                <ViewShot ref={shareRef} options={{ format: 'png', quality: 1, pixelRatio: 3 }}>
                    <ShareTierCard tierData={tierData} title={listTitle} />
                </ViewShot>
            </View>

            {/* Modal de filtros */}
            <Modal visible={showFilterModal} transparent animationType="slide">
                <TouchableOpacity style={styles.filterModalBg} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
                <View style={styles.filterSheet}>
                    <View style={styles.filterHandle} />
                    <Text style={styles.filterTitle}>Filtrar álbumes</Text>

                    <TouchableOpacity
                        style={[styles.filterOption, filterMode === 'all' && styles.filterOptionActive]}
                        onPress={() => { setFilterMode('all'); setFilterValue(null); setShowFilterModal(false); }}
                    >
                        <Ionicons name="albums-outline" size={16} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.filterOptionText}>Todos los álbumes</Text>
                        {filterMode === 'all' && <Ionicons name="checkmark" size={16} color="white" />}
                    </TouchableOpacity>

                    <View style={styles.filterDivider} />
                    <Text style={styles.filterSectionLabel}>Por género</Text>
                    <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                        {genres.map(genre => (
                            <TouchableOpacity
                                key={genre}
                                style={[styles.filterOption, filterMode === 'genre' && filterValue === genre && styles.filterOptionActive]}
                                onPress={() => { setFilterMode('genre'); setFilterValue(genre); setShowFilterModal(false); }}
                            >
                                <Ionicons name="pricetag-outline" size={14} color="rgba(255,255,255,0.4)" />
                                <Text style={styles.filterOptionText}>{genre}</Text>
                                {filterMode === 'genre' && filterValue === genre && <Ionicons name="checkmark" size={16} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.filterDivider} />
                    <Text style={styles.filterSectionLabel}>Por artista</Text>
                    <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
                        {artists.map(artist => (
                            <TouchableOpacity
                                key={artist.id}
                                style={[styles.filterOption, filterMode === 'artist' && filterValue === artist.id && styles.filterOptionActive]}
                                onPress={() => { setFilterMode('artist'); setFilterValue(artist.id); setShowFilterModal(false); }}
                            >
                                <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.4)" />
                                <Text style={styles.filterOptionText}>{artist.name}</Text>
                                {filterMode === 'artist' && filterValue === artist.id && <Ionicons name="checkmark" size={16} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={{ height: 24 }} />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
    offscreen: { position: 'absolute', top: -9999, left: -9999, opacity: 0 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 12,
        paddingHorizontal: 12,
        gap: 10,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    headerCenter: { flex: 1, minWidth: 0 },
    subtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
    iconBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    iconBtnActive: { backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: '#60A5FA40' },
    shareBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },

    instructionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 8,
        marginBottom: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    instructionCover: { width: 32, height: 32, borderRadius: 6 },
    instructionText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 13 },

    scrollContent: { paddingHorizontal: 8, paddingTop: 2 },

    tierRow: {
        flexDirection: 'row',
        marginBottom: 3,
        borderRadius: 10,
        overflow: 'hidden',
        minHeight: COVER_SIZE + 10,
    },
    tierLabel: {
        width: LABEL_W,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierLabelText: {
        color: 'white', fontSize: 22, fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    tierContent: { flex: 1, minHeight: COVER_SIZE + 10, justifyContent: 'center' },
    tierList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 5,
        gap: 3,
    },
    emptyTier: { color: 'rgba(255,255,255,0.1)', fontSize: 20, paddingHorizontal: 16, paddingVertical: 12 },

    coverWrap: { borderRadius: 6, margin: 2 },
    coverSelected: {
        borderWidth: 2, borderColor: 'white', borderRadius: 6,
        shadowColor: 'white', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
    },

    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    title: { color: 'white', fontSize: 18, fontWeight: '700' },
    titleInput: {
        color: 'white', fontSize: 18, fontWeight: '700',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 0, minWidth: 80,
    },

    filterModalBg: { flex: 1 },
    filterSheet: {
        backgroundColor: '#161616',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 14,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        maxHeight: '80%',
    },
    filterHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 18,
    },
    filterTitle: { color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 12 },
    filterSectionLabel: {
        color: 'rgba(255,255,255,0.35)', fontSize: 11,
        fontWeight: '700', letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 4, marginTop: 4,
    },
    filterOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10,
    },
    filterOptionActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
    filterOptionText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    filterDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
});