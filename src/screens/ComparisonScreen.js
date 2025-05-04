// File: src/screens/ComparisonScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- Firebase Imports ---
import { auth, db } from '../services/firebase';
// Removed orderBy from import temporarily for properties query
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
// -----------------------

// --- Component Imports ---
import Button from '../components/Button';
import Card from '../components/Card'; // Ensure Card handles title/children correctly
import Dropdown from '../components/Dropdown';
// ------------------------

// --- Constants ---
import {
    MAX_COMPARE_ITEMS, IMPORTANCE_LEVELS_ARRAY, RATING_OPTIONS_ARRAY,
    RATING_VALUES_MAP, MAX_SCORE_PER_ITEM
} from '../constants/appConstants';
// ----------------

// --- Services ---
import CalculatorService from '../services/CalculatorService'; // Ensure this uses criterion name keys
// ----------------

// --- Comparison List Item Component (Assumed Correct from Previous Steps) ---
const ComparisonListItem = React.memo(({ itemData, isSelected, onToggleCompare, onShowDetails, onGoToEdit, wishlists }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { propWithResult, rank } = itemData ?? {};
    const { calculationResult, id: propertyId, address, wishlistId } = propWithResult ?? {};
    const getWishlistName = useCallback((wId) => { if (!wId || !Array.isArray(wishlists)) return 'N/A'; const w = wishlists.find(wl => wl?.id === wId); return w?.name ?? 'Unknown'; }, [wishlists]);
    const getImportanceLabel = useCallback((imp) => IMPORTANCE_LEVELS_ARRAY?.find(lvl => lvl.value === imp)?.label || imp, []);
    const getRatingLabel = useCallback((rat) => RATING_OPTIONS_ARRAY?.find(opt => opt.value === rat)?.label || rat, []);
    const scorePercent = calculationResult?.matchPercentage ?? -1;
    const mustHavesOk = calculationResult?.mustHaveMet ?? true;
    const scoreText = scorePercent === -1 ? "N/A" : `${scorePercent.toFixed(0)}%`;
    const progressBarWidth = scorePercent >= 0 ? `${Math.max(0, Math.min(100, scorePercent))}%` : '0%';
    const toggleExpand = () => setIsExpanded(prev => !prev);
    if (!propWithResult || !propertyId) return null;

    return (
        <Card style={[styles.listItemCard, isSelected ? styles.selectedCard : null]}>
             <View style={styles.itemTopRow}><Text style={styles.itemRank}>#{rank ?? 'N/A'}</Text><Text style={styles.itemAddress} numberOfLines={1} ellipsizeMode="tail">{address || 'No Address'}</Text>{calculationResult && (<Ionicons name={mustHavesOk ? "checkmark-circle" : "close-circle"} size={24} color={mustHavesOk ? "#28a745" : "#dc3545"}/> )}</View>
             <View style={styles.itemScoreRow}><Text style={styles.itemScorePercent}>{scoreText}</Text>{scorePercent >= 0 && (<View style={styles.progressBarContainer}><View style={[styles.progressBarFill, { width: progressBarWidth }]} /></View>)}</View>
             <Text style={styles.itemComparedVs}>Compared vs: {getWishlistName(wishlistId)}</Text>
             {(calculationResult?.details?.length ?? 0) > 0 && (<TouchableOpacity onPress={toggleExpand} style={styles.ratingsToggle}><Text style={styles.ratingsToggleText}>{isExpanded ? 'Hide Ratings' : 'Show Ratings'}</Text><Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#007bff" /></TouchableOpacity>)}
             {isExpanded && calculationResult?.details && (<View style={styles.expandedRatingsContainer}>{calculationResult.details.map(detail => { if (!detail?.criterion) return null; const maxPoints = detail.maxPoints ?? MAX_SCORE_PER_ITEM; const detailProgressValue = maxPoints > 0 ? Math.max(0, Math.min(1, (detail.numericScore || 0) / maxPoints)) : 0; const miniBarWidth = `${(detailProgressValue * 100).toFixed(0)}%`; const barColor = detail.met ? '#28a745' : (detailProgressValue > 0 ? '#ffc107' : '#dc3545'); const detailKey = detail.criterionId || detail.criterion || `detail-${Math.random()}`; return (<View key={detailKey} style={styles.ratingDetailItem}><Text style={styles.ratingDetailText} numberOfLines={1}>{detail.criterion} <Text style={styles.importanceHint}>({getImportanceLabel(detail.importance)})</Text></Text><View style={styles.ratingDetailBarContainer}><View style={[styles.miniProgressBarFill, { width: miniBarWidth, backgroundColor: barColor }]} /></View><Text style={styles.ratingDetailScoreFraction}>{detail.numericScore ?? 0}/{maxPoints}</Text></View> ); })}</View>)}
             <View style={styles.itemButtonRow}><Button title="Details" onPress={() => onShowDetails(propWithResult)} style={[styles.actionButton, styles.detailsButton]} textStyle={styles.actionButtonText} /><Button title="Edit Profile" onPress={() => onGoToEdit(propertyId)} style={[styles.actionButton, styles.editButton]} textStyle={{...styles.actionButtonText, color: '#333'}}/><Button title={isSelected ? "Selected ✓" : "Add Compare"} onPress={() => onToggleCompare(propertyId)} style={[styles.actionButton, styles.compareButton, isSelected && styles.compareButtonSelected]} textStyle={styles.actionButtonText}/></View>
        </Card>
    );
});
// --- End List Item Component ---


// --- Main Comparison Screen Component ---
function ComparisonScreen({ navigation }) {
    // State
    const [properties, setProperties] = useState([]);
    const [wishlists, setWishlists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [minScoreFilter, setMinScoreFilter] = useState(0);
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const isMounted = useRef(true);

    // Load Data from Firestore (Corrected)
    const loadData = useCallback(async () => {
        if (!isMounted.current) return;
        console.log("[ComparisonScreen] loadData STARTING (orderBy REMOVED for props test)...");
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) { console.warn("[ComparisonScreen] No user logged in."); if (isMounted.current) { setProperties([]); setWishlists([]); setIsLoading(false); } return; }
        const userId = user.uid;

        try { // Opening brace for try
            const propsRef = collection(db, "properties");
            // --- VVV QUERY MODIFIED FOR TESTING (orderBy removed) VVV ---
            const propsQuery = query(propsRef, where("userId", "==", userId));
             // --- ^^^ QUERY MODIFIED FOR TESTING ^^^ ---

            const wishRef = collection(db, "wishlists");
            // Keep orderBy here if index exists and works for wishlists
            const wishQuery = query(wishRef, where("userId", "==", userId), orderBy("name", "asc"));

            console.log(`[ComparisonScreen] Fetching data for user: ${userId}`);
            const [propsSnapshot, wishSnapshot] = await Promise.all([ getDocs(propsQuery), getDocs(wishQuery) ]);

            const loadedProps = [];
            propsSnapshot.forEach((doc) => { console.log(`[ComparisonScreen DEBUG] Fetched Prop ID: ${doc.id}`); loadedProps.push({ id: doc.id, ...doc.data() }); }); // Simplified log

            const loadedWishlists = [];
            wishSnapshot.forEach((doc) => { loadedWishlists.push({ id: doc.id, ...doc.data() }); });

            console.log(`[ComparisonScreen] Fetched Props Count: ${loadedProps.length}`);
            // Optional: Log first item details if needed for debugging
            // if (loadedProps.length > 0) { console.log("[ComparisonScreen] First Fetched Prop Data (sample):", JSON.stringify(loadedProps[0], null, 2)); }
            console.log(`[ComparisonScreen] Fetched Wishlists Count: ${loadedWishlists.length}`);
            // if (loadedWishlists.length > 0) { console.log("[ComparisonScreen] First Fetched Wishlist Data (sample):", JSON.stringify(loadedWishlists[0], null, 2)); }

            if (isMounted.current) { setProperties(loadedProps); setWishlists(loadedWishlists); }
        // --- VVV ADDED Missing Brace VVV ---
        }
        // --- ^^^ ADDED Missing Brace ^^^ ---
        catch (e) { // Opening brace for catch
            console.error("[ComparisonScreen] Error loading Firestore data:", e);
            if (e.code) { console.error("[ComparisonScreen] Firestore Error Code:", e.code); }
            Alert.alert("Error", "Could not load data from database.");
            if (isMounted.current) { setProperties([]); setWishlists([]); }
        } finally { // Opening brace for finally
            if (isMounted.current) { setIsLoading(false); }
            console.log("[ComparisonScreen] loadData FINISHED.");
        } // Closing brace for finally
    }, []); // Closing brace for useCallback
    // --- End Load Data ---


    // Calculate Scores & Filter (Keep logging)
     const scoredAndFilteredProperties = useMemo(() => {
         console.log(`[ComparisonScreen] useMemo calculating... Filter: ${minScoreFilter}%. Input Props: ${properties.length}, WLs: ${wishlists.length}`);
         if (properties.length === 0) { console.log("[ComparisonScreen] useMemo: No properties loaded."); return []; }
         let rank = 1;
         const results = [];
         properties.forEach((prop, index) => {
             console.log(`[ComparisonScreen] useMemo Processing Prop #${index + 1}, ID: ${prop.id}`);
             if (!prop?.id) { console.log(`   -> Skipping, missing ID`); return; }
             let calculationResult = null;
             let calculatedScore = -1;
             let linkedWishlist = null;
             try {
                 if (prop.wishlistId) {
                    linkedWishlist = wishlists.find(wl => wl?.id === prop.wishlistId);
                     console.log(`   -> Linked WL ID: ${prop.wishlistId}. Found in state?: ${!!linkedWishlist}`);
                } else { console.log(`   -> Not linked.`); }
                 if (linkedWishlist) {
                    console.log(`   -> Calculating score vs WL: ${linkedWishlist.name}`);
                    console.log("      -> Prop Ratings for Calc:", JSON.stringify(prop.wishlistRatings || {})); // Log ratings
                    console.log("      -> WL Items for Calc:", JSON.stringify(linkedWishlist.items || [])); // Log items
                    if (CalculatorService?.calculateMatchPercentage) {
                         calculationResult = CalculatorService.calculateMatchPercentage(prop, linkedWishlist);
                         calculatedScore = calculationResult?.matchPercentage ?? -1;
                         console.log(`   -> Calc Result: Score=${calculatedScore.toFixed(1)}%, MustHavesMet=${calculationResult?.mustHaveMet}`);
                    } else { console.error("   -> CalculatorService missing!"); }
                }
            } catch (e) { console.error(`   -> Error calculating score for prop ${prop.id}:`, e); }
             const meetsFilter = (minScoreFilter === 0 || calculatedScore >= minScoreFilter);
             console.log(`   -> Score: ${calculatedScore.toFixed(1)}%, Meets Filter?: ${meetsFilter}`);
             if (meetsFilter) {
                 const propDataForList = prop.calculationResult ? prop : { ...prop, calculationResult }; // Pass result down
                 results.push({ propWithResult: propDataForList, calculatedScore });
             }
        });
        results.sort((a, b) => b.calculatedScore - a.calculatedScore); // Sort desc by score
        const finalRankedResults = results.map(item => ({ ...item, rank: rank++ }));
        console.log(`[ComparisonScreen] useMemo finished. Final list length: ${finalRankedResults.length}`);
        return finalRankedResults;
    }, [properties, wishlists, minScoreFilter]); // Dependencies

    // Effects & Handlers (Keep as is)
    useFocusEffect(useCallback(() => { isMounted.current = true; console.log("[ComparisonScreen] Screen Focused - Calling loadData."); loadData(); return () => { console.log("[ComparisonScreen] Screen Unfocused / Unmounting."); isMounted.current = false; }; }, [loadData]));
    const handleFilterChange = useCallback((value) => { setMinScoreFilter(value ?? 0); }, []);
    const handleToggleCompareSelection = useCallback((propertyId) => { if (!propertyId) return; setSelectedForCompare(prev => { const idx = prev.indexOf(propertyId); if (idx > -1) { return prev.filter(id => id !== propertyId); } else { if (prev.length < MAX_COMPARE_ITEMS) { return [...prev, propertyId]; } else { Alert.alert("Limit", `Max ${MAX_COMPARE_ITEMS} items.`); return prev; } } }); }, []);
    const handleGoToCompare = useCallback(() => { if (selectedForCompare.length >= 2) { navigation.navigate('SideBySideCompare', { propertyIds: selectedForCompare }); } else { Alert.alert("Select More", "Please select at least 2 properties."); } }, [navigation, selectedForCompare]);
    const handleShowPropertyDetail = useCallback((propData) => { if (propData?.id) { navigation.navigate('PropertyDetail', { propertyId: propData.id }); } else { console.error("Cannot navigate to detail, missing property ID"); } }, [navigation]);
    const handleGoToEdit = useCallback((propertyId) => { const propToEdit = properties.find(p => p.id === propertyId); if (propToEdit) { navigation.navigate('PropertyForm', { propertyId: propertyId, initialPropertyData: propToEdit }); } else { Alert.alert("Error", "Could not find property data to edit."); } }, [navigation, properties]);
    const scoreFilterOptions = useMemo(() => [ { value: 0, label: "Show All Scores" }, { value: 50, label: "50% +" }, { value: 70, label: "70% +" }, { value: 80, label: "80% +" }, { value: 90, label: "90% +" } ], []);

    // --- Render (Cleaned) ---
    return (
        <View style={styles.container}>
            <Card style={styles.filterCard}>
                <Dropdown
                    label="Filter by Minimum Match Score:"
                    options={scoreFilterOptions}
                    onValueChange={handleFilterChange}
                    value={minScoreFilter}
                />
            </Card>
            {isLoading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff"/></View>
            ) : (
                <FlatList
                    data={scoredAndFilteredProperties}
                    renderItem={({ item }) => (
                        <ComparisonListItem
                           itemData={item}
                           isSelected={selectedForCompare.includes(item.propWithResult?.id)}
                           onToggleCompare={handleToggleCompareSelection}
                           onShowDetails={handleShowPropertyDetail}
                           onGoToEdit={handleGoToEdit}
                           wishlists={wishlists} // Pass wishlists state for name lookup
                        />
                    )}
                    keyExtractor={(item) => item.propWithResult?.id ?? `comp-fallback-${item.rank}`}
                    contentContainerStyle={styles.listContentContainer}
                    ListHeaderComponent={ // Ensure Text is used for the header
                        <Text style={styles.listTitle}>Matching Properties ({scoredAndFilteredProperties.length})</Text>
                    }
                    ListEmptyComponent={ // Ensure Text is used for the empty component
                        !isLoading && scoredAndFilteredProperties.length === 0 ? (
                            <View style={styles.emptyListContainer}>
                                <Text style={styles.emptyListText}>
                                    {properties.length === 0 ? "You haven't tracked any properties yet." : "No properties match the current filter."}
                                </Text>
                            </View>
                        ) : null
                    }
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={21}
                 />
            )}
            {selectedForCompare.length >= 2 ? (
                <View style={styles.compareActionContainer}>
                    <Button
                       title={`Compare (${selectedForCompare.length}) Selected`}
                       onPress={handleGoToCompare}
                       style={styles.compareActionButton}
                    />
                    <TouchableOpacity onPress={() => setSelectedForCompare([])} style={styles.clearCompareButton}>
                        <Text style={styles.clearCompareText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View> // Ensure no trailing space/text
    );
}

// --- Styles (Keep existing) ---
const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: '#f8f9fa' },
     filterCard: { marginHorizontal: 10, marginTop: 10, marginBottom: 5, paddingVertical: 5, },
     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
     listContentContainer: { paddingHorizontal: 10, paddingBottom: 80 },
     listTitle: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginLeft: 5, marginBottom: 5, marginTop: 10 },
     listItemCard: { marginVertical: 6, padding: 12, backgroundColor: '#fff', elevation: 1, borderRadius: 6 },
     selectedCard: { borderColor: '#007bff', borderWidth: 1.5, elevation: 3 },
     itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
     itemRank: { fontSize: 14, fontWeight: 'bold', color: '#6c757d', marginRight: 8, backgroundColor: '#e9ecef', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
     itemAddress: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333', marginRight: 8 },
     itemScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
     itemScorePercent: { fontSize: 18, fontWeight: 'bold', color: '#28a745', marginRight: 10, width: 60 },
     progressBarContainer: { flex: 1, height: 12, backgroundColor: '#e9ecef', borderRadius: 6, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ced4da' },
     progressBarFill: { height: '100%', backgroundColor: '#007bff', borderRadius: 6 },
     itemComparedVs: { fontSize: 13, color: '#6c757d', fontStyle: 'italic', marginBottom: 10 },
     ratingsToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, alignSelf: 'flex-start' },
     ratingsToggleText: { color: '#007bff', fontSize: 14, fontWeight: '500', marginRight: 4 },
     expandedRatingsContainer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#eee' },
     ratingDetailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', },
     ratingDetailText: { fontSize: 14, color: '#444', flex: 0.5, marginRight: 6 },
     importanceHint: { color: '#777', fontSize: 12, fontStyle: 'italic'},
     ratingDetailBarContainer: { flex: 0.35, height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ced4da', marginRight: 6 },
     miniProgressBarFill: { height: '100%', borderRadius: 4},
     ratingDetailScoreFraction: { fontSize: 13, fontWeight: '500', color: '#555', flex: 0.15, textAlign: 'right', minWidth: 35, },
     itemButtonRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 12 },
     actionButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, elevation: 1, alignItems: 'center', minWidth: 80 },
     actionButtonText: { fontSize: 13, fontWeight: '500', color: '#fff' },
     detailsButton: { backgroundColor: '#6c757d' },
     editButton: { backgroundColor: '#ffc107', },
     compareButton: { backgroundColor: '#17a2b8', },
     compareButtonSelected: { backgroundColor: '#0a5864'},
     emptyListContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 40 },
     emptyListText: { fontSize: 16, color: '#777', textAlign: 'center', lineHeight: 24 },
     compareActionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: 'rgba(248, 249, 250, 0.95)', borderTopWidth: 1, borderTopColor: '#ddd', elevation: 8, alignItems: 'center' },
     compareActionButton: { flex: 3, backgroundColor: '#17a2b8', marginRight: 10, paddingVertical: 12, borderRadius: 6 },
     clearCompareButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
     clearCompareText: { color: '#dc3545', fontWeight: '600', fontSize: 15 },
});

export default ComparisonScreen;