import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const TabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && styles.activeTab
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? 'white' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel
              ]} numberOfLines={1}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: tab.color + '20' }]}>
                <Text style={[styles.tabBadgeText, { color: tab.color }]}>
                  {tab.count}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 70,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: 'white',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TabBar;