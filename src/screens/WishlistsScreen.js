// File: src/screens/WishlistsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { useFocusEffect } from '@react-navigation/native'; // Important hook

// --- Firebase Imports ---
import { auth, db } from '../services/firebase'; // Import auth and db
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore'; // Firestore functions
// -----------------------

// Import our custom components
import Button from '../components/Button'; // Assuming '../components/Button' path is correct
import Card from '../components/Card';     // Assuming '../components/Card' path is correct
// Import constants - REMOVED AsyncStorage Keys
// import { ASYNC_STORAGE_WISHLIST_KEY, ASYNC_STORAGE_PROPERTY_KEY } from '../constants/appConstants';

function WishlistsScreen({ navigation }) {
    // --- State Variables ---
    const [wishlists, setWishlists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true); // To prevent state updates after unmount

    // --- Load Wishlists from Firestore ---
    const loadWishlists = useCallback(async () => {
        if (!isMounted.current) {
             console.log("[WishlistsScreen] loadWishlists called but component unmounted.");
             return;
        }
        console.log("[WishlistsScreen] loadWishlists STARTING...");
        setIsLoading(true); // Set loading true when fetching starts

        const user = auth.currentUser; // Get current user

        if (!user) {
            console.warn("[WishlistsScreen] No user logged in. Cannot load wishlists.");
            // Alert.alert("Not Logged In", "Please log in to view your wishlists."); // Optional
            if (isMounted.current) {
                setWishlists([]); // Clear any existing wishlists
                setIsLoading(false);
            }
            // Optional: Navigate back to login
            // if (navigation.canGoBack()) navigation.goBack();
            return; // Stop if no user
        }

        const userId = user.uid;

        try {
            // Create query to get wishlists for the current user, ordered by name (example)
            const wishlistsRef = collection(db, "wishlists");
            const q = query(wishlistsRef,
                            where("userId", "==", userId), // Filter by userId field
                            orderBy("name", "asc") // Optional: order alphabetically by name
                           );

            console.log(`[WishlistsScreen] Fetching wishlists for user: ${userId}`);
            const querySnapshot = await getDocs(q); // Execute the query

            const loadedWishlists = [];
            querySnapshot.forEach((doc) => {
                loadedWishlists.push({ id: doc.id, ...doc.data() });
            });

            console.log(`[WishlistsScreen] loadWishlists Success. Wishlists found: ${loadedWishlists.length}`);
            if (isMounted.current) { // Check component is still mounted
                setWishlists(loadedWishlists); // Update state
            }

        } catch (e) {
            console.error("[WishlistsScreen] Error loading wishlists from Firestore:", e);
            Alert.alert("Loading Error", "Could not load your wishlists from the database.");
             if (isMounted.current) {
                setWishlists([]); // Reset on error
            }
        } finally {
             if (isMounted.current) {
                setIsLoading(false); // Stop loading indicator
            }
            console.log("[WishlistsScreen] loadWishlists FINISHED.");
        }
    }, []); // Empty dependency array - relies on useFocusEffect trigger

    // --- useFocusEffect: Reload data when screen comes into view ---
    useFocusEffect(
        useCallback(() => {
            isMounted.current = true; // Component is focused/mounted
            console.log("[WishlistsScreen] Screen Focused - Calling loadWishlists.");
            loadWishlists(); // Call the load function when screen is focused

            return () => { // Cleanup when screen loses focus or unmounts
                console.log("[WishlistsScreen] Screen Unfocused / Unmounting.");
                isMounted.current = false;
            };
        }, [loadWishlists]) // Dependency ensures it uses the stable load function
    );

    // --- REMOVED: useEffect hook for saving wishlists to AsyncStorage ---

    // --- Event Handlers ---
    const handleCreateWishlist = () => {
        console.log('[WishlistsScreen] Navigating to WishlistForm (Create)');
        // Navigate without passing save callback
        navigation.navigate('WishlistForm');
    };

    const handleEditWishlist = (wishlistToEdit) => {
        console.log('[WishlistsScreen] Navigating to WishlistForm (Edit) for ID:', wishlistToEdit.id);
         // Navigate passing only ID and initial data
         navigation.navigate('WishlistForm', {
           wishlistId: wishlistToEdit.id,
           initialWishlistData: wishlistToEdit,
         });
    };

    // --- Updated Delete Handler for Firestore ---
    const handleDeleteWishlist = (idToDelete, name) => {
        // console.log('[WishlistsScreen] handleDeleteWishlist called for ID:', idToDelete);
        Alert.alert(
            'Delete Wishlist',
            `Are you sure you want to delete the wishlist "${name || 'this wishlist'}"? This cannot be undone.`, // Use name in message
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => { // Make async for Firestore operation
                        console.log("[WishlistsScreen] Deleting wishlist confirmed:", idToDelete);
                        try {
                            // Create a reference to the document to delete
                            const wishlistDocRef = doc(db, "wishlists", idToDelete);
                            // Delete from Firestore
                            await deleteDoc(wishlistDocRef);
                            console.log("[WishlistsScreen] Wishlist deleted successfully from Firestore:", idToDelete);

                            // Update local state AFTER successful deletion
                            setWishlists(prevWishlists => prevWishlists.filter(wl => wl.id !== idToDelete));
                            // Alert.alert("Success", "Wishlist deleted."); // Optional success feedback

                            // TODO: Consider Cloud Function to handle unlinking properties automatically on backend
                            // For now, properties might remain linked until viewed/edited elsewhere.

                        } catch (error) {
                             console.error("[WishlistsScreen] Error deleting wishlist from Firestore:", error);
                             Alert.alert("Deletion Error", "Could not delete the wishlist. Please try again.");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };
    // --- End Updated Delete Handler ---


    // --- Render List Item ---
    const renderWishlistItem = ({ item }) => (
        // Wrap card in TouchableOpacity to allow navigation on tap (e.g., to view details)
        // If no detail view exists for wishlists, remove TouchableOpacity
        <TouchableOpacity
            onPress={() => handleEditWishlist(item)} // Example: Go to edit on tap
            activeOpacity={0.7}
        >
            <Card style={styles.listItemCard}>
                <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle} numberOfLines={1} ellipsizeMode='tail'>{item.name || 'Untitled Wishlist'}</Text>
                    <Text style={styles.listItemDetail}>
                            Criteria: {Array.isArray(item.items) ? item.items.length : 0} items
                    </Text>
                </View>
                <View style={styles.listItemButtons}>
                    {/* <Button // Edit is now handled by tapping the card
                        title="Edit"
                        onPress={() => handleEditWishlist(item)}
                        style={styles.editButton}
                        textStyle={styles.buttonTextSmall}
                    /> */}
                    <Button
                        title="Delete"
                        // Pass name for better confirmation message
                        onPress={() => handleDeleteWishlist(item.id, item.name)}
                        style={styles.deleteButton}
                        textStyle={styles.buttonTextSmall}
                    />
                </View>
            </Card>
         </TouchableOpacity>
    );

    // --- Main Render Logic ---
    return (
        <View style={styles.container}>
            <Button
                title="+ Create New Wishlist"
                onPress={handleCreateWishlist}
                style={styles.createButton}
                // icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />} // Example Icon
            />

            {isLoading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /></View>
            ) : (
                <FlatList
                    data={wishlists} // Use data loaded from Firestore
                    renderItem={renderWishlistItem}
                    keyExtractor={(item) => item.id} // Firestore ID is the key
                    contentContainerStyle={styles.listContentContainer}
                    ListEmptyComponent={
                        !isLoading && wishlists.length === 0 ? (
                            <View style={styles.emptyListContainer}>
                                <Text style={styles.emptyListText}>You haven't created any wishlists yet.</Text>
                                <Text style={styles.emptyListText}>Tap "+ Create New Wishlist" above to start!</Text>
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

// --- Styles (Keep the updated styles from the previous version) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    createButton: { backgroundColor: '#28a745', margin: 15, paddingVertical: 12, elevation: 4, borderRadius: 8 }, // Green button
    loadingContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContentContainer: { paddingHorizontal: 10, paddingBottom: 20, flexGrow: 1 },
    listItemCard: { marginVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 8, elevation: 2 }, // Added BG and radius
    listItemContent: { flex: 1, marginRight: 10 },
    listItemTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4, color: '#333' },
    listItemDetail: { fontSize: 14, color: '#555' },
    listItemButtons: { flexDirection: 'row', alignItems: 'center' },
    editButton: { // Kept style in case needed later
       backgroundColor: '#ffc107', paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, elevation: 2, borderRadius: 5
    },
    deleteButton: {
       backgroundColor: '#dc3545', paddingVertical: 7, paddingHorizontal: 14, elevation: 2, borderRadius: 5
    },
    buttonTextSmall: { fontSize: 14, fontWeight: '500', color: '#fff' }, // White text on buttons
    emptyListContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
    emptyListText:{ fontSize: 16, color: '#777', textAlign: 'center', marginBottom: 10 },
});

export default WishlistsScreen;