// File: src/screens/ComparisonScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure AsyncStorage is imported
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Removed: import * as Progress from 'react-native-progress'; // Ensure this is removed

// Import Components and Services etc...
import Button from '../components/Button';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
// Import needed constants from appConstants.js (adjust path if needed)
import {
    ASYNC_STORAGE_PROPERTY_KEY, ASYNC_STORAGE_WISHLIST_KEY, MAX_COMPARE_ITEMS,
    IMPORTANCE_LEVELS_ARRAY, // Needed for importance hint lookup
    RATING_OPTIONS_ARRAY,    // Needed for rating label lookup
    RATING_VALUES_MAP,       // Needed if using default value map lookup
    IMPORTANCE_LEVELS_MAP, // Potentially needed if hints rely on map
    MAX_SCORE_PER_ITEM   // Need this if calculating detail progress manually
} from '../constants/appConstants';
import CalculatorService from '../services/CalculatorService';

// --- Individual List Item Component ---
const ComparisonListItem = React.memo(({ itemData, isSelected, onToggleCompare, onShowDetails, onGoToEdit, wishlists }) => {
    const [isExpanded, setIsExpanded] = useState(false); // State for expanding ratings
    const { propWithResult, rank } = itemData ?? {}; // Use default empty object
    const { calculationResult, id: propertyId, address, wishlistId } = propWithResult ?? {}; // Destructure safely

    // Helper functions safely handling potentially missing wishlists array
    const getWishlistName = useCallback((wId) => { if (!wId || !Array.isArray(wishlists)) return 'N/A'; const w = wishlists.find(wl => wl?.id === wId); return w?.name ?? 'Unknown'; }, [wishlists]);
    const getImportanceLabel = useCallback((imp) => { return IMPORTANCE_LEVELS_ARRAY?.find(lvl => lvl.value === imp)?.label || imp; }, []);
    const getRatingLabel = useCallback((rat) => { return RATING_OPTIONS_ARRAY?.find(opt => opt.value === rat)?.label || rat; }, []);

    const scorePercent = calculationResult?.matchPercentage ?? -1;
    const mustHavesOk = calculationResult?.mustHaveMet ?? true;
    const scoreText = scorePercent === -1 ? "N/A" : `${scorePercent.toFixed(0)}%`;
    // --- VVV Use percentage string for basic bar VVV ---
    const progressBarWidth = scorePercent >= 0 ? `${Math.max(0, Math.min(100, scorePercent))}%` : '0%';
    // --- ^^^ Use percentage string for basic bar ^^^ ---


    const toggleExpand = () => setIsExpanded(prev => !prev);

    // Basic check before rendering item details
    if (!propWithResult || !propertyId) {
         console.warn("ComparisonListItem rendering skipped due to invalid itemData or propWithResult", itemData);
         return null;
     }

    return (
        <Card style={[styles.listItemCard, isSelected ? styles.selectedCard : null]}>
             {/* Top Row */}
             <View style={styles.itemTopRow}>
                 <Text style={styles.itemRank}>#{rank ?? 'N/A'}</Text>
                 <Text style={styles.itemAddress} numberOfLines={1} ellipsizeMode="tail">{address || 'No Address'}</Text>
                 {calculationResult && (<Ionicons name={mustHavesOk ? "checkmark-circle" : "close-circle"} size={24} color={mustHavesOk ? "#28a745" : "#dc3545"}/> )}
            </View>

             {/* --- VVV Basic View Progress Bar --- */}
            <View style={styles.itemScoreRow}>
                 <Text style={styles.itemScorePercent}>{scoreText}</Text>
                 {scorePercent >= 0 && (
                     <View style={styles.progressBarContainer}>
                         <View style={[styles.progressBarFill, { width: progressBarWidth }]} />
                     </View>
                  )}
            </View>
            {/* --- ^^^ Basic View Progress Bar ^^^ --- */}

            <Text style={styles.itemComparedVs}>Compared vs: {getWishlistName(wishlistId)}</Text>

            {(calculationResult?.details?.length ?? 0) > 0 && (
                <TouchableOpacity onPress={toggleExpand} style={styles.ratingsToggle}>
                   <Text style={styles.ratingsToggleText}>{isExpanded ? 'Hide Ratings' : 'Show Ratings'}</Text>
                   <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#007bff" />
                </TouchableOpacity>
            )}

            {/* Expanded Ratings Section - with mini bars */}
            {isExpanded && calculationResult?.details && (
                <View style={styles.expandedRatingsContainer}>
                     {calculationResult.details.map(detail => {
                         if (!detail?.criterionId) return null;
                          // Calculate progress for the individual bar (0 to 1)
                         const maxPoints = detail.maxPoints ?? MAX_SCORE_PER_ITEM; // Fallback max points
                         const detailProgressValue = maxPoints > 0 ? Math.max(0, Math.min(1, (detail.numericScore || 0) / maxPoints)) : 0;
                          // Use percentage string for mini-bar width
                          const miniBarWidth = `${(detailProgressValue * 100).toFixed(0)}%`;
                         // Color logic based on met status or score
                         const barColor = detail.met ? '#28a745' : (detailProgressValue > 0 ? '#ffc107' : '#dc3545');


                         return (
                             <View key={detail.criterionId} style={styles.ratingDetailItem}>
                                 <Text style={styles.ratingDetailText} numberOfLines={1}>{detail.criterion} <Text style={styles.importanceHint}>({getImportanceLabel(detail.importance)})</Text></Text>
                                  {/* VVV Using View-based mini-bar VVV */}
                                 <View style={styles.ratingDetailBarContainer}>
                                     <View style={[styles.miniProgressBarFill, { width: miniBarWidth, backgroundColor: barColor }]} />
                                  </View>
                                 {/* ^^^ Using View-based mini-bar ^^^ */}
                                  <Text style={styles.ratingDetailScoreFraction}>{detail.numericScore ?? 0}/{maxPoints}</Text>
                             </View>
                         );
                       })}
                 </View>
            )}

             {/* Bottom Buttons */}
             <View style={styles.itemButtonRow}>
                <Button title="Details" onPress={() => onShowDetails(propWithResult)} style={[styles.actionButton, styles.detailsButton]} textStyle={styles.actionButtonText} />
                 <Button title="Edit Profile" onPress={() => onGoToEdit(propertyId)} style={[styles.actionButton, styles.editButton]} textStyle={{...styles.actionButtonText, color: '#333'}}/>
                 <Button title={isSelected ? "Selected" : "Add Compare"} onPress={() => onToggleCompare(propertyId)} style={[styles.actionButton, styles.compareButton, isSelected && styles.compareButtonSelected]} textStyle={styles.actionButtonText}/>
             </View>
        </Card>
    );
});


