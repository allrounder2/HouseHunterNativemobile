// File: src/screens/SideBySideCompareScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useFocusEffect } from '@react-navigation/native';

import Card from '../components/Card';
import Button from '../components/Button'; // Optional for edit button etc.
import { ASYNC_STORAGE_PROPERTY_KEY, ASYNC_STORAGE_WISHLIST_KEY } from '../constants/appConstants';
import CalculatorService from '../services/CalculatorService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Adjust column width - smaller allows more on screen, larger is more readable
const COLUMN_WIDTH = SCREEN_WIDTH * 0.8; // Example: Each property takes 80% of screen width

function SideBySideCompareScreen({ navigation }) {
  const route = useRoute();
  const propertyIds = route.params?.propertyIds || []; // Array of IDs to compare

  const [propertiesDetails, setPropertiesDetails] = useState([]); // Store full property objects
  const [wishlists, setWishlists] = useState([]); // To get names and calc scores
  const [isLoading, setIsLoading] = useState(true);

  // --- Load Data for selected properties ---
  const loadCompareData = useCallback(async () => {
     // console.log("[SideBySide] Loading data for IDs:", propertyIds);
    if (!propertyIds || propertyIds.length === 0) {
      Alert.alert("Error", "No properties selected for comparison.");
      setIsLoading(false);
      navigation.goBack();
      return;
    }
    setIsLoading(true);
    let foundProperties = [];
    let allWishlists = [];
    try {
       // Load ALL properties and wishlists (necessary to find selected ones and calculate scores)
      const [propJson, wishJson] = await Promise.all([
        AsyncStorage.getItem(ASYNC_STORAGE_PROPERTY_KEY),
        AsyncStorage.getItem(ASYNC_STORAGE_WISHLIST_KEY)
      ]);
       const allProperties = propJson != null ? JSON.parse(propJson) : [];
       allWishlists = wishJson != null ? JSON.parse(wishJson) : [];

      // Filter to get only the selected properties
      foundProperties = allProperties.filter(p => propertyIds.includes(p.id));

       // Enhance found properties with calculated scores
      foundProperties = foundProperties.map(prop => {
          const linkedWishlist = prop.wishlistId ? allWishlists.find(wl => wl.id === prop.wishlistId) : null;
          let score = -1;
          if(linkedWishlist) {
             const calcResult = CalculatorService.calculateMatchPercentage(prop, linkedWishlist);
             score = calcResult.matchPercentage;
          }
          return { ...prop, calculatedScore: score };
      });


    } catch (e) {
      console.error("[SideBySide] Error loading data:", e);
      Alert.alert("Error", "Could not load comparison data.");
    } finally {
        setPropertiesDetails(foundProperties);
        setWishlists(allWishlists); // Store all wishlists for name lookup
        setIsLoading(false);
        // console.log("[SideBySide] Loaded details:", foundProperties);
         if(foundProperties.length !== propertyIds.length) {
            // Alert if some properties couldn't be found (e.g., deleted)
             Alert.alert("Warning", "Some selected properties could not be found.");
         }
    }
  }, [propertyIds, navigation]);

  // Load data on focus
   useFocusEffect(
      useCallback(() => {
        loadCompareData();
        return () => {};
      }, [loadCompareData])
    );

  // Helper to get wishlist name
  const getWishlistName = (wishlistId) => {
    if (!wishlistId) return 'N/A';
    const wishlist = wishlists.find(wl => wl.id === wishlistId);
    return wishlist ? wishlist.name : 'Unknown';
  };


  // --- Render Logic ---
  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  if (propertiesDetails.length === 0) {
    return <View style={styles.container}><Text style={styles.errorText}>No property details found for comparison.</Text></View>;
  }


  return (
    // Main horizontal scroll view containing property columns
    <ScrollView
      horizontal={true}                 // Enable horizontal scrolling
      pagingEnabled={true}              // Snap scrolling to columns
      showsHorizontalScrollIndicator={true} // Show indicator
      contentContainerStyle={styles.scrollContainer}
      // decelerationRate="fast" // Optional faster snapping
    >
      {/* Map over the loaded property details */}
      {propertiesDetails.map((prop, index) => (
          // Each property gets its own column View
          <View key={prop.id || index} style={styles.propertyColumn}>
              <Card title={`Property ${index + 1}`} style={styles.propertyCard}>
                  {/* Display various details vertically within the card */}
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValueAddress}>{prop.address || 'N/A'}</Text>

                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.detailValue}>
                    {prop.price ? `$${Number(prop.price).toLocaleString()}` : 'N/A'}
                  </Text>

                  <Text style={styles.detailLabel}>Match Score:</Text>
                   <Text style={[styles.detailValue, styles.scoreValue, prop.calculatedScore === -1 ? styles.scoreNA : null]}>
                     {prop.calculatedScore === -1 ? 'N/A' : `${prop.calculatedScore.toFixed(0)}%`}
                    </Text>

                   <Text style={styles.detailLabel}>Linked Wishlist:</Text>
                   <Text style={styles.detailValue}>{getWishlistName(prop.wishlistId)}</Text>

                  {/* Add more comparable fields here if needed (e.g., Beds, Baths, SqFt) */}
                  {/*
                   <Text style={styles.detailLabel}>Bedrooms:</Text>
                   <Text style={styles.detailValue}>{prop.bedrooms || 'N/A'}</Text>

                   <Text style={styles.detailLabel}>Bathrooms:</Text>
                   <Text style={styles.detailValue}>{prop.bathrooms || 'N/A'}</Text>
                   */}

                   <Text style={styles.detailLabel}>Notes:</Text>
                   <ScrollView style={styles.notesScrollView}>
                      <Text style={styles.detailValueNotes}>{prop.notes || 'None'}</Text>
                    </ScrollView>

                  {/* Optional Edit button? Needs careful thought on UX */}
                  {/* <Button title="Edit" style={{marginTop: 15}} onPress={() => ...} /> */}

              </Card>
         </View>
       ))}
    </ScrollView>
  );
}


