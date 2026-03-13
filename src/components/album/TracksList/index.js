import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TrackItem from './TrackItem';

const TracksList = ({
    tracks,
    isSaved,
    onTrackPress,
    expandedComments = {},
    onToggleComment,
    dominantColor,
}) => {
    if (!tracks || tracks.length === 0) {
        return null;
    }

    const groupedTracks = useMemo(() => {
        const groups = [];
        let currentGroup = [];
        let lastTrackNumber = null;
        let currentDiskNumber = 1;

        tracks.forEach((track, index) => {
            const currentNumber = track.track_number || index + 1;

    
            const isNewDisk = lastTrackNumber !== null && (
                currentNumber < lastTrackNumber ||
                (currentNumber === 1 && lastTrackNumber > 1)
            );

            if (isNewDisk) {
                if (currentGroup.length > 0) {
                    groups.push({
                        diskNumber: currentDiskNumber,
                        tracks: [...currentGroup]
                    });
                    currentDiskNumber++;
                    currentGroup = [];
                }
            }

            currentGroup.push({
                ...track,
                displayNumber: currentNumber,
                diskNumber: currentDiskNumber
            });

            lastTrackNumber = currentNumber;
        });

        if (currentGroup.length > 0) {
            groups.push({
                diskNumber: currentDiskNumber,
                tracks: currentGroup
            });
        }

        console.log('📀 Discos detectados:', groups.length);
        groups.forEach((disk, i) => {
            console.log(`   Disco ${disk.diskNumber}: ${disk.tracks.length} tracks`);
        });

        return groups;
    }, [tracks]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Canciones</Text>

            {groupedTracks.map((disk, diskIndex) => (
                <View key={`disk-${disk.diskNumber}`}>
                    {groupedTracks.length > 1 && (
                        <View style={styles.diskSeparator}>
                            <View style={styles.diskLine} />
                            <Text style={styles.diskText}>Disco {disk.diskNumber}</Text>
                            <View style={styles.diskLine} />
                        </View>
                    )}

                    {disk.tracks.map((track, trackIndex) => (
                        <TrackItem
                            key={track.id || `track-${disk.diskNumber}-${trackIndex}`}
                            track={track}
                            index={trackIndex}
                            isSaved={isSaved}
                            isExpanded={expandedComments[track.id]}
                            onPress={onTrackPress}
                            onToggleComment={onToggleComment}
                            showDiskNumber={groupedTracks.length > 1}
                            currentDisk={disk.diskNumber}
                            dominantColor={dominantColor}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    diskSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    diskLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    diskText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 12,
        letterSpacing: 1,
    },
});

export default TracksList;