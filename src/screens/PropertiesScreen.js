// File: src/screens/PropertiesScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, Alert, ActivityIndicator,
    TouchableOpacity, Linking // Make sure Linking is imported
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// --- Firebase Imports ---
import { auth, db } from '../services/firebase'; // Import auth and db
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore'; // Firestore functions
// -----------------------

// --- Component Imports ---
import Button from '../components/Button'; // Assuming '../components/Button' path is correct
import Card from '../components/Card';     // Assuming '../components/Card' path is correct
// ------------------------

// --- Constants (REMOVED AsyncStorage keys) ---
// Removed ASYNC_STORAGE_PROPERTY_KEY, ASYNC_STORAGE_WISHLIST_KEY
// -------------------------------------------

// --- Status Map (Keep as is) ---
const STATUS_MAP = {
    researching: { text: 'Researching', emoji: '🤔', color: '#ffc107' },
    viewingScheduled: { text: 'Viewing Scheduled', emoji: '🗓️', color: '#17a2b8' },
    visitedInterested: { text: 'Visited - Interested', emoji: '👍', color: '#28a745' },
    visitedNotInterested: { text: 'Visited - Not Interested', emoji: '👎', color: '#dc3545' },
    offerMade: { text: 'Offer Made', emoji: '📨', color: '#007bff' },
    underContract: { text: 'Under Contract', emoji: '🤝', color: '#fd7e14' },
    rejectedLost: { text: 'Rejected / Lost', emoji: '💔', color: '#6c757d' },
    archived: { text: 'Archived', emoji: '📦', color: '#adb5bd' },
    default: { text: 'Unknown Status', emoji: '❓', color: '#6c757d' }
};
const getStatusInfo = (statusValue) => STATUS_MAP[statusValue] || STATUS_MAP.default;
// -----------------------------

