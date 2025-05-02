// File: src/features/properties/PropertyForm.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert, Switch, ScrollView,
    TouchableOpacity, Platform, Image, ActivityIndicator // Added Platform, Image, ActivityIndicator if needed
} from 'react-native';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

// Import Constants from appConstants.js
import {
    PROPERTY_STATUS_OPTIONS,
    BEDROOM_OPTIONS,
    BATHROOM_OPTIONS,
    GARAGE_OPTIONS,
    CHECKLIST_FEATURES,
    IMPORTANCE_LEVELS_ARRAY, // Need for importance hints
    RATING_OPTIONS_ARRAY,    // Need for rating dropdown
    RATING_VALUES_MAP       // Potentially for default values
} from '../../constants/appConstants'; // Adjust path if necessary

function PropertyForm({ initialData, wishlists = [], onSave, onCancel }) {

    // --- State Variables ---
    const [address, setAddress] = useState('');
    const [listingLink, setListingLink] = useState('');
    const [price, setPrice] = useState('');
    const [dateVisited, setDateVisited] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [status, setStatus] = useState(null);
    const [bedrooms, setBedrooms] = useState(null);
    const [bathrooms, setBathrooms] = useState(null);
    const [garage, setGarage] = useState(null);
    const [hasPool, setHasPool] = useState(false);
    const [featuresChecked, setFeaturesChecked] = useState({});
    const [customFeatures, setCustomFeatures] = useState([]);
    const [customFeatureInput, setCustomFeatureInput] = useState('');
    const [photos, setPhotos] = useState([]);
    const [notes, setNotes] = useState('');
    const [selectedWishlistId, setSelectedWishlistId] = useState(null);
    const [wishlistRatings, setWishlistRatings] = useState({});
    // Optional: Loading state if needed for async ops within form
    // const [isInternalLoading, setIsInternalLoading] = useState(false);

    const isEditing = initialData != null;

    // Find selected wishlist object - depends on selectedWishlistId and the wishlists prop
    const selectedWishlist = useMemo(() => {
        // Add defensive checks
        if (!selectedWishlistId || !Array.isArray(wishlists) || wishlists.length === 0) return null;
        return wishlists.find(wl => wl?.id === selectedWishlistId);
    }, [selectedWishlistId, wishlists]);

    // Options for the wishlist selection dropdown
    const wishlistOptions = useMemo(() => {
        const options = Array.isArray(wishlists)
            ? wishlists.map(wl => ({ label: wl?.name || 'Unnamed', value: wl?.id }))
            : [];
        return [{ label: 'Select Wishlist...', value: null }, ...options];
    }, [wishlists]);

    // Effect to load initial data
    useEffect(() => {
        requestPermissions();
        if (isEditing && initialData) {
            console.log("[PropertyForm] useEffect - Loading data for EDITING.");
            setAddress(initialData.address || '');
            setListingLink(initialData.listingLink || '');
            setPrice(initialData.price?.toString() || '');
            setDateVisited(initialData.dateVisited ? new Date(initialData.dateVisited) : null);
            setStatus(initialData.status || null);
            setBedrooms(initialData.bedrooms ?? null);
            setBathrooms(initialData.bathrooms ?? null);
            setGarage(initialData.garage ?? null);
            setHasPool(initialData.hasPool || false);
            setFeaturesChecked(initialData.featuresChecked || {});
            setCustomFeatures(initialData.customFeatures || []);
            setPhotos(initialData.photos || []);
            setNotes(initialData.notes || '');
            setSelectedWishlistId(initialData.wishlistId || null);
            setWishlistRatings(initialData.wishlistRatings || {}); // Load existing ratings
        } else {
             console.log("[PropertyForm] useEffect - Setting defaults for CREATE.");
             // Reset all state if necessary (if form reused without unmounting)
             setAddress(''); setListingLink(''); setPrice(''); setDateVisited(null);
             setStatus(null); setBedrooms(null); setBathrooms(null); setGarage(null);
             setHasPool(false); setFeaturesChecked({}); setCustomFeatures([]); setPhotos([]);
             setNotes(''); setSelectedWishlistId(null); setWishlistRatings({});
        }
    }, [initialData, isEditing]);


    // --- Callbacks wrapped in useCallback ---
    const requestPermissions = useCallback(async () => { /* ... */ await ImagePicker.requestMediaLibraryPermissionsAsync(); }, []);
    const handleAddressChange = useCallback((text) => setAddress(text), []);
    const handleListingLinkChange = useCallback((text) => setListingLink(text), []);
    const handlePriceChange = useCallback((text) => setPrice(text), []);
    const handleStatusChange = useCallback((value) => setStatus(value), []);
    const handleBedroomsChange = useCallback((value) => setBedrooms(value), []);
    const handleBathroomsChange = useCallback((value) => setBathrooms(value), []);
    const handleGarageChange = useCallback((value) => setGarage(value), []);
    const handleHasPoolChange = useCallback((value) => setHasPool(value), []);
    const handleNotesChange = useCallback((text) => setNotes(text), []);
    const handleSelectedWishlistChange = useCallback((value) => {
        console.log(`[PropertyForm] Wishlist Selection Changed: ${value}`); // Log selection change
        setSelectedWishlistId(value);
        // IMPORTANT: Reset ratings when wishlist changes? Decide behavior.
        // setWishlistRatings({}); // Option: Reset ratings if wishlist changes
     }, []);
    const handleFeatureCheckChange = useCallback((featureName, value) => { setFeaturesChecked(prev => ({ ...prev, [featureName]: value })); }, []);
    const handleCustomFeatureInputChange = useCallback((text) => setCustomFeatureInput(text), []);
    const onDateChange = useCallback((event, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (event.type === 'set' && selectedDate) { setDateVisited(selectedDate); } }, []);
    const openDatePicker = useCallback(() => { setShowDatePicker(true); }, []);
    const handleAddCustomFeature = useCallback(() => { /* ... as before ... */ const text = customFeatureInput.trim(); if (!text) { Alert.alert('Empty'); return; } const allFeatures = [...CHECKLIST_FEATURES, ...customFeatures].map(f => f.toLowerCase()); if (allFeatures.includes(text.toLowerCase())) { Alert.alert('Duplicate'); return; } setCustomFeatures(prev => [...prev, text]); setFeaturesChecked(prev => ({ ...prev, [text]: false })); setCustomFeatureInput(''); }, [customFeatureInput, customFeatures]);
    const handleRemoveCustomFeature = useCallback((featureToRemove) => { setCustomFeatures(prev => prev.filter(f => f !== featureToRemove)); setFeaturesChecked(prev => { const { [featureToRemove]: _, ...rest } = prev; return rest; }); }, []);
    const pickImage = useCallback(async () => { /* ... as before ... */ }, []);
    const handleRemovePhoto = useCallback((uriToRemove) => { setPhotos(prev => prev.filter(uri => uri !== uriToRemove)); }, []);
    const handleRatingChange = useCallback((criterionId, ratingValue) => { setWishlistRatings(prev => ({ ...prev, [criterionId]: ratingValue })); }, []);
    const handleSave = useCallback(() => { /* ... as before ... */ if (!address.trim()) { Alert.alert('Missing Address'); return; } const numericPrice = price.replace(/[^0-9.]/g, ''); const propertyData = { id: isEditing ? initialData?.id : Date.now().toString(), address: address.trim(), listingLink: listingLink.trim(), price: numericPrice ? parseFloat(numericPrice) : null, dateVisited, status, bedrooms, bathrooms, garage, hasPool, featuresChecked, notes: notes.trim(), wishlistId: selectedWishlistId, customFeatures, photos, wishlistRatings }; console.log("[PropertyForm] Saving Data:", JSON.stringify(propertyData.id)); if (typeof onSave === 'function') { onSave(propertyData); } else { console.error("onSave not func!"); } }, [isEditing, initialData?.id, address, listingLink, price, dateVisited, status, bedrooms, bathrooms, garage, hasPool, featuresChecked, notes, selectedWishlistId, customFeatures, photos, wishlistRatings, onSave]); // Added wishlistRatings dep

    // --- VVV Logging before render VVV ---
     console.log(`[PropertyForm] Before render - selectedWishlistId: ${selectedWishlistId}`);
     console.log(`[PropertyForm] Before render - selectedWishlist object exists?: ${!!selectedWishlist}`);
     if (selectedWishlist) {
        console.log(`[PropertyForm] Before render - selectedWishlist.items isArray?: ${Array.isArray(selectedWishlist.items)}, length: ${Array.isArray(selectedWishlist.items) ? selectedWishlist.items.length : 'N/A'}`);
        // console.log(`[PropertyForm] Before render - Selected Wishlist Items:`, JSON.stringify(selectedWishlist.items)); // Can be long, uncomment if needed
     } else if (selectedWishlistId) {
         console.log("[PropertyForm] Before render - Have selectedWishlistId but no matching selectedWishlist object found in props.");
     }
     // --- ^^^ Logging before render ^^^ ---


    return (
         <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
            {/* --- Date Picker --- */}
            {showDatePicker && (<DateTimePicker value={dateVisited || new Date()} mode="date" display="default" onChange={onDateChange}/>)}

             {/* --- Form Sections --- */}
             <Card title="Basic Information">{/* Address, Link, Price/Date, Status */}<Text style={styles.label}>Address:</Text><TextInput style={styles.input} value={address} onChangeText={handleAddressChange} placeholder="e.g., 123 Main St"/><Text style={styles.label}>Listing Link:</Text><TextInput style={styles.input} value={listingLink} onChangeText={handleListingLinkChange} keyboardType="url"/><View style={styles.row}><View style={styles.column}><Text style={styles.label}>Asking Price ($):</Text><TextInput style={styles.input} value={price} onChangeText={handlePriceChange} keyboardType="numeric"/></View><View style={styles.column}><Text style={styles.label}>Date Visited:</Text><TouchableOpacity onPress={openDatePicker} style={styles.dateDisplay}><Text style={dateVisited ? styles.dateTextSet : styles.dateTextPlaceholder}>{dateVisited ? dateVisited.toLocaleDateString() : 'Select Date'}</Text><Ionicons name="calendar-outline" size={20} color="#888" style={styles.dateIcon} /></TouchableOpacity></View></View><Text style={styles.label}>Property Status:</Text><Dropdown options={PROPERTY_STATUS_OPTIONS} onValueChange={handleStatusChange} value={status}/></Card>
             <Card title="Property Details">{/* Beds/Baths, Garage/Pool */}<View style={styles.row}><View style={styles.column}><Text style={styles.label}>Bedrooms:</Text><Dropdown options={BEDROOM_OPTIONS} onValueChange={handleBedroomsChange} value={bedrooms}/></View><View style={styles.column}><Text style={styles.label}>Bathrooms:</Text><Dropdown options={BATHROOM_OPTIONS} onValueChange={handleBathroomsChange} value={bathrooms}/></View></View><View style={styles.row}><View style={styles.column}><Text style={styles.label}>Garage:</Text><Dropdown options={GARAGE_OPTIONS} onValueChange={handleGarageChange} value={garage}/></View><View style={[styles.column, styles.switchContainer]}><Text style={styles.label}>Has Pool?</Text><Switch value={hasPool} onValueChange={handleHasPoolChange} trackColor={{false: '#ccc', true: '#81b0ff'}} thumbColor={'#f4f3f4'}/></View></View></Card>
             <Card title="Features Checklist">{/* Checklist with custom add */}{CHECKLIST_FEATURES.map(f => (<View key={f} style={styles.checklistItem}><Text style={styles.checklistLabel}>{f}</Text><Switch value={!!featuresChecked[f]} onValueChange={v=>handleFeatureCheckChange(f,v)}/></View>))}{customFeatures.map(f => (<View key={f} style={styles.checklistItem}><Text style={styles.checklistLabel}>{f}</Text><View style={styles.customFeatureControls}><Switch value={!!featuresChecked[f]} onValueChange={v=>handleFeatureCheckChange(f,v)}/><TouchableOpacity onPress={() => handleRemoveCustomFeature(f)} style={styles.removeCustomButton}><Ionicons name="trash-bin-outline" size={20} color="#dc3545" /></TouchableOpacity></View></View>))}<View style={styles.addCustomContainer}><TextInput style={styles.addCustomInput} placeholder="Add custom feature..." value={customFeatureInput} onChangeText={handleCustomFeatureInputChange} onSubmitEditing={handleAddCustomFeature}/><Button title="Add" onPress={handleAddCustomFeature} style={styles.addCustomButton} textStyle={{fontSize: 14}} /></View></Card>
             <Card title="Photos">{/* Photo selector */}<ScrollView horizontal style={styles.photoScrollView}>{photos.map((uri, index) => (<View key={uri + index} style={styles.photoThumbnailContainer}><Image source={{ uri: uri }} style={styles.photoThumbnail} /><TouchableOpacity onPress={() => handleRemovePhoto(uri)} style={styles.removePhotoButton}><Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" /></TouchableOpacity></View>))}</ScrollView>{photos.length === 0 && <Text style={styles.placeholderText}>No photos.</Text>}<Button title="Select Photos" onPress={pickImage} style={styles.uploadButton}/></Card>
             <Card title="Notes">{/* Notes */}<TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={handleNotesChange} multiline numberOfLines={4} textAlignVertical="top"/></Card>

            {/* --- VVV Updated Wishlist Rating Section VVV --- */}
             <Card title="Wishlist Rating">
                <Text style={styles.label}>Rate Against Wishlist:</Text>
                 <Dropdown options={wishlistOptions} onValueChange={handleSelectedWishlistChange} value={selectedWishlistId}/>

                {/* Debug Info - Keep temporarily */}
                 <View style={{ paddingVertical: 5, backgroundColor: '#eee', marginVertical: 5}}>
                   <Text> DEBUG: selectedWishlistId: {selectedWishlistId || 'null'} </Text>
                   <Text> DEBUG: selectedWishlist?.name: {selectedWishlist?.name || 'null'} </Text>
                    <Text> DEBUG: selectedWishlist?.items?.length: {selectedWishlist?.items?.length ?? 'N/A'} </Text>
                 </View>

                {/* Conditional Render Block */}
                 {selectedWishlist && Array.isArray(selectedWishlist.items) && selectedWishlist.items.length > 0 ? (
                     <View style={styles.ratingSection}>
                         <Text style={styles.ratingHeader}>Rate Features from "{selectedWishlist.name}":</Text>
                          {selectedWishlist.items.map((item, index) => {
                             if (!item || !item.id || !item.criterion) {
                                 console.warn(`[PropertyForm] Skipping rating dropdown for invalid item index ${index}:`, item);
                                 return null;
                             }
                             const importanceLabel = IMPORTANCE_LEVELS_ARRAY.find(lvl => lvl.value === item.importance)?.label || item.importance;
                              return (
                                  <View key={item.id} style={styles.ratingItemContainer}>
                                     <Text style={styles.ratingItemLabel}>{item.criterion} <Text style={styles.importanceHint}>({importanceLabel})</Text></Text>
                                      <Dropdown
                                          options={RATING_OPTIONS_ARRAY}
                                         // Ensure default value is valid from RATING_VALUES_MAP
                                          value={wishlistRatings[item.id] || RATING_VALUES_MAP.NOT_RATED}
                                          onValueChange={(value) => handleRatingChange(item.id, value)}
                                          style={{ pickerContainer: styles.ratingPicker }}
                                      />
                                  </View>
                             );
                           })}
                     </View>
                  ) : (
                      <View>
                          {selectedWishlist && (!Array.isArray(selectedWishlist.items) || selectedWishlist.items.length === 0) && (<Text style={styles.placeholderText}>Selected wishlist has no criteria.</Text> )}
                          {!selectedWishlist && (<Text style={styles.placeholderText}>Select a wishlist to rate criteria.</Text>)}
                      </View>
                 )}
            </Card>
            {/* --- ^^^ Updated Wishlist Rating Section ^^^ --- */}

            <View style={styles.buttonRow}>
                <Button title="Cancel" onPress={onCancel} style={styles.cancelButton} textStyle={{ color: '#333' }}/>
                <Button title={isEditing ? 'Save Changes' : 'Save Property'} onPress={handleSave} style={styles.saveButton}/>
            </View>
            <View style={{height: 50}} />{/* Spacer */}
        </ScrollView>
    );
}


// --- Styles --- (Use the same FULL styles object from before including date/photo/etc)
const styles = StyleSheet.create({ /* ... copy styles here ... */ scrollContainer:{ flex: 1, backgroundColor: '#f0f0f0' }, scrollContentContainer:{ padding: 10, paddingBottom: 60 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, column: { flex: 1, marginHorizontal: 5 }, label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#444', marginTop: 8 }, input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 15, backgroundColor: 'white', color: '#000' }, textArea: { height: 100, textAlignVertical: 'top' }, dateDisplay:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15, backgroundColor: 'white', minHeight: 46, justifyContent:'space-between' }, dateTextPlaceholder:{ color: '#999', fontSize: 16 }, dateTextSet:{ color: '#000', fontSize: 16}, dateIcon: { marginLeft: 10 }, switchContainer:{ alignItems: 'flex-start', paddingTop: Platform.OS === 'ios' ? 30: 35, paddingLeft: 10 }, checklistItem:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }, checklistLabel:{ fontSize: 16, color: '#333', flex: 1, marginRight: 10}, customFeatureControls:{ flexDirection: 'row', alignItems: 'center', }, removeCustomButton:{ padding: 5, marginLeft: 10, }, addCustomContainer:{ flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' }, addCustomInput:{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, marginRight: 8 }, addCustomButton:{ paddingHorizontal: 15 }, photoScrollView:{ marginBottom: 10 }, photoScrollContent:{ paddingVertical: 5, paddingHorizontal: 5 }, photoThumbnailContainer:{ marginRight: 10, position: 'relative'}, photoThumbnail: { width: 80, height: 80, borderRadius: 6, backgroundColor: '#e0e0e0' }, removePhotoButton: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12, padding: 1, elevation: 2}, uploadButton: { backgroundColor: '#6c757d', marginTop: 10 }, placeholderText:{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10}, ratingSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' }, ratingHeader:{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 }, ratingItemContainer:{ backgroundColor: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#eee'}, ratingItemLabel:{ fontSize: 15, color: '#444', marginBottom: 5, fontWeight: '500' }, importanceHint: { color: '#777', fontWeight: 'normal', fontStyle: 'italic', fontSize: 13 }, ratingPicker:{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }, buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, marginBottom: 10 }, cancelButton: { backgroundColor: '#6c757d', flex: 1, marginRight: 10 }, saveButton: { backgroundColor: '#17a2b8', flex: 1, marginLeft: 10, } });

export default PropertyForm;