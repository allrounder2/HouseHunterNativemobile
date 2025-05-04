// File: src/features/wishlists/WishlistItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'; // Removed Platform as it wasn't used
import Dropdown from '../../components/Dropdown'; // Adjust path if needed
import { Ionicons } from '@expo/vector-icons';

// --- VVV Import Constant from appConstants VVV ---
import { IMPORTANCE_LEVELS_ARRAY } from '../../constants/appConstants'; // Adjust path if needed
// --- ^^^ Import Constant from appConstants ^^^ ---

// --- REMOVED Local Constant Definition ---
// export const IMPORTANCE_LEVELS_ARRAY = [ ... ];
// --- --------------------------------- ---

function WishlistItemComponent({ item, onUpdateImportance, onDelete }) {

    // Basic validation for item prop
    if (!item || typeof item !== 'object') {
        console.warn("[WishlistItem] Received invalid item prop:", item);
        return null; // Don't render if item is invalid
    }

    // Find if the current importance value exists in the options array
    const selectedImportanceObj = IMPORTANCE_LEVELS_ARRAY.find(level => level.value === item.importance);
    // Use the valid value if found, otherwise default to null (RNPickerSelect should handle this)
    const currentImportanceValue = selectedImportanceObj ? item.importance : null;

    // Basic check for callback functions
    const handleImportanceChange = (value) => {
        if (typeof onUpdateImportance === 'function') {
            onUpdateImportance(item.id, value);
        } else {
            console.warn("[WishlistItem] onUpdateImportance is not a function");
        }
    };

    const handleDeletePress = () => {
        if (typeof onDelete === 'function') {
            onDelete(item.id);
        } else {
            console.warn("[WishlistItem] onDelete is not a function");
        }
    };


    return (
        <View style={styles.itemContainer}>
            <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
                {item?.criterion || 'Unnamed Criterion'}
            </Text>

            <View style={styles.dropdownContainer}>
                <Dropdown
                    options={IMPORTANCE_LEVELS_ARRAY} // Use imported constant
                    onValueChange={handleImportanceChange} // Use wrapped handler
                    value={currentImportanceValue} // Pass valid value or null
                    // --- REMOVED placeholder prop ---
                    // placeholder={...} // Removed this line
                    // ------------------------------
                    style={{ pickerContainer: styles.pickerStyle }} // Pass internal style if needed
                 />
            </View>

            <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
            </TouchableOpacity>
        </View>
    );
}

// Wrap with React.memo for performance optimization
const WishlistItem = React.memo(WishlistItemComponent);

// --- Styles (Keep existing styles) ---
const styles = StyleSheet.create({
    itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    itemText: { flex: 0.4, fontSize: 15, color: '#333', marginRight: 8 },
    dropdownContainer: { flex: 0.45, marginRight: 8 },
    pickerStyle: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, minHeight: 35, justifyContent: 'center' }, // Example style pass-through
    deleteButton:{ flex: 0.1, padding: 5, alignItems: 'center', justifyContent: 'center' },
});

export default WishlistItem;