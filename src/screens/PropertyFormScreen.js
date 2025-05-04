// File: src/screens/PropertyFormScreen.js
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, View, Text } from 'react-native';

// --- Firebase Imports ---
import { auth, db } from '../services/firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
// -----------------------

import PropertyForm from '../features/properties/PropertyForm';

function PropertyFormScreen({ navigation, route }) {

  const initialData = route.params?.initialPropertyData;
  const propertyId = route.params?.propertyId;
  const isEditing = !!propertyId;

  const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
    console.log(`[PropertyFormScreen] Loaded. ${isEditing ? `EDITING ID: ${propertyId}` : 'CREATING NEW'}`);
    // console.log('[PropertyFormScreen] Got initialData:', initialData ? 'Yes' : 'No'); // Keep if useful
   }, [route.params, isEditing, propertyId]);

  const handleSave = async (formData) => {
    console.log(`[PropertyFormScreen] handleSave triggered. Mode: ${isEditing ? 'Update' : 'Create'}`);
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to save a property.");
      return;
    }

    const userId = user.uid;

    const dataToSave = {
      ...formData,
      userId: userId,
      updatedAt: serverTimestamp(),
      ...( !isEditing && { createdAt: serverTimestamp() } ) // Add createdAt only when creating
    };

    console.log("[PropertyFormScreen] Data prepared for Firestore:", dataToSave);
    setIsSaving(true);

    try {
      if (isEditing) {
        // --- Update existing document ---
        console.log(`[PropertyFormScreen] Attempting to UPDATE property ID: ${propertyId}`);
        if (!propertyId) throw new Error("Missing property ID for update");
        const propertyDocRef = doc(db, "properties", propertyId);

        // ***************************************************************
        // ***** THE FIX: Add { merge: true } to the setDoc call *****
        // ***************************************************************
        await setDoc(propertyDocRef, dataToSave, { merge: true });
        // ***************************************************************

        console.log("[PropertyFormScreen] Property successfully UPDATED in Firestore.");
        Alert.alert("Success", "Property updated successfully!");

      } else {
        // --- Create new document ---
        console.log("[PropertyFormScreen] Attempting to ADD new property to Firestore.");
        const propertiesCollectionRef = collection(db, "properties");
        const docRef = await addDoc(propertiesCollectionRef, dataToSave);
        console.log("[PropertyFormScreen] Property successfully ADDED with ID:", docRef.id);
        Alert.alert("Success", "Property added successfully!");
      }

      navigation.goBack();

    } catch (error) {
      console.error(`[PropertyFormScreen] Error ${isEditing ? 'updating' : 'adding'} property:`, error);
      Alert.alert("Save Failed", `Could not ${isEditing ? 'save' : 'add'} property. Error: ${error.message}`);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
     console.log('[PropertyFormScreen] Cancel pressed.');
    navigation.goBack();
  };

  return (
     <KeyboardAvoidingView
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       style={styles.keyboardAvoidingView}
     >
       {isSaving && (
         <View style={styles.loadingOverlay}>
           <ActivityIndicator size="large" color="#007bff" />
           <Text style={styles.loadingText}>Saving Property...</Text>
         </View>
       )}
       <ScrollView
         style={styles.scrollView}
         contentContainerStyle={styles.scrollContent}
         keyboardShouldPersistTaps="handled"
       >
         <PropertyForm
             initialData={initialData}
             onSave={handleSave}
             onCancel={handleCancel}
             isSaving={isSaving}
         />
       </ScrollView>
     </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
   keyboardAvoidingView: {
      flex: 1,
   },
   scrollView: {
     flex: 1,
     backgroundColor: '#fff',
   },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
     },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
 });


export default PropertyFormScreen;