// --- Styles ---
const styles = StyleSheet.create({
  container: {
     flex: 1,
     backgroundColor: '#f0f0f0',
   },
   loadingContainer: {
     flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0',
   },
   errorText: {
     fontSize: 18, color: 'red', textAlign: 'center', marginTop: 50, padding: 20,
   },
    scrollContainer:{
        // No flex: 1 here, let content determine width
       paddingVertical: 15, // Add some padding top/bottom for the cards
       // backgroundColor: '#eee', // Optional background for scroll area
    },
    propertyColumn: {
        width: COLUMN_WIDTH, // Use calculated width for each column
        paddingHorizontal: 10, // Spacing between columns
        // alignItems: 'stretch', // Ensure card stretches
    },
     propertyCard:{
         flex: 1, // Make card fill the vertical space in the column (mostly)
         margin: 0, // Remove card's default marginBottom if needed
         elevation: 4, // Slightly more shadow
     },
    detailLabel: {
      fontSize: 14,
      color: '#555',
      fontWeight: 'bold',
      marginTop: 12, // Space between detail items
      marginBottom: 3,
    },
     detailValue: {
      fontSize: 16,
      color: '#333',
    },
     detailValueAddress:{
         fontSize: 17, // Make address slightly larger
         fontWeight: '500',
         color: '#111',
     },
     scoreValue: {
       fontWeight: 'bold',
       fontSize: 18,
       color: '#28a745', // Green score
     },
      scoreNA: {
         color: '#888',
         fontWeight: 'normal',
     },
      notesScrollView:{ // Allow notes section to scroll if long
        maxHeight: 150, // Limit height of notes area
         marginTop: 5,
         padding: 5,
         backgroundColor: '#f9f9f9',
         borderRadius: 4,
      },
     detailValueNotes: {
      fontSize: 15,
      color: '#444',
      lineHeight: 20,
    },
});


export default SideBySideCompareScreen;