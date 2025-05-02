// File: src/screens/WishlistsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Important hook

// Import our custom components
import Button from '../components/Button';
import Card from '../components/Card';
// Import constants - Need BOTH wishlist and property keys for delete handling
import { ASYNC_STORAGE_WISHLIST_KEY, ASYNC_STORAGE_PROPERTY_KEY } from '../constants/appConstants';

function WishlistsScreen({ navigation }) {
  // --- State Variables ---
  const [wishlists, setWishlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Ref to track mounted state/initial load ---
  const isInitialMount = useRef(true);

  // --- Load Wishlists ---
  const loadWishlists = useCallback(async () => {
    // console.log("[WishlistsScreen] loadWishlists STARTING...");
    // No longer setting isLoading true here for focus reloads, only initial
    try {
      const jsonValue = await AsyncStorage.getItem(ASYNC_STORAGE_WISHLIST_KEY);
      // console.log("[WishlistsScreen] loadWishlists RAW data from AsyncStorage:", jsonValue);
      const loadedWishlists = jsonValue != null ? JSON.parse(jsonValue) : [];

      if (Array.isArray(loadedWishlists)) {
        setWishlists(loadedWishlists); // Update state
        // console.log("[WishlistsScreen] loadWishlists SUCCESS - Setting state.");
      } else {
        console.error("[WishlistsScreen] Loaded wishlist data is not an array:", loadedWishlists);
        setWishlists([]);
        await AsyncStorage.removeItem(ASYNC_STORAGE_WISHLIST_KEY); // Clear bad data
      }
    } catch (e) {
      console.error("[WishlistsScreen] Error loading/parsing wishlists:", e);
      Alert.alert("Error", "Could not load your wishlists.");
      setWishlists([]); // Reset on error
    } finally {
      // Only set loading false after the very first load attempt
      if (isInitialMount.current) {
        setIsLoading(false);
        isInitialMount.current = false; // Mark initial load as complete
      }
      // console.log("[WishlistsScreen] loadWishlists FINISHED. isLoading:", isLoading);
    }
  }, []); // Empty dependency array means this function's identity is stable

   // --- Save Wishlists (Effect runs when 'wishlists' state changes) ---
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true; // Mark mount complete
            return; // Skip first run
        }
        if (isLoading) {
           // console.log('[WishlistsScreen] useEffect SKIPPING save because isLoading is true.');
           return; // Skip save if still loading
        }

        // console.log('[WishlistsScreen] useEffect triggered to save WISHLISTS.');
        const saveWishlists = async () => {
            try {
            const jsonValue = JSON.stringify(wishlists);
            // console.log('[WishlistsScreen] Saving WISHLISTS to AsyncStorage:', jsonValue.substring(0, 100) + "...");
            await AsyncStorage.setItem(ASYNC_STORAGE_WISHLIST_KEY, jsonValue);
            // console.log("[WishlistsScreen] Wishlists saved successfully.");
            } catch (e) {
            console.error("[WishlistsScreen] Error saving wishlists to AsyncStorage:", e);
            Alert.alert("Error", "Could not save your wishlist changes.");
            }
        };
        saveWishlists(); // Execute async save

    }, [wishlists, isLoading]); // Depend on wishlists state and loading status

  // --- useFocusEffect: Reload data when screen comes into view ---
  useFocusEffect(
    useCallback(() => {
      // console.log("[WishlistsScreen] Screen Focused - Calling loadWishlists.");
      loadWishlists(); // Call the load function when screen is focused
      return () => { /* console.log("[WishlistsScreen] Screen Unfocused."); */ };
    }, [loadWishlists]) // Dependency ensures it uses the stable load function
  );

  // --- Event Handlers ---
  const handleCreateWishlist = () => {
    // console.log('[WishlistsScreen] handleCreateWishlist called.');
    navigation.navigate('WishlistForm', {
      onSaveCallback: (newWishlist) => {
        // console.log('[WishlistsScreen] onSaveCallback (Create) executed.');
        setWishlists(prevWishlists => [...prevWishlists, newWishlist]);
      },
    });
  };

  const handleEditWishlist = (wishlistToEdit) => {
    //  console.log('[WishlistsScreen] handleEditWishlist called for ID:', wishlistToEdit.id);
     navigation.navigate('WishlistForm', {
       wishlistId: wishlistToEdit.id,
       initialWishlistData: wishlistToEdit,
       onSaveCallback: (updatedWishlist) => {
         // console.log('[WishlistsScreen] onSaveCallback (Edit) executed.');
         setWishlists(prevWishlists =>
           prevWishlists.map(wl =>
             wl.id === updatedWishlist.id ? updatedWishlist : wl
           )
         );
       },
     });
  };

  // --- VVV THIS IS THE UPDATED DELETE HANDLER VVV ---
  const handleDeleteWishlist = (id) => {
    console.log('[WishlistsScreen] handleDeleteWishlist called for ID:', id);
    Alert.alert(
      'Delete Wishlist',
      'Are you sure you want to delete this wishlist? Properties linked to this list will be unlinked.', // Updated message
      [
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('[WishlistsScreen] Delete cancelled.') },
        {
          text: 'Delete',
          style: 'destructive',
          // Make the function async to handle property updates
          onPress: async () => {
            console.log("[WishlistsScreen] Deleting wishlist confirmed:", id);

            // --- Start: Update linked properties ---
            try {
                // Load current properties
                const propJson = await AsyncStorage.getItem(ASYNC_STORAGE_PROPERTY_KEY);
                let currentProperties = propJson != null ? JSON.parse(propJson) : [];

                // Check if it's an array and has items
                if (Array.isArray(currentProperties) && currentProperties.length > 0) {
                    let propertiesWereModified = false;

                    // Create a new array by mapping over existing properties
                    const updatedProperties = currentProperties.map(prop => {
                        // If a property is linked to the wishlist being deleted...
                        if (prop.wishlistId === id) {
                            // console.log(`[WishlistsScreen] Unlinking property ID: ${prop.id} from deleted wishlist ID: ${id}`);
                            propertiesWereModified = true; // Mark that we need to save
                            // Return a new object with wishlistId set to null (or '')
                            return { ...prop, wishlistId: null };
                        }
                        // Otherwise, return the property unchanged
                        return prop;
                    });

                    // Only save back to AsyncStorage if any property was actually changed
                    if (propertiesWereModified) {
                        console.log("[WishlistsScreen] Saving updated properties after unlinking...");
                        const updatedPropJson = JSON.stringify(updatedProperties);
                        await AsyncStorage.setItem(ASYNC_STORAGE_PROPERTY_KEY, updatedPropJson);
                        console.log("[WishlistsScreen] Updated properties saved successfully.");
                    } else {
                        // console.log("[WishlistsScreen] No properties were linked to the deleted wishlist.");
                    }
                } else {
                     // console.log("[WishlistsScreen] No properties found or properties array empty, skipping unlink check.");
                }
            } catch(e) {
                 console.error("[WishlistsScreen] Error updating properties after wishlist delete:", e);
                 // Show an error, but still proceed with deleting the wishlist? Decide on desired UX.
                 Alert.alert("Update Warning", "Could not automatically unlink properties due to an error. Please check them manually.");
            }
            // --- End: Update linked properties ---


            // Finally, update the wishlists state locally
            // This will trigger the useEffect hook to save the updated wishlists array
            setWishlists(prevWishlists => prevWishlists.filter(wl => wl.id !== id));
            console.log("[WishlistsScreen] Wishlist state updated locally, triggering save effect.");

          },
          // --- ^^^ THIS onPress FUNCTION WAS UPDATED ^^^ ---
        },
      ],
      { cancelable: true }
    );
  };
  // --- ^^^ THIS IS THE UPDATED DELETE HANDLER ^^^ ---


  // --- Render List Item ---
  const renderWishlistItem = ({ item }) => (
    <Card style={styles.listItemCard}>
       <View style={styles.listItemContent}>
           <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode='tail'>{item.name || 'Untitled Wishlist'}</Text>
           <Text style={styles.listItemDetail}>
                Criteria: {item.items?.length || 0} items
           </Text>
       </View>
       <View style={styles.listItemButtons}>
         <Button
           title="Edit"
           onPress={() => handleEditWishlist(item)}
           style={styles.editButton}
           textStyle={styles.buttonTextSmall}
         />
         <Button
           title="Delete"
           onPress={() => handleDeleteWishlist(item.id)}
           style={styles.deleteButton}
           textStyle={styles.buttonTextSmall}
         />
       </View>
    </Card>
  );

  // --- Main Render Logic ---
  const showLoading = isLoading; // Show loading whenever isLoading is true (simplification)

  return (
    <View style={styles.container}>
      <Button
        title="+ Create New Wishlist"
        onPress={handleCreateWishlist}
        style={styles.createButton}
      />

      {showLoading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>
      ) : (
        <FlatList
          data={wishlists}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id?.toString()} // Safer: ensure key is string
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
              // Only show empty message if not loading AND list is empty
              !isLoading && wishlists.length === 0 ? (
                  <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>No wishlists yet.</Text>
                      <Text style={styles.emptyListText}>Tap "+ Create New Wishlist" to start!</Text>
                  </View>
              ) : null
          }
          // Performance props
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  );
}

