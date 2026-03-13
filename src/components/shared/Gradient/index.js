import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Componente Gradient reutilizable
 * 
 * @param {Object} props
 * @param {string[]} props.colors 
 * @param {Object} props.style 
 * @param {Object} props.start 
 * @param {Object} props.end 
 * @param {React.ReactNode} props.children
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