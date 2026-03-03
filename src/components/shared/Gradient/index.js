// components/shared/Gradient/index.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Componente Gradient reutilizable
 * 
 * @param {Object} props
 * @param {string[]} props.colors - Array de colores para el gradiente
 * @param {Object} props.style - Estilos adicionales
 * @param {Object} props.start - Punto de inicio { x, y }
 * @param {Object} props.end - Punto de fin { x, y }
 * @param {React.ReactNode} props.children - Contenido hijo
 */
const Gradient = ({
    colors = ['transparent', 'rgba(0,0,0,0.8)'],
    start = { x: 0, y: 0 },
    end = { x: 0, y: 1 },
    style,
    children,
    ...props
}) => {
    return (
        <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={style}
            {...props}
        >
            {children}
        </LinearGradient>
    );
};

export default Gradient;