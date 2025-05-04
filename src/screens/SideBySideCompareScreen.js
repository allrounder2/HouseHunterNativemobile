// File: src/screens/SideBySideCompareScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Import Icons

// --- Firebase Imports ---
import { auth, db } from '../services/firebase'; // Import auth and db
import { doc, getDoc } from 'firebase/firestore';  // Import doc and getDoc
// -----------------------

import Card from '../components/Card';
// import Button from '../components/Button'; // Not using buttons currently
import { IMPORTANCE_LEVELS_MAP, RATING_VALUES_MAP } from '../constants/appConstants'; // Import constants needed for emoji summary
import CalculatorService from '../services/CalculatorService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Adjust column width - aiming for maybe 1.2 properties visible initially
const COLUMN_WIDTH = SCREEN_WIDTH * 0.85; // Each property takes 85% of screen width

function SideBySideCompareScreen({ navigation }) {
  const route = useRoute();
  const propertyIds = route.params?.propertyIds || []; // Array of IDs to compare

  // Store enhanced property details including scores and wishlist info
  const [propertiesDetails, setPropertiesDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Load Data for selected properties using Firestore ---
  const loadCompareData = useCallback(async () => {
    console.log("[SideBySide] Loading data for IDs:", propertyIds);
    if (!propertyIds || propertyIds.length === 0) {
      setError("No properties selected for comparison.");
      setIsLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
        setError("Please log in to compare properties.");
        setIsLoading(false);
        // Optional: navigate to login
        return;
    }

    setIsLoading(true);
    setError(null); // Reset error state

    try {
      // Fetch details for each property ID concurrently
      const propertyPromises = propertyIds.map(async (id) => {
        try {
            const propertyDocRef = doc(db, "properties", id);
            const propertyDocSnap = await getDoc(propertyDocRef);

            if (!propertyDocSnap.exists()) {
                console.warn(`[SideBySide] Property ${id} not found.`);
                return null; // Skip this property
            }

            const propData = { id: propertyDocSnap.id, ...propertyDocSnap.data() };

            // --- Fetch linked wishlist and calculate score ---
            let linkedWishlistInfo = null; // Store name and id
            let calculationResult = null;

            if (propData.wishlistId) {
                 // console.log(`[SideBySide] Property ${id} has wishlist ${propData.wishlistId}. Fetching...`);
                 try {
                    const wishlistDocRef = doc(db, "wishlists", propData.wishlistId);
                    const wishlistDocSnap = await getDoc(wishlistDocRef);

                    if (wishlistDocSnap.exists()) {
                        const wishlistData = wishlistDocSnap.data();
                        // IMPORTANT: Verify wishlist ownership
                        if (wishlistData.userId === user.uid) {
                            linkedWishlistInfo = { id: wishlistDocSnap.id, name: wishlistData.name || 'Unnamed Wishlist' };
                            // console.log(`[SideBySide] Found matching wishlist: ${linkedWishlistInfo.name}`);
                            // Calculate score only if wishlist is valid and owned
                            calculationResult = CalculatorService.calculateMatchPercentage(propData, { id: wishlistDocSnap.id, ...wishlistData });
                            // console.log(`[SideBySide] Calculation result for ${id}:`, calculationResult);
                        } else {
                             console.warn(`[SideBySide] Wishlist ${propData.wishlistId} does not belong to user ${user.uid}.`);
                        }
                    } else {
                         console.warn(`[SideBySide] Linked wishlist ${propData.wishlistId} not found.`);
                    }
                 } catch (wishlistError) {
                    console.error(`[SideBySide] Error fetching wishlist ${propData.wishlistId}:`, wishlistError);
                    // Continue without wishlist info for this property
                 }
            }

            return {
                ...propData, // Spread all property data
                linkedWishlistInfo, // { id, name } or null
                calculationResult // Full result object or null
            };

        } catch (propError) {
             console.error(`[SideBySide] Error fetching property ${id}:`, propError);
             return null; // Skip property on error
        }
      });

      // Wait for all fetches to complete
      const results = await Promise.all(propertyPromises);

      // Filter out any null results (properties that failed to load or were not found)
      const validProperties = results.filter(p => p !== null);

      if (validProperties.length === 0 && propertyIds.length > 0) {
          setError("Could not load details for any selected properties.");
      } else if (validProperties.length < propertyIds.length) {
          Alert.alert("Notice", "Some selected properties could not be loaded or found.");
      }

      setPropertiesDetails(validProperties);

    } catch (e) {
      console.error("[SideBySide] General error loading data:", e);
      setError("An unexpected error occurred while loading comparison data.");
      setPropertiesDetails([]); // Clear data on general error
    } finally {
      setIsLoading(false);
    }
  }, [propertyIds]); // Dependency array

  // Load data on focus
   useFocusEffect(
      useCallback(() => {
        loadCompareData();
        // Optional cleanup can go here if needed when screen loses focus
        return () => {
             // console.log("[SideBySide] Screen blurred");
        };
      }, [loadCompareData]) // Re-run if loadCompareData function identity changes
    );

  // --- Helper Functions for Rendering ---

  // Render stars based on score percentage
  const renderStars = (scorePercentage) => {
    if (scorePercentage === null || scorePercentage < 0) {
      return <Text style={styles.starsNA}>N/A</Text>; // Handle case where score isn't calculated
    }
    const score = Math.max(0, Math.min(100, scorePercentage)); // Clamp score 0-100
    let stars = 0;
    if (score > 90) stars = 5;
    else if (score > 70) stars = 4;
    else if (score > 50) stars = 3;
    else if (score > 30) stars = 2;
    else if (score > 10) stars = 1;

    const starIcons = [];
    for (let i = 1; i <= 5; i++) {
      starIcons.push(
        <Ionicons
          key={i}
          name={i <= stars ? "star" : "star-outline"}
          size={22} // Slightly larger stars
          color="#ffc107" // Gold color for stars
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starsContainer}>{starIcons}</View>;
  };

  // Render emoji summary for key criteria check
  const renderKeyCriteriaCheck = (calculationResult) => {
     if (!calculationResult?.details) {
         return <Text style={styles.keyCriteriaNA}>-</Text>;
     }
     const details = calculationResult.details;
     let goodCount = 0;
     let poorCount = 0;

     const highImportance = [IMPORTANCE_LEVELS_MAP.MUST_HAVE, IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT];
     const goodRatings = [RATING_VALUES_MAP.EXCELLENT, RATING_VALUES_MAP.GOOD];
     const poorRatings = [RATING_VALUES_MAP.POOR, RATING_VALUES_MAP.VERY_POOR];

     details.forEach(item => {
         if (highImportance.includes(item.importance)) {
             if (goodRatings.includes(item.ratingValue)) goodCount++;
             else if (poorRatings.includes(item.ratingValue)) poorCount++;
         }
     });

     if (goodCount === 0 && poorCount === 0) {
        return <Text style={styles.keyCriteriaNA}>No top priorities rated high/low</Text>;
     }

     return (
         <View style={styles.keyCriteriaContainer}>
             {goodCount > 0 && <Text style={styles.keyCriteriaText}>✅ {goodCount} Key Positive{goodCount > 1 ? 's' : ''}</Text>}
             {poorCount > 0 && <Text style={styles.keyCriteriaText}>❌ {poorCount} Key Negative{poorCount > 1 ? 's' : ''}</Text>}
         </View>
     );
  };


  // --- Main Render Logic ---
  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.loadingText}>Loading Comparison...</Text></View>;
  }

  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (propertiesDetails.length === 0) {
    return <View style={styles.container}><Text style={styles.errorText}>No properties available for comparison.</Text></View>;
  }


  return (
    // Main horizontal scroll view containing property columns
    <ScrollView
      horizontal={true}
      pagingEnabled={true} // Snap scrolling to columns
      showsHorizontalScrollIndicator={true}
      contentContainerStyle={styles.scrollContainer}
      style={styles.scrollViewStyle} // Added style for background
    >
      {/* Map over the loaded and enhanced property details */}
      {propertiesDetails.map((prop, index) => {
          const score = prop.calculationResult?.matchPercentage ?? -1; // Use ?? for nullish coalescing
          const mustHavesMet = prop.calculationResult?.mustHaveMet ?? null; // null if no calc result

          return (
              // Each property gets its own column View
              <View key={prop.id || index} style={styles.propertyColumn}>
                  <Card title={`Compare: Property ${index + 1}`} style={styles.propertyCard}>
                      {/* Use ScrollView inside Card if content might overflow */}
                      <ScrollView showsVerticalScrollIndicator={false}>
                          {/* Address and Price */}
                          <View style={styles.detailRow}>
                              <Ionicons name="home-outline" size={18} color="#555" style={styles.iconStyle}/>
                              <Text style={styles.detailValueAddress} numberOfLines={2}>{prop.address || 'N/A'}</Text>
                          </View>
                           <View style={styles.detailRow}>
                              <Ionicons name="cash-outline" size={18} color="#555" style={styles.iconStyle}/>
                              <Text style={styles.detailValuePrice}>
                                {prop.price ? `$${Number(prop.price).toLocaleString()}` : 'Price N/A'}
                              </Text>
                          </View>

                          {/* Divider */}
                          <View style={styles.divider}/>

                          {/* Core Specs */}
                          <View style={styles.specsContainer}>
                              <View style={styles.specItem}>
                                <Ionicons name="bed-outline" size={20} color="#007bff" style={styles.iconStyle}/>
                                <Text style={styles.specText}>{prop.bedrooms ?? '?'} beds</Text>
                              </View>
                              <View style={styles.specItem}>
                                <Ionicons name="water-outline" size={20} color="#17a2b8" style={styles.iconStyle}/>
                                <Text style={styles.specText}>{prop.bathrooms ?? '?'} baths</Text>
                              </View>
                              <View style={styles.specItem}>
                                <Ionicons name="car-sport-outline" size={20} color="#6c757d" style={styles.iconStyle}/>
                                <Text style={styles.specText}>{prop.garage ?? '?'} cars</Text>
                              </View>
                          </View>

                           {/* Divider */}
                          <View style={styles.divider}/>

                          {/* Wishlist Matching Section */}
                          <Text style={styles.sectionTitle}>Wishlist Match</Text>
                          <View style={styles.detailRow}>
                             <Ionicons name="list-outline" size={18} color="#555" style={styles.iconStyle}/>
                             <Text style={styles.detailValueWishlistName}>
                                {prop.linkedWishlistInfo ? prop.linkedWishlistInfo.name : 'Not Linked'}
                             </Text>
                          </View>

                          {/* Score and Must Haves */}
                          <View style={styles.scoreRow}>
                               <View style={styles.scoreItem}>
                                   <Text style={styles.detailLabel}>Overall Score:</Text>
                                   <Text style={[styles.scoreValue, score === -1 ? styles.scoreNA : (score < 50 ? styles.scorePoor : null)]}>
                                     {score === -1 ? 'N/A' : `${score.toFixed(0)}%`}
                                    </Text>
                                </View>
                                <View style={styles.scoreItem}>
                                     <Text style={styles.detailLabel}>Must Haves:</Text>
                                     <Text style={[styles.mustHaveValue, mustHavesMet === null ? styles.mustHaveNA : (mustHavesMet ? styles.mustHaveMet : styles.mustHaveNotMet)]}>
                                         {mustHavesMet === null ? '-' : (mustHavesMet ? 'Met 👍' : 'Not Met 👎')}
                                     </Text>
                                </View>
                           </View>

                          {/* Star Rating */}
                           <View style={styles.detailRow}>
                             <Text style={styles.detailLabel}>Rating:</Text>
                             {renderStars(score)}
                          </View>

                          {/* Key Criteria Check */}
                          <View style={styles.detailRow}>
                             <Text style={styles.detailLabel}>Key Check:</Text>
                             {renderKeyCriteriaCheck(prop.calculationResult)}
                           </View>


                      </ScrollView>
                  </Card>
             </View>
          );
       })}
    </ScrollView>
  );
}