// --- Main Comparison Screen Component ---
function ComparisonScreen({ navigation }) {
    // State
    const [properties, setProperties] = useState([]);
    const [wishlists, setWishlists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [minScoreFilter, setMinScoreFilter] = useState(0);
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const isInitialMount = useRef(true);

    // Load Data
     const loadData = useCallback(async () => { console.log("[ComparisonScreen] Loading data..."); if(isInitialMount.current){ setIsLoading(true); } let loadedProps = []; let loadedWishlists = []; try { if (!AsyncStorage) { throw new Error("AsyncStorage is not available!"); } const [propJson, wishJson] = await Promise.all([AsyncStorage.getItem(ASYNC_STORAGE_PROPERTY_KEY), AsyncStorage.getItem(ASYNC_STORAGE_WISHLIST_KEY)]); loadedProps = propJson ? JSON.parse(propJson) : []; loadedWishlists = wishJson ? JSON.parse(wishJson) : []; if (!Array.isArray(loadedProps)) loadedProps = []; if (!Array.isArray(loadedWishlists)) loadedWishlists = []; } catch (e) { console.error("Comparison load err:", e); Alert.alert("Error", "Could not load data."); loadedProps = []; loadedWishlists = []; } finally { console.log(`[ComparisonScreen] Setting state. Props: ${loadedProps.length}, WLs: ${loadedWishlists.length}`); setProperties(loadedProps); setWishlists(loadedWishlists); if (isInitialMount.current) { setIsLoading(false); isInitialMount.current = false; } } }, []);

    // Calculate Scores & Filter
     const scoredAndFilteredProperties = useMemo(() => { console.log(`[ComparisonScreen] useMemo recalc...`); const validProperties = Array.isArray(properties) ? properties : []; const validWishlists = Array.isArray(wishlists) ? wishlists : []; if(validProperties.length === 0 || validWishlists.length === 0) {console.log("useMemo skip: No props or wishlists"); return []; } let rank = 1; const results = []; validProperties.forEach(prop => { if (!prop?.id) return; let calculationResult = null; let calculatedScore = -1; try { const linkedWishlist = prop.wishlistId ? validWishlists.find(wl => wl?.id === prop.wishlistId) : null; if (linkedWishlist) { calculationResult = CalculatorService.calculateMatchPercentage(prop, linkedWishlist); calculatedScore = calculationResult?.matchPercentage ?? -1; } } catch (e) { console.error(`Error calculating score for prop ${prop.id}:`, e); } if (minScoreFilter === 0 || calculatedScore >= minScoreFilter) { results.push({ propWithResult: { ...prop, calculationResult }, calculatedScore }); } }); results.sort((a, b) => b.calculatedScore - a.calculatedScore); const finalRankedResults = results.map(item => ({ ...item, rank: rank++ })); console.log(`[ComparisonScreen] useMemo finished. Returning ${finalRankedResults.length} items.`); return finalRankedResults; }, [properties, wishlists, minScoreFilter]);

    // Effects & Handlers
    useFocusEffect(useCallback(() => { console.log("Comparison focused"); loadData(); }, [loadData]));
    const handleFilterChange = useCallback((value) => { setMinScoreFilter(value ?? 0); }, []);
    const handleToggleCompareSelection = useCallback((propertyId) => { setSelectedForCompare(prev => { if (prev.includes(propertyId)) { return prev.filter(id => id !== propertyId); } else { if (prev.length < MAX_COMPARE_ITEMS) { return [...prev, propertyId]; } else { Alert.alert("Limit", `Max ${MAX_COMPARE_ITEMS} items.`); return prev; } } }); }, []);
    const handleGoToCompare = useCallback(() => { navigation.navigate('SideBySideCompare', { propertyIds: selectedForCompare }); }, [navigation, selectedForCompare]);
    const handleShowPropertyDetail = useCallback((propData) => { navigation.navigate('PropertyDetail', { propertyId: propData?.id }); }, [navigation]);
    const handleGoToEdit = useCallback((propertyId) => { const propToEdit = properties.find(p => p.id === propertyId); if (propToEdit) { navigation.navigate('PropertyForm', { propertyId: propertyId, initialPropertyData: propToEdit, wishlists: wishlists }); } else { Alert.alert("Error", "Cannot find property to edit."); } }, [navigation, properties, wishlists]);

    // Filter Options
    const scoreFilterOptions = [ { value: 0, label: "Show All Scores" }, { value: 50, label: "50% +" }, { value: 70, label: "70% +" }, { value: 80, label: "80% +" }, { value: 90, label: "90% +" } ];

    // --- Render ---
    return (
        <View style={styles.container}>
             {/* Filter */}
            <Card style={styles.filterCard}> <Dropdown label="Filter by Minimum Match Score:" options={scoreFilterOptions} onValueChange={handleFilterChange} value={minScoreFilter} /> </Card>

             {/* List */}
            {isLoading ? ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff"/></View> ) : (
                 <FlatList
                     data={scoredAndFilteredProperties}
                     renderItem={({ item }) => ( <ComparisonListItem itemData={item} isSelected={selectedForCompare.includes(item.propWithResult?.id)} onToggleCompare={handleToggleCompareSelection} onShowDetails={handleShowPropertyDetail} onGoToEdit={handleGoToEdit} wishlists={wishlists} /> )}
                     keyExtractor={(item) => item.propWithResult?.id?.toString() ?? `comp-item-${item.rank ?? Math.random()}`}
                     contentContainerStyle={styles.listContentContainer}
                     ListHeaderComponent={ <Text style={styles.listTitle}> Matching Properties ({scoredAndFilteredProperties?.length ?? 0}) </Text> }
                     ListEmptyComponent={ !isLoading && scoredAndFilteredProperties?.length === 0 ? (<View style={styles.emptyListContainer}><Text style={styles.emptyListText}>No properties match filter.</Text></View>) : null }
                     initialNumToRender={5} maxToRenderPerBatch={10} windowSize={21}
                  />
            )}

             {/* Compare Action Button */}
             {selectedForCompare.length >= 2 && ( <View style={styles.compareActionContainer}> <Button title={`Compare (${selectedForCompare.length})`} onPress={handleGoToCompare} style={styles.compareActionButton} /> <Button title="Clear" onPress={() => setSelectedForCompare([])} style={styles.clearCompareButton} textStyle={styles.clearCompareText}/> </View> )}
        </View>
    );
}