function PropertiesScreen({ navigation }) {
    // --- State ---
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // REMOVED: const [wishlists, setWishlists] = useState([]);
    const isMounted = useRef(true); // To prevent state updates after unmount

    // --- Load Properties from Firestore ---
    const loadData = useCallback(async () => {
        // Prevent setting state if component unmounted
        if (!isMounted.current) {
            console.log("[PropertiesScreen] loadData called but component unmounted.");
            return;
        }

        console.log("[PropertiesScreen] loadData STARTING...");
        setIsLoading(true); // Set loading true when fetching starts

        const user = auth.currentUser; // Get current user from Firebase Auth

        if (!user) {
            console.warn("[PropertiesScreen] No user logged in. Cannot load properties.");
            // Alert.alert("Not Logged In", "Please log in to view your properties."); // Optional User Feedback
            if (isMounted.current) {
                setProperties([]); // Clear properties if user logs out
                setIsLoading(false);
            }
            // Optional: Navigate back to login if required by app flow
            // if (navigation.canGoBack()) navigation.goBack();
            return; // Exit if no user
        }

        const userId = user.uid; // Get the user's unique ID

        try {
            // Create a query to get properties for the current user, ordered by creation time (newest first)
            const propertiesRef = collection(db, "properties"); // Reference to the 'properties' collection
            const q = query(propertiesRef,
                            where("userId", "==", userId), // Filter by userId FIELD -> Ensure this field is saved!
                            orderBy("createdAt", "desc") // Optional: Order by newest first (Requires createdAt field)
                           );

            console.log(`[PropertiesScreen] Fetching properties for user: ${userId}`);
            const querySnapshot = await getDocs(q); // Execute the query

            const loadedProps = [];
            querySnapshot.forEach((doc) => {
                // Combine document ID and data into one object
                loadedProps.push({ id: doc.id, ...doc.data() });
            });

            console.log(`[PropertiesScreen] loadData Success. Properties found: ${loadedProps.length}`);
            if (isMounted.current) { // Check again before setting state
                setProperties(loadedProps);
            }

        } catch (e) {
            console.error("[PropertiesScreen] Error loading properties from Firestore:", e);
            Alert.alert("Loading Error", "Could not load properties from the database.");
            if (isMounted.current) {
                setProperties([]); // Reset state on error
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false); // Stop loading indicator
            }
            console.log("[PropertiesScreen] loadData FINISHED.");
        }
    }, []); // Empty dependency array - relies on useFocusEffect trigger

    // --- useFocusEffect: Reload data when screen comes into view ---
    useFocusEffect(
        useCallback(() => {
            isMounted.current = true; // Set mounted true on focus
            console.log("[PropertiesScreen] Screen Focused - Calling loadData.");
            loadData(); // Load data every time the screen comes into focus

            // Cleanup function when screen loses focus or component unmounts
            return () => {
                console.log("[PropertiesScreen] Screen Unfocused / Unmounting.");
                isMounted.current = false; // Set mounted false on blur/unmount
            };
        }, [loadData]) // Depend on the memoized load function
    );

    // --- REMOVED: useEffect hook for saving properties to AsyncStorage ---

    // --- Event Handlers ---
    const handleCreateProperty = () => {
        console.log("[PropertiesScreen] Navigating to PropertyForm (Create)");
        // Navigate without passing wishlists or save callbacks
        navigation.navigate('PropertyForm');
    };

    const handleEditProperty = (propertyToEdit) => {
        console.log("[PropertiesScreen] Navigating to PropertyForm (Edit) for ID:", propertyToEdit.id);
        // Pass only the ID and initial data for editing
        navigation.navigate('PropertyForm', {
           propertyId: propertyToEdit.id,
           initialPropertyData: propertyToEdit,
        });
    };

    const handleDeleteProperty = (idToDelete, address) => {
        // console.log("[PropertiesScreen] handleDeleteProperty called for ID:", idToDelete);
        Alert.alert(
            'Delete Property',
            `Are you sure you want to delete "${address || 'this property'}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => { // Make onPress async
                        console.log("[PropertiesScreen] Deleting property confirmed:", idToDelete);
                        try {
                            // Create a reference to the Firestore document
                            const propertyDocRef = doc(db, "properties", idToDelete);
                            // Delete the document from Firestore
                            await deleteDoc(propertyDocRef);
                            console.log("[PropertiesScreen] Property deleted successfully from Firestore:", idToDelete);
                            // Update the local state immediately for better UX
                            setProperties(prev => prev.filter(p => p.id !== idToDelete));
                            // Alert.alert("Success", "Property deleted."); // Optional success alert
                        } catch (error) {
                            console.error("[PropertiesScreen] Error deleting property from Firestore:", error);
                            Alert.alert("Deletion Error", "Could not delete the property. Please try again.");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // --- REMOVED: getWishlistName helper ---


    // --- Render List Item ---
    const renderPropertyItem = ({ item }) => {
        const statusInfo = getStatusInfo(item.status);
        const formattedPrice = item.price ? `$${Number(item.price).toLocaleString()}` : 'N/A';
        const hasLink = !!item.listingLink?.trim();

        const handleViewListing = async () => {
            if (!hasLink) return;
            const url = item.listingLink.trim();
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                try { await Linking.openURL(url); } catch (error) {
                    console.error("Failed to open URL:", error); Alert.alert('Error', 'Could not open the link.');
                }
            } else { Alert.alert('Invalid Link', `Cannot open this URL: ${url}`); }
        };

        // TODO: Implement comparison logic later if needed
        const handleCompareToggle = () => { Alert.alert("Compare Feature", "Add/Remove Compare logic not implemented yet."); };

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })} // Navigate to detail on press
                activeOpacity={0.7} // Visual feedback on press
            >
                <Card style={styles.listItemCard}>
                    <Text style={styles.addressText} numberOfLines={2} ellipsizeMode="tail">
                    {item.address || 'No Address Provided'}
                    </Text>
                    <View style={styles.contentRow}>
                        <View style={styles.infoColumn}>
                            {item.status && (
                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                                <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
                                    <Text style={styles.statusText}>{statusInfo.text}</Text>
                                </View>
                            )}
                            <Text style={styles.priceText}>
                                Price: <Text style={styles.priceValue}>{formattedPrice}</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={handleViewListing} disabled={!hasLink}
                                style={[styles.linkButton, !hasLink && styles.linkButtonDisabled]} >
                                    <Text style={styles.linkButtonText}>View Listing ↗</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.actionsColumn}>
                            {/* Add Compare Button */}
                            <Button title="Compare [+]" onPress={handleCompareToggle} style={[styles.actionButton, styles.compareButton]} textStyle={styles.actionButtonText} />
                            {/* Edit Button */}
                            <Button title="Edit" onPress={() => handleEditProperty(item)} style={[styles.actionButton, styles.editButton]} textStyle={styles.actionButtonText} />
                            {/* Delete Button - pass address for confirmation message */}
                            <Button title="Delete" onPress={() => handleDeleteProperty(item.id, item.address)} style={[styles.actionButton, styles.deleteButton]} textStyle={styles.actionButtonText} />
                        </View>
                    </View>
                </Card>
            </TouchableOpacity> // Wrap Card in TouchableOpacity
        );
    };

   // --- Main Render ---
  return (
    <View style={styles.container}>
      {/* Add New Property Button remains at the top */}
      <Button
        title="+ Add New Property"
        onPress={handleCreateProperty}
        style={styles.createButton}
        // icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />} // Example Icon
      />

       {/* Conditional rendering for loading or list */}
       {isLoading ? (
         <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>
       ) : (
        <FlatList
          data={properties} // Use data loaded from Firestore
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item.id} // Firestore ID is the key
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={ // Show message only when not loading and list is empty
              !isLoading && properties.length === 0 ? (
                 <View style={styles.emptyListContainer}>
                     <Text style={styles.emptyListText}>You haven't tracked any properties yet.</Text>
                     <Text style={styles.emptyListText}>Tap "+ Add New Property" above to start!</Text>
                 </View>
             ) : null
          }
          initialNumToRender={10} // FlatList performance optimizations
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </View>
  );
}

// --- Styles (Keep the updated styles from the previous version) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  createButton: { backgroundColor: '#17a2b8', margin: 15, paddingVertical: 12, elevation: 4, borderRadius: 8 }, // Slightly larger button
  loadingContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
   listContentContainer: { paddingHorizontal: 10, paddingBottom: 20, flexGrow: 1 },
   listItemCard: { marginVertical: 8, padding: 0, elevation: 2, borderRadius: 8, overflow: 'hidden' }, // Added border radius and overflow
   addressText: { fontSize: 16, fontWeight: '600', color: '#333', paddingHorizontal: 15, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 },
   contentRow: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 12 },
   infoColumn: { flex: 1, marginRight: 10, justifyContent: 'center' },
   statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8, maxWidth: '90%' },
   statusEmoji: { fontSize: 14, marginRight: 4 },
   statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff', flexShrink: 1 },
   priceText:{ fontSize: 15, color: '#444', marginBottom: 8 },
    priceValue:{ fontWeight: 'bold' },
    linkButton: { backgroundColor: '#e7f3ff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#007bff', alignSelf: 'flex-start' },
    linkButtonDisabled:{ backgroundColor: '#e9ecef', borderColor: '#adb5bd' },
    linkButtonText: { color: '#0056b3', fontSize: 14, fontWeight: '500' },
    actionsColumn: { justifyContent: 'space-around', alignItems: 'flex-end' }, // Use space-around for vertical spacing
    actionButton: { paddingVertical: 6, paddingHorizontal: 12, marginBottom: 6, minWidth: 80, elevation: 1, alignItems: 'center', borderRadius: 5 },
     actionButtonText: { fontSize: 13, fontWeight: '500', color: '#fff' },
     compareButton: { backgroundColor: '#17a2b8' }, // Teal
    editButton: { backgroundColor: '#007bff' }, // Blue
    deleteButton: { backgroundColor: '#dc3545', marginBottom: 0 }, // Red
    emptyListContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 }, // Added marginTop
    emptyListText:{ fontSize: 16, color: '#777', textAlign: 'center', marginBottom: 10 }, // Increased marginBottom
});

export default PropertiesScreen;