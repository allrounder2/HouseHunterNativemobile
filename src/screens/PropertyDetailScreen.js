// File: src/screens/PropertyDetailScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    Alert, Dimensions, Platform, TouchableOpacity
} from 'react-native'; // Ensure all needed core components are imported
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useFocusEffect } from '@react-navigation/native';

// --- react-native-chart-kit Import ---
import { LineChart } from "react-native-chart-kit";
// --- End chart-kit Import ---

// --- Other Necessary Imports ---
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons'; // Keep Ionicons
// --- Constants Import ---
import {
    ASYNC_STORAGE_PROPERTY_KEY, ASYNC_STORAGE_WISHLIST_KEY,
    IMPORTANCE_LEVELS_ARRAY, // For Tooltip or later Radar Chart
    RATING_OPTIONS_ARRAY,    // For Tooltip
    RATING_SCORE_MAP,        // Optional, for advanced coloring logic if needed
    MAX_SCORE_PER_ITEM
} from '../constants/appConstants';
import CalculatorService from '../services/CalculatorService';
// --- End Imports ---


const screenWidth = Dimensions.get('window').width;
const chartKitChartWidth = screenWidth * 0.95; // Chart width
const chartHeight = 260;                     // Chart height

// Define colors used
const chartLineColor = (opacity = 1) => `rgba(0, 123, 255, ${opacity})`; // Blue
const chartLabelColor = (opacity = 1) => `rgba(50, 50, 50, ${opacity})`; // Dark Gray
const chartGridColor = "#e8e8e8";
const defaultDotStroke = "#0056b3"; // Darker Blue outline
const selectedDotColor = '#ff9800'; // Orange for selected dot fill
const tooltipBackgroundColor = 'rgba(60, 60, 60, 0.9)'; // Darker tooltip
// Colors based on score (optional, could be used in getDotColor instead of default)
const chartSuccessColor = '#28a745'; // Green
const chartWarningColor = '#ffc107'; // Yellow
const chartDangerColor = '#dc3545'; // Red
const lowScoreThreshold = RATING_SCORE_MAP?.poor ?? 2; // Define low score threshold