// --- Styles --- (Includes styles for basic main progress bar and mini progress bar)
const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: '#f8f9fa' }, filterCard: { marginHorizontal: 10, marginTop: 10, marginBottom: 5, paddingVertical: 5, }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, listContentContainer: { paddingHorizontal: 10, paddingBottom: 80 }, listTitle: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginLeft: 5, marginBottom: 5, marginTop: 10 },
     // List Item Styles
     listItemCard: { marginVertical: 6, padding: 12, backgroundColor: '#fff', elevation: 1, borderRadius: 6 }, selectedCard: { borderColor: '#007bff', borderWidth: 1.5 }, itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, itemRank: { fontSize: 14, fontWeight: 'bold', color: '#6c757d', marginRight: 8, backgroundColor: '#e9ecef', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }, itemAddress: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333', marginRight: 8 }, itemScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }, itemScorePercent: { fontSize: 18, fontWeight: 'bold', color: '#28a745', marginRight: 10, width: 60 },
      progressBarContainer: { flex: 1, height: 12, backgroundColor: '#e9ecef', borderRadius: 6, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ced4da' },
      progressBarFill: { height: '100%', backgroundColor: '#007bff', borderRadius: 6 },
      itemComparedVs: { fontSize: 13, color: '#6c757d', fontStyle: 'italic', marginBottom: 10 }, ratingsToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, alignSelf: 'flex-start' }, ratingsToggleText: { color: '#007bff', fontSize: 14, fontWeight: '500', marginRight: 4 }, expandedRatingsContainer: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#eee' },
     // Rating Detail Item (Inside Expanded)
      ratingDetailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', },
      ratingDetailText: { fontSize: 14, color: '#444', flex: 0.5, marginRight: 6 },
      importanceHint: { color: '#777', fontSize: 12, fontStyle: 'italic'},
     ratingDetailBarContainer: { flex: 0.35, height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden', borderWidth: 0.5, borderColor: '#ced4da', marginRight: 6 }, // Mini Bar outer
     miniProgressBarFill: { height: '100%', borderRadius: 4}, // Mini Bar inner fill (width set dynamically)
     ratingDetailScoreFraction: { fontSize: 13, fontWeight: '500', color: '#555', flex: 0.15, textAlign: 'right', minWidth: 35, },
      itemButtonRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 12 }, actionButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, elevation: 1, alignItems: 'center' }, actionButtonText: { fontSize: 13, fontWeight: '500', color: '#fff' }, detailsButton: { backgroundColor: '#6c757d' }, editButton: { backgroundColor: '#ffc107', }, compareButton: { backgroundColor: '#17a2b8', }, compareButtonSelected: { backgroundColor: '#138496'}, emptyListContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 40 }, emptyListText: { fontSize: 16, color: '#777', textAlign: 'center' }, compareActionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: 'rgba(248, 249, 250, 0.95)', borderTopWidth: 1, borderTopColor: '#ddd', elevation: 8 }, compareActionButton: { flex: 3, backgroundColor: '#17a2b8', marginRight: 10, paddingVertical: 12 }, clearCompareButton: { flex: 1, backgroundColor: '#6c757d', paddingVertical: 12 }, clearCompareText: { color: '#fff' },
});


export default ComparisonScreen;