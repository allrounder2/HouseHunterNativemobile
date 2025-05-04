// File: src/features/wishlists/WishlistForm.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert, FlatList,
    TouchableOpacity, /* Removed KeyboardAvoidingView, Platform */ ActivityIndicator
} from 'react-native';
import Button from '../../components/Button';
import WishlistItem from './WishlistItem';
import { IMPORTANCE_LEVELS_ARRAY } from '../../constants/appConstants';
import { Ionicons } from '@expo/vector-icons';

const PREDEFINED_FEATURES = [ 'Good Location', 'Large Backyard', 'Modern Kitchen', 'Spacious Bedrooms','Walkable Neighborhood', 'Good Schools', 'Close to Amenities', 'Garage','Updated Bathroom', 'Quiet Street', 'Natural Light', 'Finished Basement'];

// Calculate defaultImportance once outside the component
const defaultImportance = (Array.isArray(IMPORTANCE_LEVELS_ARRAY) && IMPORTANCE_LEVELS_ARRAY.length > 0)
    ? IMPORTANCE_LEVELS_ARRAY.find(lvl => lvl.value === 'important')?.value || IMPORTANCE_LEVELS_ARRAY[0].value
    : 'important';

function WishlistForm({ initialData, onSave, onCancel, isSaving }) {
    const [name, setName] = useState('');
    const [items, setItems] = useState([]);
    const [customFeatureText, setCustomFeatureText] = useState('');
    const [isLoading, setIsLoading] = useState(true); // For initial data loading
    const isEditing = initialData != null;

    useEffect(() => {
        setIsLoading(true);
        try {
            let initialName = '';
            let initialItems = [];
            if (isEditing && initialData) {
                initialName = initialData.name || '';
                if (Array.isArray(initialData.items)) {
                    initialItems = initialData.items.map(item => ({
                        id: item?.id || Date.now().toString() + Math.random(), // Add ID if missing
                        criterion: item?.criterion || 'Unknown',
                        importance: IMPORTANCE_LEVELS_ARRAY.some(lvl => lvl.value === item?.importance) ? item.importance : defaultImportance,
                    }));
                }
            }
            setName(initialName);
            setItems(initialItems);
        } catch (error) { console.error("[WishlistForm] Error loading initial data:", error); setName(''); setItems([]); }
        finally { setIsLoading(false); }
    }, [initialData]); // Rerun only if initialData reference changes

    // --- Item Management Callbacks (using useCallback) ---
    const handleAddItem = useCallback((criterionToAdd) => {
        const trimmed = criterionToAdd?.trim();
        if (!trimmed) return;
        setItems(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const exists = current.some(i => i?.criterion?.toLowerCase() === trimmed.toLowerCase());
            if (exists) { Alert.alert("Duplicate", `"${trimmed}" is already in list.`); return current; }
            return [...current, { id: Date.now().toString() + Math.random(), criterion: trimmed, importance: defaultImportance }];
        });
    }, [defaultImportance]); // defaultImportance is stable

    const handleCustomAdd = useCallback(() => {
        const text = customFeatureText.trim();
        if (!text) { Alert.alert('Input Required', 'Please enter a feature.'); return; }
        handleAddItem(text);
        setCustomFeatureText('');
    }, [customFeatureText, handleAddItem]);

    const handleUpdateItemImportance = useCallback((itemId, newImportance) => {
        if (!IMPORTANCE_LEVELS_ARRAY.some(lvl => lvl.value === newImportance)) { console.warn("Invalid importance:", newImportance); return; }
        setItems(prev => (Array.isArray(prev) ? prev : []).map(i => i?.id === itemId ? { ...i, importance: newImportance } : i ));
    }, []); // No changing dependencies

    const handleDeleteItem = useCallback((itemIdToDelete) => {
        setItems(prev => (Array.isArray(prev) ? prev : []).filter(i => i?.id !== itemIdToDelete));
    }, []); // No changing dependencies

    // --- Internal Save Handler ---
    const handleSave = useCallback(() => {
        // Ensure items is an array before proceeding
        if (!Array.isArray(items)) {
             console.error("[WishlistForm] Save Error: Items state is not an array!", items);
             Alert.alert("Save Error", "An internal error occurred with wishlist items.");
             return;
         }
        const nameTrimmed = name.trim();
        if (!nameTrimmed) { Alert.alert('Missing Name', 'Please enter a name.'); return; }
        // Map items safely, ensuring structure is correct
        const itemsToSave = items.map(i => ({
             criterion: i?.criterion || 'Unknown', // Provide default if missing
             importance: i?.importance || defaultImportance // Provide default if missing
        }));
        const coreData = { name: nameTrimmed, items: itemsToSave };
        console.log('[WishlistForm] Calling onSave prop with core data:', coreData);
        if (typeof onSave === 'function') { onSave(coreData); }
        else { Alert.alert("Save Error", "Cannot save wishlist."); }
    }, [items, name, onSave]); // Dependencies are correct

    // --- Render Callbacks for FlatList ---
    const renderItemCallback = useCallback(({ item }) => {
        // Add more robust check for item validity
        if (!item || typeof item !== 'object' || !item.id || !item.criterion) {
             console.warn("[WishlistForm] Skipping render for invalid item:", item);
             return null;
         }
        return <WishlistItem item={item} onUpdateImportance={handleUpdateItemImportance} onDelete={handleDeleteItem} disabled={isSaving}/>; // Pass disabled state
    }, [handleUpdateItemImportance, handleDeleteItem, isSaving]); // Add isSaving dependency

    const keyExtractorCallback = useCallback(item => item?.id?.toString() ?? Math.random().toString(), []);

    // --- MEMOIZED List Header and Footer Components ---
    const ListHeader = useCallback(() => (
        <View style={styles.sectionContainer}>
            <Text style={styles.label}>Wishlist Name:</Text>
            <TextInput
                style={[styles.input, isSaving && styles.disabledInput]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Downtown Condo Needs"
                autoCapitalize="words"
                editable={!isSaving}
            />
            <Text style={styles.listHeader}>Wishlist Items ({Array.isArray(items) ? items.length : 0})</Text>
            {(!Array.isArray(items) || items.length === 0) && !isLoading && (
                <Text style={styles.emptyListPlaceholder}>No items added yet. Use 'Add Features' below.</Text>
            )}
        </View>
    ), [name, items, isLoading, isSaving]); // Dependencies: name, items array length, loading state, saving state

    const ListFooter = useCallback(() => (
        <View>
            <View style={styles.sectionContainer}>
                <Text style={styles.listHeader}>Add Features</Text>
                <Text style={styles.subLabel}>Quick Add:</Text>
                <View style={styles.quickAddContainer}>
                    {PREDEFINED_FEATURES.map(feature => {
                        const itemsIsArray = Array.isArray(items);
                        const featureExists = itemsIsArray && items.some(item =>
                            item?.criterion?.toLowerCase() === feature.toLowerCase()
                        );
                        // Only render button if feature doesn't exist
                        return !featureExists ? (
                            <TouchableOpacity
                                key={feature}
                                style={styles.quickAddButton}
                                onPress={() => handleAddItem(feature)}
                                disabled={isSaving}
                            >
                                <Text style={styles.quickAddButtonText}>+ {feature}</Text>
                            </TouchableOpacity>
                        ) : null; // Render nothing if feature exists
                    })}
                </View>
                <Text style={styles.subLabel}>Custom Feature:</Text>
                <View style={styles.customAddContainer}>
                    <TextInput
                        style={[styles.customAddInput, isSaving && styles.disabledInput]}
                        placeholder="Enter custom item..."
                        value={customFeatureText}
                        onChangeText={setCustomFeatureText}
                        onSubmitEditing={handleCustomAdd}
                        returnKeyType="done"
                        editable={!isSaving}
                    />
                    <Button
                        title="Add"
                        onPress={handleCustomAdd}
                        style={styles.customAddButton}
                        disabled={isSaving || !customFeatureText.trim()}
                    />
                </View>
            </View>
            <View style={[styles.sectionContainer, styles.buttonRow]}>
                <Button
                    title="Cancel"
                    onPress={onCancel}
                    style={styles.cancelButton}
                    disabled={isSaving}
                />
                <Button
                    title={isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Wishlist')}
                    onPress={handleSave}
                    style={styles.saveButton}
                    disabled={isSaving}
                />
            </View>
        </View>
    ), [items, customFeatureText, isSaving, handleAddItem, handleCustomAdd, onCancel, handleSave, isEditing]); // Dependencies for Footer

    // --- Render Loading or Form ---
    if (isLoading) {
        return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View> );
    }
    // Added safety check here too
    if (!Array.isArray(items)) {
        console.error("[WishlistForm] Trying to render but 'items' state is not an array!");
        return <View style={styles.container}><Text style={styles.errorText}>Error displaying items.</Text></View>;
    }

    // --- REMOVED KeyboardAvoidingView ---
    return (
        // The Root View for this component's content
        <View style={styles.container}>
            <FlatList
                data={items}
                renderItem={renderItemCallback}
                keyExtractor={keyExtractorCallback}
                style={styles.flatListContainer}
                contentContainerStyle={styles.flatListContentContainer}
                ListHeaderComponent={ListHeader} // Use memoized component
                ListFooterComponent={ListFooter} // Use memoized component
                keyboardShouldPersistTaps="handled"
                // REMOVED extraData prop
            />
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    // Use container instead of kavContainer
    container: { flex: 1, backgroundColor: '#fff' },
    flatListContainer: { flex: 1 },
    flatListContentContainer: { paddingBottom: 20 }, // Ensure space for footer content
    sectionContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5, },
    label: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#444' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 20, backgroundColor: 'white', color: '#000', },
    disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
    listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10, borderTopColor: '#eee', borderTopWidth: 1, paddingTop: 15 },
    emptyListPlaceholder: { color: '#888', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15, marginBottom: 10 },
    subLabel: { fontSize: 14, color: '#555', fontWeight:'500', marginBottom: 8, },
    quickAddContainer:{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    quickAddButton:{ backgroundColor: '#e9ecef', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ced4da' },
    quickAddButtonText:{ fontSize: 13, color: '#495057' },
    customAddContainer:{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    customAddInput:{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, marginRight: 10, backgroundColor: 'white' },
    customAddButton:{ paddingHorizontal: 20, },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopColor: '#eee', borderTopWidth: 1 },
    cancelButton: { backgroundColor: '#6c757d', flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 6 },
    saveButton: { backgroundColor: '#007bff', flex: 1, marginLeft: 10, paddingVertical: 12, borderRadius: 6 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    errorText:{ textAlign: 'center', color: 'red', fontSize: 16, padding: 30 }
});

export default WishlistForm;