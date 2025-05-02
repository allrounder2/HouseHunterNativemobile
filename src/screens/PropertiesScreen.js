// File: src/screens/PropertiesScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import { ASYNC_STORAGE_PROPERTY_KEY, ASYNC_STORAGE_WISHLIST_KEY } from '../constants/appConstants'; // Need both keys

// Add near other imports/constants at the top of PropertiesScreen.js
import { Linking } from 'react-native'; // Need Linking API

// Map status values to UI elements
const STATUS_MAP = {
    researching: { text: 'Researching', emoji: '🤔', color: '#ffc107' }, // Yellow
    viewingScheduled: { text: 'Viewing Scheduled', emoji: '🗓️', color: '#17a2b8' }, // Teal
    visitedInterested: { text: 'Visited - Interested', emoji: '👍', color: '#28a745' }, // Green
    visitedNotInterested: { text: 'Visited - Not Interested', emoji: '👎', color: '#dc3545' }, // Red
    offerMade: { text: 'Offer Made', emoji: '📨', color: '#007bff' }, // Blue
    underContract: { text: 'Under Contract', emoji: '🤝', color: '#fd7e14' }, // Orange
    rejectedLost: { text: 'Rejected / Lost', emoji: '💔', color: '#6c757d' }, // Gray
    archived: { text: 'Archived', emoji: '📦', color: '#adb5bd' }, // Lighter Gray
    default: { text: 'Unknown Status', emoji: '❓', color: '#6c757d' } // Fallback
};

// Helper function to get status info safely
const getStatusInfo = (statusValue) => {
    return STATUS_MAP[statusValue] || STATUS_MAP.default;
};


// function PropertiesScreen({ navigation }) { ... // Component starts here

