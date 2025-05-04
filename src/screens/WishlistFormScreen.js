// File: src/screens/WishlistFormScreen.js
import React, { useState } from 'react';
// --- VVV ADD Text HERE VVV ---
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
// --- ^^^ ADD Text HERE ^^^ ---

// --- Firebase Imports ---
import { auth, db } from '../services/firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
// -----------------------

import WishlistForm from '../features/wishlists/WishlistForm';

// --- Rest of the component code (useState, useEffect, handleSave, handleCancel, styles) remains the same ---
function WishlistFormScreen({ navigation, route }) {
    const initialData = route.params?.initialWishlistData;
    const wishlistId = route.params?.wishlistId;
    const isEditing = !!wishlistId;
    const [isSaving, setIsSaving] = useState(false);

    // ... handleSave function ...
    const handleSave = async (formData) => {
       // ... (Keep the existing Firestore save logic) ...
        console.log(`[WishlistFormScreen] handleSave triggered by WishlistForm. Mode: ${isEditing ? 'Update' : 'Create'}`);
        const user = auth.currentUser;
        if (!user) { Alert.alert("Authentication Error", "You must be logged in to save a wishlist."); return; }
        const userId = user.uid;
        const dataToSave = { ...formData, userId: userId, updatedAt: serverTimestamp(), ...( !isEditing && { createdAt: serverTimestamp() } ) };
        console.log("[WishlistFormScreen] Data prepared for Firestore:", dataToSave);
        setIsSaving(true);
        try {
            if (isEditing) {
                console.log(`[WishlistFormScreen] Attempting to UPDATE wishlist ID: ${wishlistId}`);
                const wishlistDocRef = doc(db, "wishlists", wishlistId);
                await setDoc(wishlistDocRef, dataToSave);
                console.log("[WishlistFormScreen] Wishlist successfully UPDATED in Firestore.");
                Alert.alert("Success", "Wishlist updated successfully!");
            } else {
                console.log("[WishlistFormScreen] Attempting to ADD new wishlist to Firestore.");
                const wishlistsCollectionRef = collection(db, "wishlists");
                const docRef = await addDoc(wishlistsCollectionRef, dataToSave);
                console.log("[WishlistFormScreen] Wishlist successfully ADDED with ID:", docRef.id); // <<< Your log shows this worked!
                Alert.alert("Success", "Wishlist created successfully!");
            }
            navigation.goBack();
        } catch (error) {
            console.error(`[WishlistFormScreen] Error ${isEditing ? 'updating' : 'adding'} wishlist:`, error);
            Alert.alert("Save Failed", `Could not ${isEditing ? 'update' : 'create'} wishlist. Please try again. Error: ${error.message}`);
            setIsSaving(false);
        }
        // No need to setIsSaving(false) on success as component unmounts
    };

    // ... handleCancel function ...
     const handleCancel = () => { console.log('[WishlistFormScreen] handleCancel triggered by WishlistForm.'); navigation.goBack(); };


    return (
        <View style={styles.container}>
            {isSaving && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007bff" />
                    {/* Now Text is imported and this line is valid */}
                    <Text style={styles.loadingText}>Saving...</Text>
                </View>
            )}
            <WishlistForm
                initialData={initialData}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
            />
        </View>
    );
}

// --- Styles (Keep existing styles) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
});

export default WishlistFormScreen;