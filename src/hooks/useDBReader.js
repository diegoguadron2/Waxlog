// hooks/useDBReader.js - VERSIÓN CORREGIDA
import { useState, useRef, useCallback, useEffect } from 'react';
import { executeDBOperation } from '../database/Index';
import { useFocusEffect } from '@react-navigation/native';

// Variable global para controlar recargas
let lastFocusTime = 0;
const FOCUS_THROTTLE = 1000; // 1 segundo

export const useDBReader = (options = {}) => {
    const {
        onLoad,           // Función que ejecuta las consultas
        initialData = null, // Datos iniciales
        autoLoad = true,  // Cargar al montar
        deps = [],        // Dependencias para recargar
        throttleKey = 'default', // Clave para throttle global
    } = options;

    const [loading, setLoading] = useState(autoLoad);
    const [data, setData] = useState(initialData);
    const [error, setError] = useState(null);

    const mountedRef = useRef(true);
    const isLoadingRef = useRef(false);
    const hasLoadedRef = useRef(false); // Para evitar cargas múltiples

    const load = useCallback(async (...args) => {
        if (isLoadingRef.current || !mountedRef.current) return;

        console.log(`📥 [${throttleKey}] Iniciando carga...`); // 👈 NUEVO LOG
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 [${throttleKey}] Ejecutando query...`); // 👈 NUEVO LOG
            const result = await executeDBOperation(async (db) => {
                return await onLoad(db, ...args);
            });
            console.log(`✅ [${throttleKey}] Resultado:`, result); // 👈 NUEVO LOG

            if (mountedRef.current) {
                setData(result);
                hasLoadedRef.current = true;
            }
        } catch (err) {
            console.error(`❌ [${throttleKey}] Error:`, err); // 👈 NUEVO LOG
            if (mountedRef.current) {
                setError(err);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
            isLoadingRef.current = false;
        }
    }, [onLoad, throttleKey]);

    const refresh = useCallback(async (...args) => {
        return load(...args);
    }, [load]);

    // Efecto de montaje con focus - SOLO UNA VEZ
    useFocusEffect(
        useCallback(() => {
            // Si ya cargó y no se requiere autoLoad, no hacer nada
            if (!autoLoad) return;

            // Throttle global para evitar múltiples recargas
            const now = Date.now();
            if (now - lastFocusTime < FOCUS_THROTTLE) {
                console.log(`⏱️ [${throttleKey}] Recarga ignorada (throttle)`);
                return;
            }
            lastFocusTime = now;

            console.log(`📱 [${throttleKey}] Cargando datos...`);
            load();

            return () => { };
        }, [load, autoLoad, throttleKey])
    );

    // Efecto de desmontaje
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    return {
        data,
        loading,
        error,
        refresh,
        setData,
    };
};