// File: src/features/wishlists/WishlistForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Button from '../../components/Button';
import WishlistItem, { IMPORTANCE_LEVELS_ARRAY } from './WishlistItem'; // Import from corrected path, includes CONSTANT
import { Ionicons } from '@expo/vector-icons';

const PREDEFINED_FEATURES = [ 'Good Location', 'Large Backyard', 'Modern Kitchen', 'Spacious Bedrooms','Walkable Neighborhood', 'Good Schools', 'Close to Amenities', 'Garage','Updated Bathroom', 'Quiet Street', 'Natural Light', 'Finished Basement'];

const defaultImportance = (Array.isArray(IMPORTANCE_LEVELS_ARRAY) && IMPORTANCE_LEVELS_ARRAY.length > 0) ? IMPORTANCE_LEVELS_ARRAY[0].value : 'important';

function WishlistForm({ initialData, onSave, onCancel }) {
    console.log("[WishlistForm] Rendering/Mounting.");
    const [name, setName] = useState('');
    const [items, setItems] = useState([]); // Initialize empty
    const [customFeatureText, setCustomFeatureText] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Keep loading state for initial data load

    const isEditing = initialData != null;

    // Effect to load initial data
    useEffect(() => {
        console.log("[WishlistForm] useEffect - Handling initialData. isEditing:", isEditing);
        setIsLoading(true); // Start loading process
        try {
            let initialName = '';
            let initialItems = [];
            if (isEditing && initialData) {
                initialName = initialData.name || '';
                // Ensure items from prop are valid and have valid importance
                if (Array.isArray(initialData.items)) {
                    initialItems = initialData.items.map(item => ({
                        id: item?.id || Date.now().toString() + Math.random(),
                        criterion: item?.criterion || 'Unknown',
                        importance: IMPORTANCE_LEVELS_ARRAY.some(lvl => lvl.value === item?.importance) ? item.importance : defaultImportance,
                    }));
                }
                console.log(`[WishlistForm] useEffect - Loaded ${initialItems.length} items for editing.`);
            } else {
                 console.log("[WishlistForm] useEffect - Create mode or no initialData.");
             }
             // Set state *after* processing
             setName(initialName);
             setItems(initialItems);
         } catch (error) {
             console.error("[WishlistForm] Error in useEffect loading initial data:", error);
              setName(''); // Reset on error
             setItems([]);
         } finally {
              setIsLoading(false); // Finish loading
              console.log("[WishlistForm] useEffect - Finished loading.");
         }
     }, [initialData, isEditing, defaultImportance]); // Dependencies


    // Callbacks (Simplified back - assuming these were working)
     const handleAddItem = useCallback((criterionToAdd) => { const trimmedCriterion = criterionToAdd?.trim(); if (!trimmedCriterion) return; setItems(prevItems => { const currentItems = Array.isArray(prevItems) ? prevItems : []; const exists = currentItems.some(item => item?.criterion?.toLowerCase() === trimmedCriterion.toLowerCase()); if (exists) { Alert.alert("Duplicate", `"${trimmedCriterion}" already in list.`); return currentItems; } const newItem = { id: Date.now().toString() + Math.random(), criterion: trimmedCriterion, importance: defaultImportance }; return [...currentItems, newItem]; }); }, [defaultImportance]);
     const handleCustomAdd = useCallback(() => { if (!customFeatureText.trim()) { Alert.alert('No Text', '...'); return; } handleAddItem(customFeatureText); setCustomFeatureText(''); }, [customFeatureText, handleAddItem]);
     const handleUpdateItemImportance = useCallback((itemId, newImportance) => { setItems(prevItems => (Array.isArray(prevItems) ? prevItems : []).map(item => item?.id === itemId ? { ...item, importance: newImportance } : item )); }, []);
     const handleDeleteItem = useCallback((itemIdToDelete) => { setItems(prevItems => (Array.isArray(prevItems) ? prevItems : []).filter(item => item?.id !== itemIdToDelete)); }, []);
     const handleSave = useCallback(() => { if (!Array.isArray(items)) { console.error("Save ERR: items not array!"); Alert.alert("Save Error"); return; } if (!name.trim()) { Alert.alert('Missing Name', '...'); return; } const itemsToSave = items.map(item => ({ id: item.id, criterion: item.criterion, importance: item.importance })); const wishlistData = { id: isEditing ? initialData?.id : Date.now().toString(), name: name.trim(), items: itemsToSave }; console.log('[WishlistForm] Saving:', JSON.stringify(wishlistData.items)); if (typeof onSave === 'function') { onSave(wishlistData); } }, [items, name, isEditing, initialData?.id, onSave]);
     const renderItemCallback = useCallback(({ item }) => { if (!item || typeof item !== 'object') { return null; } return <WishlistItem item={item} onUpdateImportance={handleUpdateItemImportance} onDelete={handleDeleteItem} />; }, [handleUpdateItemImportance, handleDeleteItem]);
     const keyExtractorCallback = useCallback(item => item?.id?.toString() ?? Math.random().toString(), []);

     // Header and Footer components using state
     const ListHeader = () => ( /* ... JSX for Name Input and List Header ... */ <View style={styles.sectionContainer}><Text style={styles.label}>Wishlist Name:</Text><TextInput style={styles.input} value={name} onChangeText={setName} /*...*/ /><Text style={styles.listHeader}>Wishlist Items ({Array.isArray(items) ? items.length : 0})</Text>{(!Array.isArray(items) || items.length === 0) && !isLoading && <Text style={styles.emptyListPlaceholder}>No items added.</Text>}</View> );
     const ListFooter = () => ( /* ... JSX for Quick Add, Custom Add, Save/Cancel ... */ <View><View style={styles.sectionContainer}><Text style={styles.listHeader}>Add Features</Text><Text style={styles.subLabel}>Quick Add:</Text><View style={styles.quickAddContainer}>{PREDEFINED_FEATURES.map(feature => { const featureExists = Array.isArray(items) && items.some(item => item?.criterion === feature); return !featureExists && (<TouchableOpacity key={feature} /*...*/ onPress={() => handleAddItem(feature)}><Text>+ {feature}</Text></TouchableOpacity>); })}</View><Text style={styles.subLabel}>Custom Feature:</Text><View style={styles.customAddContainer}><TextInput style={styles.customAddInput} /*...*/ value={customFeatureText} onChangeText={setCustomFeatureText} onSubmitEditing={handleCustomAdd}/><Button title="Add" onPress={handleCustomAdd} style={styles.customAddButton}/></View></View><View style={[styles.sectionContainer, styles.buttonRow]}><Button title="Cancel" onPress={onCancel} /*...*/ /><Button title={isEditing ? 'Save Changes' : 'Save Wishlist'} onPress={handleSave} style={styles.saveButton} /></View></View>);

    // Render loading or the form
     if (isLoading) { return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View> ); }

     // Check items is array before render
     if (!Array.isArray(items)) { return <View style={styles.kavContainer}><Text style={styles.errorText}>Error: Items state invalid.</Text></View>; }


    return (
         <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kavContainer}>
            <FlatList
                data={items} // Should be a valid array here
                 renderItem={renderItemCallback}
                 keyExtractor={keyExtractorCallback}
                 style={styles.flatListContainer}
                 contentContainerStyle={styles.flatListContentContainer}
                 ListHeaderComponent={ListHeader}
                 ListFooterComponent={ListFooter}
                 keyboardShouldPersistTaps="handled"
                 extraData={name} // Re-render if name changes for header
             />
         </KeyboardAvoidingView>
    );
}