function PropertiesScreen({ navigation }) {
  // --- State ---
  const [properties, setProperties] = useState([]);
  const [wishlists, setWishlists] = useState([]); // Also need wishlists for linking later
  const [isLoading, setIsLoading] = useState(true);

  // --- Refs ---
  const isInitialMount = useRef(true);

  // --- Load BOTH Properties AND Wishlists ---
  // We load wishlists here so we can potentially pass them to the form screen
  const loadData = useCallback(async () => {
    // console.log("[PropertiesScreen] loadData STARTING...");
    // Don't necessarily set isLoading=true on every focus, only initial
    // setIsLoading(true);
    let loadedProps = [];
    let loadedWishlists = [];
    let hadError = false;

    try {
      // Load Properties
      const propJson = await AsyncStorage.getItem(ASYNC_STORAGE_PROPERTY_KEY);
      loadedProps = propJson != null ? JSON.parse(propJson) : [];
      if (!Array.isArray(loadedProps)) {
        console.error("Loaded properties data is not an array:", loadedProps);
        loadedProps = [];
        await AsyncStorage.removeItem(ASYNC_STORAGE_PROPERTY_KEY); // Clear bad data
      }

      // Load Wishlists (needed for the form dropdown)
      const wishJson = await AsyncStorage.getItem(ASYNC_STORAGE_WISHLIST_KEY);
      loadedWishlists = wishJson != null ? JSON.parse(wishJson) : [];
       if (!Array.isArray(loadedWishlists)) {
        console.error("Loaded wishlists data is not an array:", loadedWishlists);
        loadedWishlists = [];
        await AsyncStorage.removeItem(ASYNC_STORAGE_WISHLIST_KEY); // Clear bad data
      }

    //   console.log("[PropertiesScreen] loadData Success. Properties:", loadedProps.length, "Wishlists:", loadedWishlists.length);

    } catch (e) {
      console.error("[PropertiesScreen] Error loading data:", e);
      Alert.alert("Error", "Could not load properties or wishlists.");
      hadError = true;
      // Reset state in case of parsing errors etc.
      loadedProps = [];
      loadedWishlists = [];
    } finally {
        setProperties(loadedProps); // Update state even if empty/error
        setWishlists(loadedWishlists);
      if (isInitialMount.current) {
        setIsLoading(false); // Set loading false only after first load attempt
        isInitialMount.current = false;
      }
    //   console.log("[PropertiesScreen] loadData FINISHED.");
    }
  }, []); // Empty dependency array

   // --- Save Properties ---
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
         if (isLoading) return; // Don't save while loading initial data

         // console.log("[PropertiesScreen] useEffect triggered to save PROPERTIES.");
        const saveProperties = async () => {
            try {
            const jsonValue = JSON.stringify(properties);
            // console.log("[PropertiesScreen] Saving PROPERTIES to AsyncStorage:", jsonValue.substring(0, 100) + "..."); // Log truncated value
            await AsyncStorage.setItem(ASYNC_STORAGE_PROPERTY_KEY, jsonValue);
             // console.log("[PropertiesScreen] Properties saved successfully.");
            } catch (e) {
            console.error("[PropertiesScreen] Error saving properties:", e);
            Alert.alert("Error", "Could not save property changes.");
            }
        };
         saveProperties();
    }, [properties, isLoading]); // Run when properties state changes (and not loading)

   // --- useFocusEffect: Reload data when screen comes into view ---
  useFocusEffect(
    useCallback(() => {
      console.log("[PropertiesScreen] Screen Focused - Calling loadData.");
      loadData();
      return () => { /* console.log("[PropertiesScreen] Screen Unfocused."); */ };
    }, [loadData]) // Depend on the memoized load function
  );


  // --- Event Handlers ---
  const handleCreateProperty = () => {
    console.log("[PropertiesScreen] handleCreateProperty called.");
    navigation.navigate('PropertyForm', {
       wishlists: wishlists, // Pass loaded wishlists to the form for the dropdown
       // Pass the save callback
      onSaveCallback: (newProperty) => {
         // console.log("[PropertiesScreen] Received new property from form:", newProperty);
        setProperties(prev => [...prev, newProperty]);
      },
    });
  };

  const handleEditProperty = (propertyToEdit) => {
     console.log("[PropertiesScreen] handleEditProperty called for ID:", propertyToEdit.id);
    navigation.navigate('PropertyForm', {
       wishlists: wishlists, // Pass wishlists for the dropdown
       propertyId: propertyToEdit.id,
       initialPropertyData: propertyToEdit,
       // Pass the update callback
       onSaveCallback: (updatedProperty) => {
          // console.log("[PropertiesScreen] Received updated property from form:", updatedProperty);
          setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
       },
    });
  };

  const handleDeleteProperty = (id) => {
     console.log("[PropertiesScreen] handleDeleteProperty called for ID:", id);
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this tracked property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log("[PropertiesScreen] Deleting property confirmed:", id);
            setProperties(prev => prev.filter(p => p.id !== id));
            // Also remove from comparison list if implemented later
            // setSelectedForCompare(prev => prev.filter(selId => selId !== id));
          },
        },
      ],
      { cancelable: true }
    );
  };

   // --- Get Wishlist Name Helper ---
   // (This is needed to display the linked wishlist name in the list item)
   const getWishlistName = (wishlistId) => {
       if (!wishlistId) return 'None';
       const wishlist = wishlists.find(wl => wl.id === wishlistId);
       return wishlist ? wishlist.name : 'Unknown Wishlist';
   };


  // --- Render List Item ---
  const renderPropertyItem = ({ item }) => {
    // Get status details from our map
    const statusInfo = getStatusInfo(item.status);
    // Format price
    const formattedPrice = item.price ? `$${Number(item.price).toLocaleString()}` : 'N/A';
    // Check if listing link exists
    const hasLink = !!item.listingLink?.trim();

    // Function to handle opening the link
    const handleViewListing = async () => {
        if (!hasLink) return;
        const url = item.listingLink.trim();
         // Check if the link can be opened
         const supported = await Linking.canOpenURL(url);
         if (supported) {
             try {
                await Linking.openURL(url);
            } catch (error) {
                 console.error("Failed to open URL:", error);
                 Alert.alert('Error', 'Could not open the link.');
            }
        } else {
             Alert.alert('Invalid Link', `Cannot open this URL: ${url}`);
         }
    };

    // *** TODO LATER: Wire up compare button ***
    const handleCompareToggle = () => {
        Alert.alert("TODO", "Add/Remove Compare logic not implemented yet in this view.");
         // This would call the same toggle function used in ComparisonScreen if state was shared/passed
         // handleToggleCompareSelection(item.id);
    };


    return (
        <Card style={styles.listItemCard}>
             {/* Address at the top */}
             <Text style={styles.addressText} numberOfLines={2} ellipsizeMode="tail">
               {item.address || 'No Address Provided'}
             </Text>

             {/* Main content area */}
            <View style={styles.contentRow}>
                 {/* Left side: Status, Price, View Listing */}
                <View style={styles.infoColumn}>
                     {/* Status Badge */}
                     {item.status && ( // Only show badge if status exists
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                           <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
                            <Text style={styles.statusText}>{statusInfo.text}</Text>
                         </View>
                       )}

                    {/* Price */}
                     <Text style={styles.priceText}>
                        Price: <Text style={styles.priceValue}>{formattedPrice}</Text>
                    </Text>

                    {/* View Listing Button */}
                    <TouchableOpacity
                        onPress={handleViewListing}
                        disabled={!hasLink}
                        style={[styles.linkButton, !hasLink && styles.linkButtonDisabled]}
                    >
                         <Text style={styles.linkButtonText}>View Listing ↗</Text>
                    </TouchableOpacity>
                </View>

                 {/* Right side: Action Buttons */}
                <View style={styles.actionsColumn}>
                     {/* Add Compare Button */}
                    <Button
                        title="Compare [+]"
                         onPress={handleCompareToggle} // TODO: Connect this
                         style={[styles.actionButton, styles.compareButton]}
                        textStyle={styles.actionButtonText}
                     />
                     {/* Edit Button */}
                    <Button
                        title="Edit"
                        onPress={() => handleEditProperty(item)}
                         style={[styles.actionButton, styles.editButton]}
                        textStyle={styles.actionButtonText}
                     />
                     {/* Delete Button */}
                    <Button
                        title="Delete"
                        onPress={() => handleDeleteProperty(item.id)}
                         style={[styles.actionButton, styles.deleteButton]}
                         textStyle={styles.actionButtonText}
                     />
                 </View>
             </View>
         </Card>
     );
  };

   // --- Main Render ---
   const showLoading = isLoading && isInitialMount.current;

  return (
    <View style={styles.container}>
      <Button
        title="+ Add New Property"
        onPress={handleCreateProperty}
        style={styles.createButton}
      />

       {showLoading ? (
         <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>
       ) : (
        <FlatList
          data={properties}
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
              !isLoading && properties.length === 0 ? (
                 <View style={styles.emptyListContainer}>
                     <Text style={styles.emptyListText}>No properties tracked yet.</Text>
                     <Text style={styles.emptyListText}>Tap "+ Add New Property" to start!</Text>
                 </View>
             ) : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  );
}

// --- Styles --- (REPLACE the entire styles object at the bottom)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  createButton: {
    backgroundColor: '#17a2b8', // Teal/Info color for Properties
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
      flexGrow: 1,
    },
   // List Item Card Styles
   listItemCard: {
     marginVertical: 8, // More spacing between cards
     padding: 0, // Remove default card padding, we'll handle internally
     elevation: 2, // Adjust shadow if needed
   },
   addressText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#333',
     paddingHorizontal: 15, // Padding for address
     paddingTop: 12,      // Padding for address
     paddingBottom: 8,
     borderBottomWidth: 1, // Separator line
     borderBottomColor: '#eee',
     marginBottom: 10, // Space below address
   },
   contentRow: {
       flexDirection: 'row', // Main content side-by-side
       paddingHorizontal: 15, // Padding for the content area
       paddingBottom: 12, // Padding below content
       // justifyContent: 'space-between', // Let columns define space
   },
   infoColumn: { // Status, Price, Link
       flex: 1, // Take available space
       marginRight: 10, // Space between info and actions
       justifyContent: 'center', // Align items vertically
   },
   statusBadge: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingHorizontal: 8,
       paddingVertical: 3,
       borderRadius: 12, // Rounded badge
       alignSelf: 'flex-start', // Don't stretch badge full width
       marginBottom: 8,
       maxWidth: '90%', // Prevent very long status from overflowing badly
   },
   statusEmoji: {
       fontSize: 14,
       marginRight: 4,
   },
   statusText: {
       fontSize: 12,
       fontWeight: 'bold',
       color: '#fff', // White text on colored background
       flexShrink: 1, // Allow text to shrink if needed
   },
   priceText:{
        fontSize: 15,
        color: '#444',
        marginBottom: 8,
   },
    priceValue:{
       fontWeight: 'bold',
    },
    linkButton: {
        backgroundColor: '#e7f3ff', // Light blue background for link
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#007bff',
        alignSelf: 'flex-start', // Don't stretch full width
    },
    linkButtonDisabled:{
        backgroundColor: '#e9ecef',
        borderColor: '#adb5bd',
     },
    linkButtonText: {
        color: '#0056b3', // Darker blue text
        fontSize: 14,
        fontWeight: '500',
    },
    actionsColumn: { // Edit, Delete, Compare
       // Takes space based on content width
        justifyContent: 'center', // Align buttons vertically centered
        alignItems: 'flex-end', // Align buttons to the right
    },
    actionButton: { // Common style for action buttons
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginBottom: 6, // Space between action buttons
        minWidth: 80, // Ensure buttons have minimum width
        elevation: 1, // Slight shadow
        alignItems: 'center', // Center text inside button
        borderRadius: 5,
    },
     actionButtonText: {
         fontSize: 13,
         fontWeight: '500',
          color: '#fff',
     },
     compareButton: {
       backgroundColor: '#17a2b8', // Teal compare button
     },
    editButton: {
        backgroundColor: '#007bff', // Blue edit button
    },
    deleteButton: {
        backgroundColor: '#dc3545', // Red delete button
        marginBottom: 0, // No margin below last button
    },
    // Empty List Styles remain the same
    emptyListContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyListText:{ fontSize: 16, color: '#777', textAlign: 'center', marginBottom: 5 },
});
export default PropertiesScreen;