// File: src/features/wishlists/WishlistItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Dropdown from '../../components/Dropdown';
import { Ionicons } from '@expo/vector-icons';

// --- VVV Define IMPORTANCE_LEVELS LOCALLY AGAIN VVV ---
export const IMPORTANCE_LEVELS_ARRAY = [
    { label: 'Important', value: 'important' },
    { label: 'Must Have', value: 'mustHave' },
    { label: 'Very Important', value: 'veryImportant' },
    { label: 'Nice to Have', value: 'niceToHave' },
    { label: 'Optional', value: 'optional' },
];
// --- ^^^ Define IMPORTANCE_LEVELS LOCALLY AGAIN ^^^ ---

function WishlistItemComponent({ item, onUpdateImportance, onDelete }) {
    // Find label safely, handle case where item.importance might not match
    const selectedImportanceObj = IMPORTANCE_LEVELS_ARRAY.find(level => level.value === item.importance);
    const currentImportanceValue = selectedImportanceObj ? item.importance : null; // Use null if not found in options

    return (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">{item?.criterion || 'Missing Name'}</Text>
            <View style={styles.dropdownContainer}>
                <Dropdown
                    options={IMPORTANCE_LEVELS_ARRAY} // Use local constant
                    onValueChange={(value) => onUpdateImportance(item.id, value)}
                    value={currentImportanceValue} // Pass valid value or null
                    // Provide placeholder only if current value is effectively null/undefined
                    placeholder={currentImportanceValue == null ? {label: "Select...", value: null} : undefined}
                    style={{ pickerContainer: styles.pickerStyle }}
                 />
            </View>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
        </View>
    );
}

const WishlistItem = React.memo(WishlistItemComponent);

// Styles remain the same
const styles = StyleSheet.create({ itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' }, itemText: { flex: 0.4, fontSize: 15, color: '#333', marginRight: 8 }, dropdownContainer: { flex: 0.45, marginRight: 8 }, pickerStyle: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, minHeight: 35, justifyContent: 'center' }, deleteButton:{ flex: 0.1, padding: 5, alignItems: 'center', justifyContent: 'center' }, });

export default WishlistItem;