function PropertyDetailScreen({ navigation }) {
    const route = useRoute();
    const propertyId = route.params?.propertyId;

    // --- State Definitions ---
    const [property, setProperty] = useState(null);
    const [linkedWishlist, setLinkedWishlist] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, data: null });
    const [selectedDataIndex, setSelectedDataIndex] = useState(null); // Index of the clicked dot

    console.log(`[PDS] Rendering Screen - ID: ${propertyId}`);


    // --- Data Loading Callback (Full Version) ---
    const loadDetails = useCallback(async () => {
        console.log(`[PDS] loadDetails - START for ID: ${propertyId}`); setIsLoading(true);
        let foundProperty = null; let foundWishlist = null; let calcResult = null;
        try {
            if (!propertyId) throw new Error("Missing Property ID");
            if (!AsyncStorage) throw new Error("AsyncStorage Missing");
            const [propJson, wishJson] = await Promise.all([ AsyncStorage.getItem(ASYNC_STORAGE_PROPERTY_KEY), AsyncStorage.getItem(ASYNC_STORAGE_WISHLIST_KEY) ]);
            let allProps = []; if (propJson) { try { allProps = JSON.parse(propJson); if (!Array.isArray(allProps)) allProps = []; } catch (e) { console.error("Parse Props Err:",e); allProps = []; }}
            foundProperty = Array.isArray(allProps) ? allProps.find(p => p?.id === propertyId) : null;
            if (!foundProperty) throw new Error("Property Not Found In Data");
            if (foundProperty.wishlistId) {
                let allWishlists = []; if(wishJson) { try { allWishlists=JSON.parse(wishJson); if(!Array.isArray(allWishlists)) allWishlists=[]; } catch(e){console.error("Parse WL Err:",e); allWishlists=[];} }
                foundWishlist = allWishlists.find(wl => wl?.id === foundProperty.wishlistId);
                if (foundWishlist && CalculatorService) { calcResult = CalculatorService.calculateMatchPercentage(foundProperty, foundWishlist); console.log("[PDS] Calc complete."); }
                else if (!foundWishlist) { console.warn(`[PDS] Linked wishlist ID ${foundProperty.wishlistId} not found.`); }
             }
             setProperty(foundProperty); setLinkedWishlist(foundWishlist); setCalculationResult(calcResult);
          } catch (e) { console.error("Detail load err:", e); Alert.alert("Load Error", e.message || "Err"); setProperty(null); setLinkedWishlist(null); setCalculationResult(null); if (e.message.includes("Not Found")||e.message.includes("Missing")) { navigation.goBack();} }
          finally { console.log("[PDS] Finally: setting loading false"); setIsLoading(false); }
     }, [propertyId, navigation]);

    // --- Effect to load data ---
     useFocusEffect(useCallback(() => {
         loadDetails();
         // Cleanup on blur: hide tooltip and reset selection
         return () => {
            setTooltipPos(prev => ({ ...prev, visible: false }));
            setSelectedDataIndex(null);
          };
        }, [loadDetails]));

    // --- Chart Data Preparation ---
    const chartKitLineData = useMemo(() => {
         if (!calculationResult?.details?.length) { return null; }
         const details = calculationResult.details;
         const maxLabels = 8; const dataLength = details.length; const labelStep = dataLength <= maxLabels ? 1 : Math.ceil(dataLength / maxLabels);
         // Generate labels - potentially sparse based on labelStep
         const labels = details.map((item, index) => index % labelStep === 0 ? (item?.criterion?.substring(0, 8) + '..' || '?') : '' );
         const dataValues = details.map(item => item?.numericScore ?? 0);
         if (dataValues.length === 0) return null;
         // Return structure for chart-kit
         return { labels, datasets: [{ data: dataValues, strokeWidth: 2 }] }; // color is set in chartConfig now
      }, [calculationResult]);


    // --- Interaction Handlers ---
    const handleGoToEdit = useCallback(() => { /* ... navigation logic ... */ }, [navigation, property, linkedWishlist]);

     const handleDataPointClick = useCallback((data) => {
         console.log('Datapoint click - Index:', data.index, 'Value:', data.value, 'Pos:', data.x, data.y);
         const details = calculationResult?.details;
         if (Array.isArray(details) && data.index >= 0 && data.index < details.length) {
             const itemDetail = details[data.index];
             if (itemDetail) {
                const criterionName = itemDetail.criterion || `Item ${data.index + 1}`;
                // Get rating text label using constant safely
                 const ratingLabel = Array.isArray(RATING_OPTIONS_ARRAY) ? (RATING_OPTIONS_ARRAY.find(o => o.value === itemDetail.ratingValue)?.label ?? itemDetail.ratingValue) : itemDetail.ratingValue;
                setTooltipPos({ x: data.x, y: data.y, visible: true, data: { value: data.value, criterionName, ratingLabel } });
                setSelectedDataIndex(data.index); // Set selected state
             } else { console.warn("Clicked index out of bounds or item detail missing"); setTooltipPos(prev => ({ ...prev, visible: false })); setSelectedDataIndex(null); }
          } else { console.warn("Cannot show tooltip, details array invalid or index issue"); setTooltipPos(prev => ({ ...prev, visible: false })); setSelectedDataIndex(null); }
      }, [calculationResult]); // Recalculate if calculationResult changes

     const handleScroll = useCallback(() => {
         if (tooltipPos.visible) {
             console.log("Scroll detected, hiding tooltip");
             setTooltipPos(prev => ({ ...prev, visible: false }));
             setSelectedDataIndex(null); // Deselect on scroll
          }
     }, [tooltipPos.visible]); // Depend only on visibility


    // --- Render Logic ---
    if (isLoading) { return (<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff"/><Text style={styles.loadingText}>Loading...</Text></View>); }
    if (!property) { return ( <View style={styles.container}><Text style={styles.errorText}>Property Data Unavailable.</Text><Button title="Go Back" onPress={() => navigation.goBack()}/></View> ); }

    // Calculate score display AFTER checking property existence
    const scorePercent = calculationResult?.matchPercentage ?? -1; const scoreText = scorePercent === -1 ? "N/A" : `${scorePercent.toFixed(0)}%`;

    return (
        <ScrollView style={styles.container} onScroll={handleScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled">
            {/* Header Card */}
             <Card title={`Analysis for: ${property?.address || 'Property'}`}>
                 <Text style={styles.detailLabel}>Overall Score:</Text>
                <Text style={[styles.overallScoreValue, scorePercent === -1 && styles.scoreNA]}>{scoreText}</Text>
                 <Text style={styles.detailValueSmall}>(Compared vs: {linkedWishlist?.name || 'N/A'})</Text>
                 <Button title="Edit Full Profile" onPress={handleGoToEdit} style={styles.editButton} textStyle={{color: '#333'}}/>
             </Card>

            {/* Line Chart Card */}
             <Card title="Wishlist Item Ratings">
                <View style={styles.chartWrapper}>
                     {chartKitLineData && chartKitLineData.datasets[0]?.data?.length > 0 ? (
                         <View style={styles.chartViewBox}>
                             <Text style={styles.chartNote}>(Tap points for details)</Text>
                              <LineChart
                                 data={chartKitLineData}
                                 width={chartKitChartWidth}
                                 height={chartHeight}
                                 yAxisInterval={1} // Ensures integer ticks on Y
                                 segments={MAX_SCORE_PER_ITEM} // Forces Y axis 0-5 scale
                                 fromZero={true}
                                 chartConfig={{
                                     backgroundColor: "#ffffff", backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff", decimalPlaces: 0,
                                     color: chartLineColor, // Base color for line/labels
                                     labelColor: chartLabelColor, // Base color for axis labels
                                      propsForDots: { r: "5", strokeWidth: "1.5", stroke: defaultDotStroke }, // Default style
                                      propsForBackgroundLines: { stroke: chartGridColor }
                                  }}
                                 bezier // Smooth line
                                  style={{ marginVertical: 8, borderRadius: 8, paddingRight: 25}}
                                  withHorizontalLabels={true} // Show Y-axis labels
                                 withVerticalLabels={false} // Hide default X-axis labels
                                  onDataPointClick={handleDataPointClick} // Handle clicks
                                  // --- VVV Function to color dots based on selection/value --- VVV
                                  getDotColor={(dataPoint, dataPointIndex) => {
                                      if (dataPointIndex === selectedDataIndex) {
                                          return selectedDotColor; // Orange for selected
                                       }
                                      // Example: Color based on score value (optional)
                                      // const score = dataPoint?.y ?? 0;
                                      // if (score < lowScoreThreshold) return chartDangerColor; // Red for low
                                       return chartLineColor(1); // Default blue if not selected/low
                                   }}
                                   // --- ^^^ Function to color dots ^^^ ---
                              />
                          </View>
                     ) : ( <Text style={styles.placeholderText}>No rating details to display.</Text> )}

                     {/* Tooltip Rendering */}
                     {tooltipPos.visible && tooltipPos.data && (
                         <View style={[ styles.tooltipContainer, { top: tooltipPos.y - 65, left: Math.min(Math.max(5, tooltipPos.x - 60), chartKitChartWidth - 125) } ]}>
                             <Text style={styles.tooltipTextName} numberOfLines={2}>{tooltipPos.data.criterionName}</Text>{/* Allow 2 lines */}
                             <Text style={styles.tooltipTextScore}>{tooltipPos.data.ratingLabel} ({tooltipPos.data.value}/{MAX_SCORE_PER_ITEM})</Text>
                         </View>
                     )}
                  </View>{/* End chartWrapper */}
             </Card>

            {/* Radar Chart Placeholder */}
            <Card title="Performance by Importance">
                <Text style={styles.placeholderText}>(Radar Chart implementation requires different library or custom SVG)</Text>
            </Card>

            {/* Debug Card */}
             {/* <Card title="Debug"><Text style={styles.debugData}>...</Text></Card> */}

            <View style={{ height: 30 }} />{/* Spacer */}
        </ScrollView>
    );
}


// --- Styles ---
const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: '#f0f0f0', padding: 10 },
     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
     loadingText:{ marginTop: 10, fontSize: 16, color: '#888' },
     errorText: { fontSize: 18, color: 'red', textAlign: 'center', marginTop: 50, padding: 20 },
     detailLabel: { fontSize: 16, color: '#555', fontWeight: 'bold', marginTop: 10, marginBottom: 3 },
     detailValueSmall:{ fontSize: 14, color: '#6c757d', marginBottom: 15, fontStyle: 'italic' },
     overallScoreValue:{ fontSize: 36, fontWeight: 'bold', color: '#28a745', marginBottom: 5 },
     scoreNA:{ color: '#888', fontWeight: 'normal', fontSize: 24 },
     editButton: { marginTop: 10, marginBottom: 5, backgroundColor: '#ffc107', alignSelf: 'flex-start', paddingHorizontal: 15 },
     chartViewBox:{ alignItems: 'center', marginVertical: 5 },
     chartNote:{ fontSize: 12, color: '#777', textAlign: 'center', marginBottom: -5, fontStyle: 'italic' },
     placeholderText:{ fontSize: 15, color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10 },
     debugData: { backgroundColor: '#eee', padding: 10, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', },
     chartWrapper: { position: 'relative', marginBottom: 10, alignItems:'center' },
      tooltipContainer:{
         position: 'absolute', backgroundColor: tooltipBackgroundColor, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, minWidth: 110, alignItems:'center'},
      tooltipTextName:{ color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 3, textAlign: 'center'},
      tooltipTextScore:{ color: '#f0f0f0', fontSize: 12, textAlign: 'center'},
});

export default PropertyDetailScreen;