// --- Styles --- (Copied from previous corrected version)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  createButton: {
    backgroundColor: '#28a745',
    margin: 15,
    elevation: 4,
  },
   loadingContainer:{
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
    },
   listContentContainer: {
      paddingHorizontal: 10,
      paddingBottom: 20,
      flexGrow: 1, // Needed for ListEmptyComponent centering
    },
   listItemCard: {
     marginVertical: 6,
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingVertical: 10,
     paddingHorizontal: 15,
   },
   listItemContent: {
       flex: 1,
       marginRight: 10,
   },
   listItemTitle: {
     fontSize: 17,
     fontWeight: '600',
     marginBottom: 4,
     color: '#333',
   },
   listItemDetail: {
       fontSize: 14,
       color: '#555',
   },
   listItemButtons: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   editButton: {
       backgroundColor: '#ffc107',
       paddingVertical: 7,
       paddingHorizontal: 14,
       marginRight: 8,
       elevation: 2,
   },
   deleteButton: {
       backgroundColor: '#dc3545',
        paddingVertical: 7,
        paddingHorizontal: 14,
       elevation: 2,
   },
    buttonTextSmall: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    emptyListContainer:{
        flex: 1, // Take up space in FlatList content container
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        // Adjust minHeight if needed instead of flex:1 depending on desired look
        // minHeight: 200,
    },
    emptyListText:{
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 5,
    },
});


export default WishlistsScreen;