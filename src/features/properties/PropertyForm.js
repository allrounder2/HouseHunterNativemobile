// File: src/features/properties/PropertyForm.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert, Switch, ScrollView,
    TouchableOpacity, Platform, Image, ActivityIndicator
} from 'react-native';

// --- Firebase Imports ---
import { auth, db } from '../../services/firebase'; // Adjust path if needed
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'; // Firestore query functions
// -----------------------

// --- Component Imports ---
import Button from '../../components/Button';      // Adjust path if needed
import Dropdown from '../../components/Dropdown';    // Adjust path if needed
import Card from '../../components/Card';          // Adjust path if needed
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
// ------------------------

// --- Constants ---
import {
    PROPERTY_STATUS_OPTIONS, BEDROOM_OPTIONS, BATHROOM_OPTIONS, GARAGE_OPTIONS,
    CHECKLIST_FEATURES, IMPORTANCE_LEVELS_ARRAY, RATING_OPTIONS_ARRAY, RATING_VALUES_MAP
} from '../../constants/appConstants'; // Adjust path if needed
// ----------------

// Accept isSaving prop from parent screen PropertyFormScreen
function PropertyForm({ initialData, onSave, onCancel, isSaving }) {

    // --- State Variables ---
    // Property fields
    const [address, setAddress] = useState('');
    const [listingLink, setListingLink] = useState('');
    const [price, setPrice] = useState('');
    const [dateVisited, setDateVisited] = useState(null);
    const [status, setStatus] = useState(null); // Store the value (e.g., 'researching')
    const [bedrooms, setBedrooms] = useState(null); // Store the value (e.g., 3)
    const [bathrooms, setBathrooms] = useState(null); // Store the value (e.g., 2.5)
    const [garage, setGarage] = useState(null); // Store the value (e.g., 2)
    const [hasPool, setHasPool] = useState(false);
    const [featuresChecked, setFeaturesChecked] = useState({}); // { 'Feature Name': true/false }
    const [customFeatures, setCustomFeatures] = useState([]); // ['Custom Feature 1']
    const [customFeatureInput, setCustomFeatureInput] = useState('');
    const [photos, setPhotos] = useState([]); // Array of image URIs
    const [notes, setNotes] = useState('');

    // Wishlist linking and rating
    const [selectedWishlistId, setSelectedWishlistId] = useState(""); // Initialize with empty string
    const [wishlistRatings, setWishlistRatings] = useState({}); // { 'criterionId': 'rating_value' }

    // Wishlist fetching state
    const [fetchedWishlists, setFetchedWishlists] = useState([]);
    const [isFetchingWishlists, setIsFetchingWishlists] = useState(true);

    // Other UI state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const isEditing = initialData != null; // Determine if editing based on initialData presence

    // --- Fetch User's Wishlists ---
    useEffect(() => {
        const fetchWishlists = async () => {
            console.log("[PropertyForm] Fetching wishlists...");
            setIsFetchingWishlists(true);
            const user = auth.currentUser;
            if (!user) {
                console.warn("[PropertyForm] No user logged in to fetch wishlists.");
                Alert.alert("Login Required", "Please log in to link properties to wishlists.");
                setFetchedWishlists([]);
                setIsFetchingWishlists(false);
                return;
            }
            try {
                const wishlistsRef = collection(db, "wishlists");
                // Query for wishlists belonging to the current user, order by name
                const q = query(wishlistsRef, where("userId", "==", user.uid), orderBy("name", "asc"));
                const querySnapshot = await getDocs(q);
                const userWishlists = [];
                querySnapshot.forEach((doc) => {
                    // Include document ID and data for each wishlist
                    userWishlists.push({ id: doc.id, ...doc.data() });
                });
                console.log(`[PropertyForm] Fetched ${userWishlists.length} wishlists.`);
                setFetchedWishlists(userWishlists);
            } catch (error) {
                console.error("[PropertyForm] Error fetching wishlists:", error);
                Alert.alert("Error Loading Wishlists", "Could not load your wishlists. Please try again later.");
                setFetchedWishlists([]); // Clear on error
            } finally {
                setIsFetchingWishlists(false);
            }
        };

        fetchWishlists();
        requestImagePermissions(); // Request permissions when component mounts
    }, []); // Empty dependency array means this runs once on mount

    // --- Format Wishlist options for Dropdown ---
    const wishlistOptions = useMemo(() => {
        // Start with the placeholder item. Value must NOT be null for RNPickerSelect validation.
        const options = [{ label: "Link to Wishlist (Optional)", value: "" }];
        fetchedWishlists.forEach(wl => {
            // Basic check to ensure wishlist has needed properties
            if (wl && wl.id && wl.name) {
                options.push({ label: wl.name, value: wl.id });
            }
        });
        // console.log("[PropertyForm] Wishlist dropdown options prepared:", options); // Optional log
        return options;
    }, [fetchedWishlists]); // Re-calculate only when fetchedWishlists state changes

    // Find the full selected wishlist object based on ID and fetched list
    const selectedWishlist = useMemo(() => {
        // If no ID is selected or no wishlists are fetched, return null
        if (!selectedWishlistId || fetchedWishlists.length === 0) return null;
        return fetchedWishlists.find(wl => wl?.id === selectedWishlistId);
    }, [selectedWishlistId, fetchedWishlists]); // Recalculate if ID or list changes

    // --- Effect to Load Initial Property Data (for editing) ---
    useEffect(() => {
        if (isEditing && initialData) {
            console.log("[PropertyForm] useEffect - Loading initialData for EDITING mode.");
            setAddress(initialData.address || '');
            setListingLink(initialData.listingLink || '');
            setPrice(initialData.price?.toString() || '');
            // Convert Firestore timestamp to JS Date object if present
            setDateVisited(initialData.dateVisited?.seconds ? new Date(initialData.dateVisited.seconds * 1000) : null);
            setStatus(initialData.status || null);
            setBedrooms(initialData.bedrooms ?? null);
            setBathrooms(initialData.bathrooms ?? null);
            setGarage(initialData.garage ?? null);
            setHasPool(initialData.hasPool || false);
            setFeaturesChecked(initialData.featuresChecked || {});
            setCustomFeatures(Array.isArray(initialData.customFeatures) ? initialData.customFeatures : []); // Ensure array
            setPhotos(Array.isArray(initialData.photos) ? initialData.photos : []); // Ensure array
            setNotes(initialData.notes || '');
            // Set initial wishlist ID, default to "" to match placeholder value
            setSelectedWishlistId(initialData.wishlistId || "");
            setWishlistRatings(initialData.wishlistRatings || {});
        } else if (!isEditing) {
             console.log("[PropertyForm] useEffect - Setting defaults for CREATE mode.");
             // Reset all state fields for a clean form
             setAddress(''); setListingLink(''); setPrice(''); setDateVisited(null);
             setStatus(null); setBedrooms(null); setBathrooms(null);
             setGarage(null); setHasPool(false); setFeaturesChecked({}); setCustomFeatures([]);
             setPhotos([]); setNotes(''); setSelectedWishlistId(""); setWishlistRatings({});
        }
        // No need to return a cleanup function here
    }, [initialData, isEditing]); // Rerun effect if initialData or isEditing flag changes

    // --- Permission Request ---
    const requestImagePermissions = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Photo library access is needed to add property photos.');
        }
    }, []);

    // --- Image Picker ---
    const pickImage = useCallback(async () => {
        console.log("[PropertyForm] pickImage called.");
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, // Allow selecting multiple photos
            quality: 0.7, // Compress images slightly
        });
        // console.log("ImagePicker Result:", result);
        if (!result.canceled && result.assets) {
             const newUris = result.assets.map(asset => asset.uri);
             console.log("[PropertyForm] Adding selected photos:", newUris.length);
             setPhotos(prevPhotos => {
                 // Optional: Prevent duplicates if needed
                 const combined = [...prevPhotos, ...newUris];
                 return [...new Set(combined)]; // Use Set to remove duplicates
             });
        }
    }, []);

    // --- Other Callbacks (wrapped in useCallback) ---
    const handleAddressChange = useCallback((text) => setAddress(text), []);
    const handleListingLinkChange = useCallback((text) => setListingLink(text), []);
    const handlePriceChange = useCallback((text) => { /* ... */ const cleaned = text.replace(/[^0-9.]/g, ''); const parts = cleaned.split('.'); if (parts.length <= 2) { setPrice(cleaned); } else { setPrice(parts[0] + '.' + parts.slice(1).join('')); } }, []);
    const handleStatusChange = useCallback((value) => setStatus(value), []);
    const handleBedroomsChange = useCallback((value) => setBedrooms(value), []);
    const handleBathroomsChange = useCallback((value) => setBathrooms(value), []);
    const handleGarageChange = useCallback((value) => setGarage(value), []);
    const handleHasPoolChange = useCallback((value) => setHasPool(value), []);
    const handleNotesChange = useCallback((text) => setNotes(text), []);
    const handleSelectedWishlistChange = useCallback((value) => { console.log(`[PropertyForm] Wishlist Selection Changed to ID: ${value || '"" (None)'}`); setSelectedWishlistId(value); if (!value) { console.log("[PropertyForm] Wishlist deselected, clearing associated ratings."); setWishlistRatings({}); } }, []); // Clear ratings when deselected
    const handleFeatureCheckChange = useCallback((featureName, value) => { setFeaturesChecked(prev => ({ ...prev, [featureName]: value })); }, []);
    const handleCustomFeatureInputChange = useCallback((text) => setCustomFeatureInput(text), []);
    const onDateChange = useCallback((event, selectedDate) => { const currentDate = selectedDate || dateVisited; setShowDatePicker(Platform.OS === 'ios'); if (event.type === 'set' && currentDate) { setDateVisited(currentDate); } }, [dateVisited]);
    const openDatePicker = useCallback(() => { setShowDatePicker(true); }, []);
    const handleAddCustomFeature = useCallback(() => { /* ... */ const text = customFeatureInput.trim(); if (!text) { Alert.alert('Input Required', 'Please enter a feature.'); return; } const allFeatures = [...CHECKLIST_FEATURES, ...customFeatures].map(f => f.toLowerCase()); if (allFeatures.includes(text.toLowerCase())) { Alert.alert('Duplicate Feature', `"${text}" already exists.`); return; } setCustomFeatures(prev => [...prev, text]); setFeaturesChecked(prev => ({ ...prev, [text]: false })); setCustomFeatureInput(''); }, [customFeatureInput, customFeatures]);
    const handleRemoveCustomFeature = useCallback((featureToRemove) => { setCustomFeatures(prev => prev.filter(f => f !== featureToRemove)); setFeaturesChecked(prev => { const { [featureToRemove]: _, ...rest } = prev; return rest; }); }, []);
    const handleRemovePhoto = useCallback((uriToRemove) => { setPhotos(prev => prev.filter(uri => uri !== uriToRemove)); }, []);
    const handleRatingChange = useCallback((criterionId, ratingValue) => { if (ratingValue === null || ratingValue === undefined) return; setWishlistRatings(prev => ({ ...prev, [criterionId]: ratingValue })); }, []);

    // --- Internal Save Handler (Gathers data and calls parent's onSave) ---
     const handleInternalSave = useCallback(() => {
        // --- Basic Validation ---
        if (!address.trim()) { Alert.alert('Address Required', 'Please enter the property address.'); return; }

        // --- Prepare Data Object ---
        const numericPrice = price.replace(/[^0-9.]/g, '');
        const propertyData = {
            // No 'id' field here - Firestore handles it or parent provides for edit
            address: address.trim(),
            listingLink: listingLink.trim(),
            price: numericPrice ? parseFloat(numericPrice) : null, // Store as number or null
            dateVisited: dateVisited, // Pass JS Date object directly
            status: status === "" ? null : status, // Store null if placeholder selected
            bedrooms: bedrooms === "" ? null : Number(bedrooms), // Store null if placeholder
            bathrooms: bathrooms === "" ? null : Number(bathrooms), // Store null if placeholder
            garage: garage === "" ? null : Number(garage), // Store null if placeholder
            hasPool,
            featuresChecked,
            customFeatures,
            photos,
            notes: notes.trim(),
            // Store null if placeholder ("") is selected, otherwise store the actual ID
            wishlistId: selectedWishlistId || null,
            // Only include wishlistRatings if a wishlist is actually selected
            ...(selectedWishlistId && { wishlistRatings })
        };

        console.log("[PropertyForm] Calling onSave prop (from PropertyFormScreen) with prepared data.");
        // console.log("Data being passed:", JSON.stringify(propertyData, null, 2)); // Detailed log if needed

        if (typeof onSave === 'function') {
            onSave(propertyData); // Call the Firestore save logic in the parent screen
        } else {
            console.error("[PropertyForm] onSave prop is not a function!");
            Alert.alert("Save Error", "Cannot save property due to an internal issue.");
        }
     }, [
        // Ensure all state variables used in propertyData are listed as dependencies
        address, listingLink, price, dateVisited, status, bedrooms, bathrooms, garage,
        hasPool, featuresChecked, customFeatures, photos, notes, selectedWishlistId,
        wishlistRatings, onSave // Include onSave prop itself
     ]);

    // --- VVV Add Debug Logs Right Before Return (Optional) VVV ---
    // console.log("[PropertyForm] Render - Checking Wishlist Details");
    // console.log(`[PropertyForm] Render - selectedWishlistId:`, selectedWishlistId);
    // if (selectedWishlist) { console.log(`[PropertyForm] Render - selectedWishlist object found. Name: ${selectedWishlist.name}`); /* Add more item checks if needed */ }
    // else { console.log("[PropertyForm] Render - selectedWishlist object is null or undefined."); }
    // console.log("------------------------------------");
    // --- ^^^ End Debug Logs ^^^ ---

    // --- Render Logic ---
    return (
         <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
            {showDatePicker && (<DateTimePicker value={dateVisited || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} />)}

             <Card title="Basic Information">
                <Text style={styles.label}>Address:*</Text>
                <TextInput style={[styles.input, isSaving && styles.disabledInput]} value={address} onChangeText={handleAddressChange} placeholder="e.g., 123 Main St, Anytown" editable={!isSaving} />
                <Text style={styles.label}>Listing Link:</Text>
                <TextInput style={[styles.input, isSaving && styles.disabledInput]} value={listingLink} onChangeText={handleListingLinkChange} keyboardType="url" placeholder="https://..." autoCapitalize="none" editable={!isSaving} />
                <View style={styles.row}><View style={styles.column}><Text style={styles.label}>Asking Price ($):</Text><TextInput style={[styles.input, isSaving && styles.disabledInput]} value={price} onChangeText={handlePriceChange} keyboardType="numeric" placeholder="e.g., 500000" editable={!isSaving} /></View><View style={styles.column}><Text style={styles.label}>Date Visited:</Text><TouchableOpacity onPress={openDatePicker} style={styles.dateDisplay} disabled={isSaving}><Text style={dateVisited ? styles.dateTextSet : styles.dateTextPlaceholder}>{dateVisited ? dateVisited.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select Date'}</Text><Ionicons name="calendar-outline" size={20} color="#888" style={styles.dateIcon} /></TouchableOpacity></View></View>
                <Text style={styles.label}>Property Status:</Text>
                <Dropdown options={PROPERTY_STATUS_OPTIONS} onValueChange={handleStatusChange} value={status} disabled={isSaving} />
             </Card>

             <Card title="Property Details">
                <View style={styles.row}><View style={styles.column}><Text style={styles.label}>Bedrooms:</Text><Dropdown options={BEDROOM_OPTIONS} onValueChange={handleBedroomsChange} value={bedrooms} disabled={isSaving} /></View><View style={styles.column}><Text style={styles.label}>Bathrooms:</Text><Dropdown options={BATHROOM_OPTIONS} onValueChange={handleBathroomsChange} value={bathrooms} disabled={isSaving} /></View></View>
                <View style={styles.row}><View style={styles.column}><Text style={styles.label}>Garage:</Text><Dropdown options={GARAGE_OPTIONS} onValueChange={handleGarageChange} value={garage} disabled={isSaving} /></View><View style={[styles.column, styles.switchContainer]}><Text style={styles.label}>Has Pool?</Text><Switch value={hasPool} onValueChange={handleHasPoolChange} trackColor={{false: '#ccc', true: '#81b0ff'}} thumbColor={hasPool ? '#007bff' : '#f4f3f4'} disabled={isSaving} /></View></View>
             </Card>

             <Card title="Features Checklist">
                 {CHECKLIST_FEATURES.map(f => (<View key={f} style={styles.checklistItem}><Text style={styles.checklistLabel}>{f}</Text><Switch value={!!featuresChecked[f]} onValueChange={v=>handleFeatureCheckChange(f,v)} disabled={isSaving} /></View>))}
                 {customFeatures.map(f => (<View key={f} style={styles.checklistItem}><Text style={styles.checklistLabel}>{f}</Text><View style={styles.customFeatureControls}><Switch value={!!featuresChecked[f]} onValueChange={v=>handleFeatureCheckChange(f,v)} disabled={isSaving} /><TouchableOpacity onPress={() => handleRemoveCustomFeature(f)} style={styles.removeCustomButton} disabled={isSaving}><Ionicons name="trash-bin-outline" size={20} color={isSaving ? "#ccc" : "#dc3545"} /></TouchableOpacity></View></View>))}
                 <View style={styles.addCustomContainer}><TextInput style={[styles.addCustomInput, isSaving && styles.disabledInput]} placeholder="Add custom feature..." value={customFeatureInput} onChangeText={handleCustomFeatureInputChange} onSubmitEditing={handleAddCustomFeature} editable={!isSaving} /><Button title="Add" onPress={handleAddCustomFeature} style={styles.addCustomButton} textStyle={{fontSize: 14}} disabled={isSaving} /></View>
             </Card>

             <Card title="Photos">
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScrollView} contentContainerStyle={styles.photoScrollContent}>
                    {photos.map((uri, index) => (<View key={uri + index} style={styles.photoThumbnailContainer}><Image source={{ uri: uri }} style={styles.photoThumbnail} resizeMode="cover"/>{!isSaving && (<TouchableOpacity onPress={() => handleRemovePhoto(uri)} style={styles.removePhotoButton} disabled={isSaving}><Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" /></TouchableOpacity>)}</View>))}
                 </ScrollView>
                 {photos.length === 0 && <Text style={styles.placeholderText}>No photos added.</Text>}
                 <Button title="Select Photos from Library" onPress={pickImage} style={styles.uploadButton} disabled={isSaving}/>
             </Card>

             <Card title="Notes">
                 <TextInput style={[styles.input, styles.textArea, isSaving && styles.disabledInput]} value={notes} onChangeText={handleNotesChange} multiline numberOfLines={5} textAlignVertical="top" placeholder="Enter any observations, thoughts, follow-up actions..." editable={!isSaving}/>
             </Card>

             <Card title="Wishlist Rating">
                <Text style={styles.label}>Link & Rate Against Wishlist:</Text>
                 {isFetchingWishlists ? ( <ActivityIndicator style={{marginVertical: 10}} /> ) : ( <Dropdown options={wishlistOptions} onValueChange={handleSelectedWishlistChange} value={selectedWishlistId} disabled={isSaving} /> )}
                 {/* Conditional Render Block for Rating Items */}
                 {selectedWishlist && Array.isArray(selectedWishlist.items) && selectedWishlist.items.length > 0 ? (
                     <View style={styles.ratingSection}>
                         <Text style={styles.ratingHeader}>Rate Features from "{selectedWishlist.name}":</Text>
                          {selectedWishlist.items.map((item) => { // No need for index here
                             if (!item || !item.criterion) { console.warn("Skipping rating for invalid item:", item); return null; } // Use item criterion as key if ID missing?
                             // Find importance label safely
                             const importanceLabel = IMPORTANCE_LEVELS_ARRAY.find(lvl => lvl.value === item.importance)?.label || item.importance;
                             // Generate a unique key for the rating item (criterion is usually unique per list)
                             const ratingItemKey = `${selectedWishlistId}-${item.criterion}`;
                              return (
                                  <View key={ratingItemKey} style={styles.ratingItemContainer}>
                                     <Text style={styles.ratingItemLabel}>{item.criterion} <Text style={styles.importanceHint}>({importanceLabel})</Text></Text>
                                      <Dropdown
                                          options={RATING_OPTIONS_ARRAY}
                                          // Use item.criterion as key for ratings object
                                          value={wishlistRatings[item.criterion] || RATING_VALUES_MAP.NOT_RATED}
                                          onValueChange={(value) => handleRatingChange(item.criterion, value)}
                                          style={{ pickerContainer: styles.ratingPicker }}
                                          disabled={isSaving}
                                      />
                                  </View>
                             );
                           })}
                     </View>
                  ) : (
                      <View style={{marginTop: 10}}>
                          {selectedWishlistId && (!Array.isArray(selectedWishlist?.items) || selectedWishlist?.items?.length === 0) && ( <Text style={styles.placeholderText}>Selected wishlist has no criteria items defined.</Text> )}
                          {!selectedWishlistId && !isFetchingWishlists && ( <Text style={styles.placeholderText}>Select a wishlist above to rate its criteria.</Text> )}
                          {isFetchingWishlists && ( <Text style={styles.placeholderText}>Loading wishlists...</Text> )}
                      </View>
                 )}
            </Card>

            <View style={styles.buttonRow}>
                <Button title="Cancel" onPress={onCancel} style={styles.cancelButton} textStyle={{ color: '#333' }} disabled={isSaving} />
                <Button title={isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Property')} onPress={handleInternalSave} style={styles.saveButton} disabled={isSaving} />
            </View>
            <View style={{height: 50}} />{/* Extra Spacer at bottom */}
        </ScrollView>
    );
}


// --- Styles --- (Keep existing styles)
const styles = StyleSheet.create({
    scrollContainer:{ flex: 1, backgroundColor: '#f0f0f0' },
    scrollContentContainer:{ padding: 10, paddingBottom: 60 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    column: { flex: 1, marginHorizontal: 5 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#444', marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 15, backgroundColor: 'white', color: '#000' },
    disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
    textArea: { height: 100, textAlignVertical: 'top' },
    dateDisplay:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15, backgroundColor: 'white', minHeight: 46, justifyContent:'space-between' },
    dateTextPlaceholder:{ color: '#999', fontSize: 16 },
    dateTextSet:{ color: '#000', fontSize: 16},
    dateIcon: { marginLeft: 10 },
    switchContainer:{ alignItems: 'flex-start', paddingTop: Platform.OS === 'ios' ? 30: 35, paddingLeft: 10 },
    checklistItem:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    checklistLabel:{ fontSize: 16, color: '#333', flex: 1, marginRight: 10},
    customFeatureControls:{ flexDirection: 'row', alignItems: 'center', },
    removeCustomButton:{ padding: 5, marginLeft: 10, },
    addCustomContainer:{ flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    addCustomInput:{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, marginRight: 8 },
    addCustomButton:{ paddingHorizontal: 15 },
    photoScrollView:{ marginBottom: 10 },
    photoScrollContent:{ paddingVertical: 5, paddingHorizontal: 5 },
    photoThumbnailContainer:{ marginRight: 10, position: 'relative'},
    photoThumbnail: { width: 80, height: 80, borderRadius: 6, backgroundColor: '#e0e0e0' },
    removePhotoButton: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12, padding: 1, elevation: 2},
    uploadButton: { backgroundColor: '#6c757d', marginTop: 10, paddingVertical: 10 },
    placeholderText:{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10},
    ratingSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    ratingHeader:{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    ratingItemContainer:{ backgroundColor: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#eee'},
    ratingItemLabel:{ fontSize: 15, color: '#444', marginBottom: 5, fontWeight: '500' },
    importanceHint: { color: '#777', fontWeight: 'normal', fontStyle: 'italic', fontSize: 13 },
    ratingPicker:{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, backgroundColor: 'white' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, marginBottom: 10, paddingHorizontal: 5 },
    cancelButton: { backgroundColor: '#6c757d', flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 6 },
    saveButton: { backgroundColor: '#17a2b8', flex: 1, marginLeft: 10, paddingVertical: 12, borderRadius: 6 } // Teal save button
});

export default PropertyForm;