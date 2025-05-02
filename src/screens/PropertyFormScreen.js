// File: src/screens/PropertyFormScreen.js
import React from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import PropertyForm from '../features/properties/PropertyForm';

function PropertyFormScreen({ navigation, route }) {

  // Extract parameters passed from PropertiesScreen
  const initialData = route.params?.initialPropertyData;
  const onSaveCallback = route.params?.onSaveCallback;
  const wishlists = route.params?.wishlists || []; // Get wishlists passed from PropertiesScreen

   // --- DEBUG LOG ---
   React.useEffect(() => {
    console.log('[PropertyFormScreen] Loaded.');
    console.log('[PropertyFormScreen] Got initialData:', initialData ? 'Yes' : 'No');
    console.log('[PropertyFormScreen] Got onSaveCallback:', typeof onSaveCallback === 'function');
    console.log('[PropertyFormScreen] Got wishlists count:', wishlists.length);
   }, [route.params]);


  const handleSave = (savedProperty) => {
    // console.log('[PropertyFormScreen] handleSave called with:', savedProperty);
    if (onSaveCallback && typeof onSaveCallback === 'function') {
      onSaveCallback(savedProperty);
    } else {
        console.error("[PropertyFormScreen] onSaveCallback is missing or not a function!");
    }
    navigation.goBack(); // Go back after attempting save
  };

  const handleCancel = () => {
     // console.log('[PropertyFormScreen] Cancel pressed.');
    navigation.goBack();
  };

  return (
     <KeyboardAvoidingView
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       style={{ flex: 1 }}
     >
       <ScrollView
         style={styles.container}
         contentContainerStyle={styles.scrollContent}
         keyboardShouldPersistTaps="handled"
       >
         <PropertyForm
             initialData={initialData}
             wishlists={wishlists}       // Pass wishlists to the form
             onSave={handleSave}
             onCancel={handleCancel}
         />
       </ScrollView>
     </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#fff',
   },
    scrollContent: {
        flexGrow: 1,
     },
 });


export default PropertyFormScreen;