// --- Styles (Minimal essential styles - Copy the full styles from before if needed) ---
const styles = StyleSheet.create({ kavContainer: { flex: 1, backgroundColor: '#fff' }, flatListContainer: { flex: 1 }, flatListContentContainer: { paddingBottom: 20 }, sectionContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5, }, label: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#444' }, input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 20, backgroundColor: 'white', color: '#000', }, listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10, borderTopColor: '#eee', borderTopWidth: 1, paddingTop: 15 }, emptyListPlaceholder: { color: '#888', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15, marginBottom: 10 }, subLabel: { fontSize: 14, color: '#555', fontWeight:'500', marginBottom: 8, }, quickAddContainer:{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }, quickAddButton:{ backgroundColor: '#e9ecef', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ced4da' }, quickAddButtonText:{ fontSize: 13, color: '#495057' }, customAddContainer:{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, customAddInput:{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, marginRight: 10, backgroundColor: 'white' }, customAddButton:{ paddingHorizontal: 20, }, buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopColor: '#eee', borderTopWidth: 1 }, cancelButton: { backgroundColor: '#6c757d', flex: 1, marginRight: 10 }, saveButton: { backgroundColor: '#007bff', flex: 1, marginLeft: 10, }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }, loadingText:{ marginTop: 10, fontSize: 16, color: '#888' }, errorText:{ textAlign: 'center', color: 'red', fontSize: 16, padding: 30 } });

export default WishlistForm;