// --- Styles ---
const styles = StyleSheet.create({
  scrollViewStyle: { // Style for the main ScrollView component itself
    backgroundColor: '#e9ecef', // Light background for the scroll area
  },
  container: { // Fallback container for errors
     flex: 1,
     backgroundColor: '#f0f0f0',
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
   },
   loadingContainer: {
     flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa',
   },
   loadingText: {
       marginTop: 10,
       fontSize: 16,
       color: '#6c757d',
   },
   errorText: {
     fontSize: 17, color: '#dc3545', textAlign: 'center', lineHeight: 24,
   },
    scrollContainer:{ // For the content *inside* the horizontal ScrollView
        paddingVertical: 20, // Generous padding top/bottom
        paddingLeft: (SCREEN_WIDTH - COLUMN_WIDTH) / 2, // Center first item initially
        paddingRight: (SCREEN_WIDTH - COLUMN_WIDTH) / 2, // Center last item
    },
    propertyColumn: {
        width: COLUMN_WIDTH, // Use calculated width
        paddingHorizontal: 8, // Creates gap between cards
        // height: '100%', // Make column take full height of scroll area
    },
     propertyCard:{
         flex: 1, // Allow card to grow vertically
         margin: 0, // Override default card margin
         elevation: 3,
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 1 },
         shadowOpacity: 0.2,
         shadowRadius: 2,
         backgroundColor: '#fff', // Ensure card background is white
         overflow: 'hidden', // Hide scrollbar until needed
     },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center', // Align icon and text vertically
        marginBottom: 10,
        paddingHorizontal: 5, // Padding inside the row
    },
    iconStyle: {
        marginRight: 10,
    },
     detailValueAddress:{
         fontSize: 16,
         fontWeight: '600', // Bold address
         color: '#343a40',
         flexShrink: 1, // Allow address to wrap if long
     },
     detailValuePrice: {
         fontSize: 16,
         fontWeight: '500',
         color: '#28a745', // Green for price
     },
     divider: {
         height: 1,
         backgroundColor: '#e9ecef', // Light grey divider
         marginVertical: 12,
         marginHorizontal: -15, // Extend divider edge-to-edge within card padding
     },
     specsContainer: {
         flexDirection: 'row',
         justifyContent: 'space-around', // Distribute spec items evenly
         alignItems: 'center',
         paddingVertical: 5,
     },
     specItem: {
         alignItems: 'center', // Center icon and text vertically
         paddingHorizontal: 5,
     },
     specText: {
         fontSize: 14,
         color: '#495057',
         marginTop: 4,
     },
     sectionTitle: {
         fontSize: 16,
         fontWeight: 'bold',
         color: '#007bff', // Blue title
         marginBottom: 10,
         paddingHorizontal: 5,
         borderBottomWidth: 1,
         borderBottomColor: '#dee2e6',
         paddingBottom: 5,
     },
     detailValueWishlistName: {
        fontSize: 15,
        color: '#495057',
        fontStyle: 'italic',
        flexShrink: 1,
     },
     scoreRow: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'flex-start', // Align tops
         marginVertical: 10,
         paddingHorizontal: 5,
     },
     scoreItem: {
         alignItems: 'center', // Center label and value
         flex: 1, // Allow items to share space
     },
     detailLabel: { // Common style for labels in this section
        fontSize: 13,
        color: '#6c757d', // Grey label text
        fontWeight: '500',
        marginBottom: 4,
        textAlign: 'center',
    },
     scoreValue: {
        fontSize: 20, // Larger score
        fontWeight: 'bold',
        color: '#28a745', // Default good score color
     },
     scoreNA: {
         fontSize: 16,
         color: '#adb5bd', // Light grey for N/A score
         fontWeight: 'normal',
     },
     scorePoor: {
        color: '#dc3545', // Red for poor score
     },
      mustHaveValue: {
        fontSize: 14,
        fontWeight: 'bold',
     },
     mustHaveNA: {
         color: '#adb5bd',
         fontWeight: 'normal',
     },
     mustHaveMet: {
         color: '#28a745', // Green
     },
     mustHaveNotMet: {
         color: '#dc3545', // Red
     },
     starsContainer: {
         flexDirection: 'row',
         marginLeft: 5, // Align with text values roughly
     },
     starIcon: {
         marginHorizontal: 1, // Small space between stars
     },
     starsNA: {
         fontSize: 14,
         color: '#adb5bd',
         marginLeft: 5,
         fontStyle: 'italic',
     },
     keyCriteriaContainer: {
         marginLeft: 5,
         flexShrink: 1, // Allow container to shrink
     },
     keyCriteriaText: {
         fontSize: 14,
         color: '#495057',
         marginBottom: 3, // Space between good/poor lines
     },
     keyCriteriaNA: {
         fontSize: 14,
         color: '#adb5bd',
         marginLeft: 5,
         fontStyle: 'italic',
     },
});


export default SideBySideCompareScreen;