import React, { useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { backupService } from '../services/backupService';
import { tabBarStyle } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
export default function SettingsScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [backupInfo, setBackupInfo] = useState({ exists: false });

    useFocusEffect(
        useCallback(() => {
            navigation.getParent()?.setOptions({
                tabBarStyle: tabBarStyle
            });
        }, [navigation])
    );

    useEffect(() => {
        loadBackupInfo();
    }, []);

    const loadBackupInfo = async () => {
        const info = await backupService.getBackupInfo();
        setBackupInfo(info);
    };

    const handleSaveBackup = async () => {
        setLoading(true);
        await backupService.saveBackup();
        setLoading(false);
        await loadBackupInfo();
    };

    const handleRestoreBackup = async () => {
        setLoading(true);
        await backupService.restoreBackup();
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'transparent']}
                style={styles.header}
            >
                <Text style={styles.title}>Ajustes</Text>
                <Text style={styles.subtitle}>Configuración y respaldos</Text>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Base de datos actual</Text>
                    {backupInfo.exists ? (
                        <>
                            <Text style={styles.infoText}>Tamaño: {backupInfo.size} MB</Text>
                            <Text style={styles.infoSubtext}>
                                Última modificación: {backupInfo.lastModified}
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.infoSubtext}>No hay datos guardados</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Respaldo de datos</Text>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleSaveBackup}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#60A5FA" />
                            ) : (
                                <Ionicons name="cloud-upload-outline" size={24} color="#60A5FA" />
                            )}
                        </View>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>Guardar backup</Text>
                            <Text style={styles.optionSubtitle}>Copia de seguridad de tu biblioteca</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleRestoreBackup}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(74, 222, 128, 0.2)' }]}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#4ADE80" />
                            ) : (
                                <Ionicons name="cloud-download-outline" size={24} color="#4ADE80" />
                            )}
                        </View>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>Restaurar backup</Text>
                            <Text style={styles.optionSubtitle}>Recuperar datos desde un respaldo</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
                        <Text style={[styles.infoTitle, { marginBottom: 0, marginLeft: 8 }]}>Acerca de los backups</Text>
                    </View>
                    <Text style={styles.infoDescription}>
                        • Los backups se guardan como archivos .db que contienen toda tu biblioteca musical.{'\n'}
                        • Puedes guardarlos en cualquier ubicación de tu dispositivo.{'\n'}
                        • Al restaurar, se crea un backup automático de seguridad.{'\n'}
                        • La app necesita reiniciarse después de restaurar.
                    </Text>
                </View>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Bitácora Musical v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
        marginTop: 4,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    infoCard: {
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginBottom: 8,
    },
    infoText: {
        color: 'white',
        fontSize: 16,
    },
    infoSubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 4,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoDescription: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        lineHeight: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionSubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    versionContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    versionText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
});