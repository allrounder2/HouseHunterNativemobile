// File: src/screens/WishlistFormScreen.js
import React from 'react';
// VVV Keep necessary imports for View/StyleSheet VVV
import { View, StyleSheet /* Removed ScrollView, KAV, Platform */ } from 'react-native';
import WishlistForm from '../features/wishlists/WishlistForm';

function WishlistFormScreen({ navigation, route }) {
  const initialData = route.params?.initialWishlistData;
  const onSaveCallback = route.params?.onSaveCallback;

  // --- VVV Log Received Props VVV ---
  console.log('[WishlistFormScreen] RENDERING. route.params:', route.params);
  // Log structure slightly differently for clarity
  console.log('[WishlistFormScreen] >> initialData prop received:', initialData ? 'Yes (object exists)' : 'No (null/undefined)');
  console.log('[WishlistFormScreen] >> onSaveCallback prop received type:', typeof onSaveCallback);
  // --- ^^^ Log Received Props ^^^ ---

  // Callback function passed to the WishlistForm component
  const handleSave = (savedWishlist) => {
    console.log('[WishlistFormScreen] handleSave callback triggered by WishlistForm.');
    if (onSaveCallback && typeof onSaveCallback === 'function') {
        onSaveCallback(savedWishlist); // Call the actual update function from parent screen
    } else {
        console.error("[WishlistFormScreen] onSaveCallback from route.params is missing or not a function!");
    }
    navigation.goBack(); // Go back after attempting save
  };

  // Callback function passed to the WishlistForm component
  const handleCancel = () => {
     console.log('[WishlistFormScreen] handleCancel callback triggered by WishlistForm.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <WishlistForm
        initialData={initialData}
        onSave={handleSave} // Pass the screen's handler function
        onCancel={handleCancel} // Pass the screen's handler function
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default WishlistFormScreen;