// File: src/screens/PropertyDetailScreen.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    Alert, Dimensions, Platform, TouchableOpacity, Modal, // Added Modal
    FlatList // Added FlatList for modal content
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';

// --- Firebase Imports ---
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
// -----------------------

// --- react-native-chart-kit Imports ---
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"; // Keep BarChart import for now, we'll remove its usage
// --- End chart-kit Imports ---

// --- Component Imports ---
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
// ------------------------

// --- Constants Import ---
import {
    IMPORTANCE_LEVELS_ARRAY, RATING_OPTIONS_ARRAY, IMPORTANCE_LEVELS_MAP,
    RATING_SCORE_MAP, MAX_SCORE_PER_ITEM, RATING_VALUES_MAP
} from '../constants/appConstants';
// -----------------------

// --- Service Import ---
import CalculatorService from '../services/CalculatorService';
// ---------------------


// --- Dimensions and Colors ---
const screenWidth = Dimensions.get('window').width;
const chartKitChartWidth = screenWidth * 0.95;
const chartHeight = 260; // Height for Line Chart
const pieChartHeight = chartHeight * 0.8; // Adjusted height for Pie Chart
const chartLineColor = (opacity = 1) => `rgba(0, 123, 255, ${opacity})`;
const chartLabelColor = (opacity = 1) => `rgba(50, 50, 50, ${opacity})`;
const chartGridColor = "#e8e8e8";
const defaultDotStroke = "#0056b3";
const selectedDotColor = '#ff9800';
const tooltipBackgroundColor = 'rgba(60, 60, 60, 0.9)';
// Removed barChartColor as we're replacing the bar chart
const chartBackgroundColor = "#ffffff";
const pieChartRatingColors = { // Keep pie chart colors
    [RATING_VALUES_MAP.EXCELLENT]: '#28a745', [RATING_VALUES_MAP.GOOD]: '#5cb85c',
    [RATING_VALUES_MAP.AVERAGE]: '#ffc107', [RATING_VALUES_MAP.POOR]: '#f0ad4e',
    [RATING_VALUES_MAP.VERY_POOR]: '#dc3545',
};
// NEW: Colors for Progress Bars (adjust as desired)
const importanceColors = {
    [IMPORTANCE_LEVELS_MAP.MUST_HAVE]: '#d9534f', // Reddish
    [IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT]: '#f0ad4e', // Orange
    [IMPORTANCE_LEVELS_MAP.IMPORTANT]: '#5bc0de', // Light Blue
    [IMPORTANCE_LEVELS_MAP.NICE_TO_HAVE]: '#5cb85c', // Greenish
    [IMPORTANCE_LEVELS_MAP.OPTIONAL]: '#adb5bd', // Grey
};
// -------------------------------------


function PropertyDetailScreen({ navigation }) {
    const route = useRoute();
    const propertyId = route.params?.propertyId;

    // --- State Definitions ---
    const [property, setProperty] = useState(null);
    const [linkedWishlist, setLinkedWishlist] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, data: null });
    const [selectedDataIndex, setSelectedDataIndex] = useState(null);
    const isMounted = useRef(true);
    // NEW: State for Modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]); // Array of criteria strings


    // --- Data Loading Callback (Keep existing Firestore logic) ---
    const loadDetails = useCallback(async () => {
        // ... (keep existing loadDetails logic exactly as before) ...
         if (!isMounted.current) return;
        console.log(`[PDS] loadDetails - STARTING Firestore fetch for ID: ${propertyId}`);
        setIsLoading(true);
        setTooltipPos(prev => ({ ...prev, visible: false }));
        setSelectedDataIndex(null);
        setProperty(null);
        setLinkedWishlist(null);
        setCalculationResult(null);
        setIsModalVisible(false); // Reset modal on reload

        if (!propertyId) { /* ... error handling ... */ if (isMounted.current) setIsLoading(false); return; }
        const user = auth.currentUser;
        if (!user) { /* ... error handling ... */ if (isMounted.current) setIsLoading(false); return; }

        try {
            const propertyDocRef = doc(db, "properties", propertyId);
            const propertyDocSnap = await getDoc(propertyDocRef);
            if (!propertyDocSnap.exists()) throw new Error(`Property with ID ${propertyId} not found.`);
            const fetchedPropertyData = { id: propertyDocSnap.id, ...propertyDocSnap.data() };
            if (!isMounted.current) return; setProperty(fetchedPropertyData);

            let fetchedWishlistData = null;
            if (fetchedPropertyData.wishlistId) {
                try {
                    const wishlistDocRef = doc(db, "wishlists", fetchedPropertyData.wishlistId);
                    const wishlistDocSnap = await getDoc(wishlistDocRef);
                    if (wishlistDocSnap.exists()) {
                        const wishlistData = wishlistDocSnap.data();
                        if (wishlistData.userId === user.uid) { fetchedWishlistData = { id: wishlistDocSnap.id, ...wishlistData }; if (isMounted.current) setLinkedWishlist(fetchedWishlistData); }
                        else { console.warn(`[PDS] Wishlist ${fetchedPropertyData.wishlistId} mismatch.`); if (isMounted.current) setLinkedWishlist(null); }
                    } else { console.warn(`[PDS] Wishlist ${fetchedPropertyData.wishlistId} not found.`); if (isMounted.current) setLinkedWishlist(null); }
                } catch (wishlistError) { console.error("[PDS] Error fetching wishlist:", wishlistError); if (isMounted.current) setLinkedWishlist(null); }
            } else { if (isMounted.current) setLinkedWishlist(null); }

            if (fetchedPropertyData && fetchedWishlistData && CalculatorService) {
                const calcResult = CalculatorService.calculateMatchPercentage(fetchedPropertyData, fetchedWishlistData);
                if (isMounted.current) setCalculationResult(calcResult);
            } else { if (isMounted.current) setCalculationResult(null); }
        } catch (e) { console.error("[PDS] Error loading details:", e); Alert.alert("Load Error", e.message); if (isMounted.current) { setProperty(null); setLinkedWishlist(null); setCalculationResult(null); } }
        finally { if (isMounted.current) { setIsLoading(false); } }
    }, [propertyId, navigation]);


    // --- Effect to load data on focus (Keep as is) ---
     useFocusEffect(
        useCallback(() => {
            isMounted.current = true;
            loadDetails(); // Load data when screen comes into focus
            return () => { // Cleanup when screen goes out of focus
                isMounted.current = false;
                setTooltipPos(prev => ({ ...prev, visible: false }));
                setSelectedDataIndex(null);
                setIsModalVisible(false); // Close modal if navigating away
            };
        }, [loadDetails]) // Rerun effect if loadDetails changes (due to propertyId)
    );

    // --- Chart Data Preparation Hooks ---
    // Existing Line Chart (Keep as is)
    const chartKitLineData = useMemo(() => { /* ... same logic ... */ if (!calculationResult?.details?.length) return null; const details = calculationResult.details; const maxLabels = 8; const dataLength = details.length; const labelStep = dataLength <= maxLabels ? 1 : Math.ceil(dataLength / maxLabels); const labels = details.map((item, index) => index % labelStep === 0 ? (item?.criterion?.substring(0, 8) + '..' || `Item ${index+1}`) : '' ); const dataValues = details.map(item => item?.numericScore ?? 0); if (dataValues.length === 0) return null; return { labels, datasets: [{ data: dataValues, strokeWidth: 2 }] }; }, [calculationResult]);

    // MODIFIED: Pie Chart Data Hook (Adds Percentage)
    const pieChartData = useMemo(() => {
        if (!calculationResult?.details?.length || !RATING_OPTIONS_ARRAY) { return null; }
        const ratingCounts = {};
        let totalRatedItems = 0;
        RATING_OPTIONS_ARRAY.forEach(option => {
            if (option.value !== RATING_VALUES_MAP.NOT_RATED) {
                ratingCounts[option.value] = { count: 0, label: option.label, value: option.value };
            }
        });
        calculationResult.details.forEach(item => {
            if (item.ratingValue && item.ratingValue !== RATING_VALUES_MAP.NOT_RATED) {
                if (ratingCounts[item.ratingValue]) {
                    ratingCounts[item.ratingValue].count++;
                    totalRatedItems++;
                }
            }
        });
        if (totalRatedItems === 0) { return null; }

        // Format for PieChart AND custom legend, adding percentage
        const formattedData = Object.values(ratingCounts)
            .filter(data => data.count > 0)
            .map(data => {
                const percentage = totalRatedItems > 0 ? ((data.count / totalRatedItems) * 100) : 0;
                return {
                    name: `${data.label}: ${data.count} (${percentage.toFixed(0)}%)`, // Label for Pie Chart (might be cut off)
                    count: data.count,
                    color: pieChartRatingColors[data.value] || '#adb5bd',
                    legendFontColor: '#555',
                    legendFontSize: 14,
                    // Add raw label and value for custom legend and modal trigger
                    label: data.label,
                    value: data.value,
                    percentage: percentage.toFixed(0) + '%'
                };
            });
        return formattedData.length > 0 ? formattedData : null;
    }, [calculationResult]);

    // NEW: Hook for Priority Performance Progress Bar Data
    const importanceProgressData = useMemo(() => {
        if (!calculationResult?.details?.length || !IMPORTANCE_LEVELS_ARRAY) {
            return null;
        }

        const progressMap = new Map();
        // Initialize map based on defined importance levels
        IMPORTANCE_LEVELS_ARRAY.forEach(level => {
            progressMap.set(level.value, {
                label: level.label,
                value: level.value,
                achievedScore: 0,
                possibleScore: 0,
                ratedItemCount: 0
            });
        });

        // Calculate scores for each importance level
        calculationResult.details.forEach(item => {
            // Only consider items that were actually rated
            if (item.ratingValue !== RATING_VALUES_MAP.NOT_RATED && progressMap.has(item.importance)) {
                const group = progressMap.get(item.importance);
                group.achievedScore += item.numericScore;
                group.possibleScore += MAX_SCORE_PER_ITEM; // Max score for one item
                group.ratedItemCount += 1;
            }
        });

        // Format data for rendering, calculating percentage, filtering out levels with no rated items
        const formattedProgressData = Array.from(progressMap.values())
            .filter(group => group.ratedItemCount > 0) // Only show levels with rated items
            .map(group => ({
                ...group,
                percentage: group.possibleScore > 0 ? (group.achievedScore / group.possibleScore) * 100 : 0,
            }));

        // Sort by the original order defined in IMPORTANCE_LEVELS_ARRAY
        formattedProgressData.sort((a, b) => {
             const indexA = IMPORTANCE_LEVELS_ARRAY.findIndex(level => level.value === a.value);
             const indexB = IMPORTANCE_LEVELS_ARRAY.findIndex(level => level.value === b.value);
             return indexA - indexB;
         });


        return formattedProgressData.length > 0 ? formattedProgressData : null;

    }, [calculationResult]);


    // Pros & Cons Hook (Keep as is)
    const prosAndConsData = useMemo(() => { /* ... same logic ... */ if (!calculationResult?.details?.length) return null; const pros = []; const cons = []; const highImportanceLevels = [IMPORTANCE_LEVELS_MAP.MUST_HAVE, IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT]; const goodRatings = [RATING_VALUES_MAP.EXCELLENT, RATING_VALUES_MAP.GOOD]; const poorRatings = [RATING_VALUES_MAP.POOR, RATING_VALUES_MAP.VERY_POOR]; calculationResult.details.forEach(item => { if (highImportanceLevels.includes(item.importance)) { if (goodRatings.includes(item.ratingValue)) { pros.push(item.criterion); } else if (poorRatings.includes(item.ratingValue)) { cons.push(item.criterion); } } }); if (pros.length === 0 && cons.length === 0) return null; return { pros, cons }; }, [calculationResult]);

    // --- Interaction Handlers ---
    // Existing Handlers (Keep as is)
    const handleGoToEdit = useCallback(() => { if (property) { navigation.navigate('PropertyForm', { propertyId: property.id, initialPropertyData: property }); } }, [navigation, property]);
    const handleDataPointClick = useCallback((data) => { /* ... same tooltip logic ... */ const details = calculationResult?.details; if (Array.isArray(details) && data.index >= 0 && data.index < details.length) { const itemDetail = details[data.index]; if (itemDetail) { const criterionName = itemDetail.criterion || `Item ${data.index + 1}`; const ratingLabel = Array.isArray(RATING_OPTIONS_ARRAY) ? (RATING_OPTIONS_ARRAY.find(o => o.value === itemDetail.ratingValue)?.label ?? String(itemDetail.ratingValue)) : String(itemDetail.ratingValue); setTooltipPos({ x: data.x, y: data.y, visible: true, data: { value: data.value, criterionName, ratingLabel } }); setSelectedDataIndex(data.index); } else { setTooltipPos(prev => ({ ...prev, visible: false })); setSelectedDataIndex(null); }} else { setTooltipPos(prev => ({ ...prev, visible: false })); setSelectedDataIndex(null); }}, [calculationResult]);
    const handleScroll = useCallback(() => { if (tooltipPos.visible) { setTooltipPos(prev => ({ ...prev, visible: false })); setSelectedDataIndex(null); }}, [tooltipPos.visible]);

    // NEW: Handler for Pie Chart Legend Press -> Show Modal
    const handleLegendItemPress = useCallback((ratingValue, ratingLabel) => {
        if (!calculationResult?.details) return;

        const matchingCriteria = calculationResult.details
            .filter(item => item.ratingValue === ratingValue)
            .map(item => item.criterion); // Get only the names

        if (matchingCriteria.length > 0) {
            setModalTitle(`Criteria Rated "${ratingLabel}"`);
            setModalData(matchingCriteria);
            setIsModalVisible(true);
        }
    }, [calculationResult]);

    // NEW: Handler to close modal
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setModalTitle('');
        setModalData([]);
    };


    // --- Render Logic ---
    if (isLoading) { return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff"/><Text style={styles.loadingText}>Loading Property Details...</Text></View> ); }
    if (!property) { return ( <View style={styles.container}><Card title="Error"><Text style={styles.errorText}>Property data could not be loaded.</Text><Button title="Go Back" onPress={() => navigation.canGoBack() ? navigation.goBack() : null}/></Card></View> ); }

    const scorePercent = calculationResult?.matchPercentage ?? -1; const scoreText = scorePercent === -1 ? "N/A" : `${scorePercent.toFixed(0)}%`; const scoreStyle = scorePercent === -1 ? styles.scoreNA : scorePercent >= 75 ? styles.scoreGood : scorePercent >= 50 ? styles.scoreOkay : styles.scorePoor;

    return (
        <>
            <ScrollView style={styles.container} onScroll={handleScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContentContainer} >
                {/* Header Card (Keep as is) */}
                <Card title={`Analysis for: ${property?.address || 'Unknown Property'}`}>
                    <Text style={styles.detailLabel}>Overall Score:</Text><Text style={[styles.overallScoreValue, scoreStyle]}>{scoreText}</Text>
                    {linkedWishlist && (<Text style={styles.detailValueSmall}>(Compared against: {linkedWishlist?.name || 'Unnamed Wishlist'})</Text>)}
                    {!linkedWishlist && (<Text style={styles.detailValueSmall}>(Not linked to a wishlist for scoring)</Text>)}
                    {calculationResult && calculationResult.hasOwnProperty('mustHaveMet') && (<Text style={[styles.mustHaveStatus, calculationResult.mustHaveMet ? styles.mustHaveMet : styles.mustHaveNotMet]}>Must Haves Met: {calculationResult.mustHaveMet ? 'Yes ✅' : 'No ❌'}</Text>)}
                    <Button title="Edit Full Profile" onPress={handleGoToEdit} style={styles.editButton} textStyle={styles.editButtonText} icon={<Ionicons name="create-outline" size={16} color="#333" style={{ marginRight: 5 }} />} />
                </Card>

                {/* Pros & Cons Card (Keep as is) */}
                {prosAndConsData && ( <Card title="Key Strengths & Weaknesses">{prosAndConsData.pros.length > 0 && (<View style={styles.proConSection}><Text style={styles.proConTitlePro}>Strengths (High Importance & Rating):</Text>{prosAndConsData.pros.map((item, index) => (<View key={`pro-${index}`} style={styles.proConItem}><Ionicons name="checkmark-circle-outline" size={18} color="#28a745" style={styles.proConIcon} /><Text style={styles.proConText}>{item}</Text></View>))}</View>)}{prosAndConsData.cons.length > 0 && (<View style={styles.proConSection}><Text style={styles.proConTitleCon}>Weaknesses (High Importance & Low Rating):</Text>{prosAndConsData.cons.map((item, index) => (<View key={`con-${index}`} style={styles.proConItem}><Ionicons name="close-circle-outline" size={18} color="#dc3545" style={styles.proConIcon} /><Text style={styles.proConText}>{item}</Text></View>))}</View>)}{prosAndConsData.pros.length === 0 && prosAndConsData.cons.length > 0 && (<Text style={styles.placeholderTextSmall}>No significant strengths identified.</Text>)}{prosAndConsData.pros.length > 0 && prosAndConsData.cons.length === 0 && (<Text style={styles.placeholderTextSmall}>No significant weaknesses identified.</Text>)}</Card> )}

                {/* MODIFIED: Pie Chart Card (with Custom Legend) */}
                {linkedWishlist && (
                    <Card title="Rating Distribution">
                        <View style={styles.pieChartContainer}>
                            {pieChartData && pieChartData.length > 0 ? (
                                <>
                                    <PieChart
                                        data={pieChartData} // Data still needed for calculation
                                        width={chartKitChartWidth * 0.9}
                                        height={pieChartHeight}
                                        chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                                        accessor={"count"}
                                        backgroundColor={"transparent"}
                                        paddingLeft={"15"}
                                        absolute // Show count in default tooltips if any
                                        hasLegend={false} // Disable built-in legend
                                    />
                                    {/* NEW: Custom Tappable Legend */}
                                    <View style={styles.customLegendContainer}>
                                        {pieChartData.map((item) => (
                                            <TouchableOpacity
                                                key={item.value}
                                                style={styles.legendItem}
                                                onPress={() => handleLegendItemPress(item.value, item.label)} // Pass value and label
                                            >
                                                <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                                                <Text style={styles.legendText}>
                                                    {`${item.label}: ${item.count} (${item.percentage})`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.placeholderText}>
                                    {calculationResult ? 'No items have been rated yet.' : 'Calculating...'}
                                </Text>
                            )}
                        </View>
                    </Card>
                )}

                {/* Line Chart Card (Keep as is) */}
                <Card title="Wishlist Item Ratings"><View style={styles.chartWrapper}>{chartKitLineData && chartKitLineData.datasets[0]?.data?.length > 0 ? (<View style={styles.chartViewBox}><Text style={styles.chartNote}>(Tap points for details)</Text><LineChart data={chartKitLineData} width={chartKitChartWidth} height={chartHeight} yAxisInterval={1} segments={MAX_SCORE_PER_ITEM} fromZero={true} chartConfig={{backgroundColor: chartBackgroundColor, backgroundGradientFrom: chartBackgroundColor, backgroundGradientTo: chartBackgroundColor, decimalPlaces: 0, color: chartLineColor, labelColor: chartLabelColor, propsForDots: { r: "5", strokeWidth: "1.5", stroke: defaultDotStroke }, propsForBackgroundLines: { stroke: chartGridColor }}} bezier style={styles.chartStyle} withHorizontalLabels={true} withVerticalLabels={true} onDataPointClick={handleDataPointClick} getDotColor={(dataPoint, dataPointIndex) => dataPointIndex === selectedDataIndex ? selectedDotColor : chartLineColor(1)}/></View>) : (<Text style={styles.placeholderText}>{linkedWishlist ? 'No rated criteria found.' : 'Link to a wishlist.'}</Text>)}{tooltipPos.visible && tooltipPos.data && (<View style={[styles.tooltipContainer, { top: tooltipPos.y - 65, left: Math.min(Math.max(5, tooltipPos.x - 60), chartKitChartWidth - 125) } ]}><Text style={styles.tooltipTextName} numberOfLines={2}>{tooltipPos.data.criterionName}</Text><Text style={styles.tooltipTextScore}>{tooltipPos.data.ratingLabel} ({tooltipPos.data.value}/{MAX_SCORE_PER_ITEM})</Text></View>)}</View></Card>

                {/* NEW: Priority Performance Card (Replaces Bar Chart) */}
                 {linkedWishlist && importanceProgressData && (
                    <Card title="Priority Performance">
                         <Text style={styles.chartNote}>(% of Max Score Achieved for Rated Items)</Text>
                        <View style={styles.progressContainer}>
                            {importanceProgressData.map((item) => (
                                <View key={item.value} style={styles.progressItem}>
                                    <Text style={styles.progressLabel}>{item.label} ({item.ratedItemCount} rated)</Text>
                                    <View style={styles.progressBarBackground}>
                                        <View style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${Math.max(0, Math.min(100, item.percentage))}%`, // Ensure width is 0-100%
                                                backgroundColor: importanceColors[item.value] || '#adb5bd' // Use defined color
                                            }
                                        ]}/>
                                    </View>
                                    <Text style={styles.progressPercentage}>{item.percentage.toFixed(0)}%</Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                 )}
                 {linkedWishlist && !importanceProgressData && calculationResult && (
                     <Card title="Priority Performance">
                        <Text style={styles.placeholderText}>No items have been rated yet.</Text>
                     </Card>
                 )}


                <View style={{ height: 30 }} />
            </ScrollView>

            {/* NEW: Modal for Pie Chart Interaction */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay} // Full screen overlay to dismiss modal
                    activeOpacity={1}
                    onPressOut={handleCloseModal} // Dismiss on press outside content
                >
                    <View style={styles.modalContentContainer} onStartShouldSetResponder={() => true}>
                         {/* Prevent clicks inside modal from closing it */}
                         <View style={styles.modalHeader}>
                             <Text style={styles.modalTitle}>{modalTitle}</Text>
                             <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                                 <Ionicons name="close-circle" size={28} color="#888" />
                             </TouchableOpacity>
                         </View>
                         <FlatList
                            data={modalData}
                            keyExtractor={(item, index) => `modal-item-${index}`}
                            renderItem={({ item }) => <Text style={styles.modalListItem}>{item}</Text>}
                            ListEmptyComponent={<Text style={styles.modalListItem}>No criteria found.</Text>}
                            style={styles.modalList}
                         />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    // ... (keep existing styles for container, loading, error, detail labels, overall score, musthave, edit button, chartWrapper, chartViewBox, chartStyle, chartNote, placeholderText, tooltip)
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    scrollContentContainer: { padding: 10, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' },
    loadingText:{ marginTop: 15, fontSize: 16, color: '#666' },
    errorText: { fontSize: 16, color: '#dc3545', textAlign: 'center', paddingVertical: 20, paddingHorizontal: 10 },
    detailLabel: { fontSize: 16, color: '#555', fontWeight: '600', marginTop: 10, marginBottom: 3 },
    detailValueSmall:{ fontSize: 13, color: '#6c757d', marginBottom: 8, fontStyle: 'italic' },
    overallScoreValue:{ fontSize: 38, fontWeight: 'bold', marginBottom: 5, textAlign: 'left' },
    scoreNA:{ color: '#888', fontWeight: 'normal', fontSize: 28 },
    scoreGood: { color: '#28a745' }, scoreOkay: { color: '#ffc107' }, scorePoor: { color: '#dc3545' },
    mustHaveStatus: { fontSize: 14, fontWeight: '500', marginBottom: 15, fontStyle: 'italic' },
    mustHaveMet: { color: '#28a745' }, mustHaveNotMet: { color: '#dc3545' },
    editButton: { marginTop: 10, marginBottom: 5, backgroundColor: '#e0e0e0', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    editButtonText: { color: '#333', fontWeight: '500', fontSize: 14 },
    chartWrapper: { position: 'relative', marginBottom: 10, alignItems:'center', width: '100%' },
    chartViewBox:{ alignItems: 'center', marginVertical: 5, width: '100%' },
    chartStyle: { marginVertical: 8, borderRadius: 8, paddingRight: Platform.OS === 'ios' ? 25 : 35, paddingBottom: 10 }, // Keep for line chart
    chartNote:{ fontSize: 12, color: '#777', textAlign: 'center', marginTop: -5, marginBottom: 10, fontStyle: 'italic' },
    placeholderText:{ fontSize: 15, color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 25, lineHeight: 22 },
    tooltipContainer:{ position: 'absolute', backgroundColor: tooltipBackgroundColor, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, minWidth: 120, alignItems:'center'},
    tooltipTextName:{ color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'center'},
    tooltipTextScore:{ color: '#f0f0f0', fontSize: 12, textAlign: 'center'},

    // --- Pie Chart & Custom Legend Styles ---
    pieChartContainer: { alignItems: 'center', paddingVertical: 10, width: '100%' },
    customLegendContainer: {
        flexDirection: 'row', // Arrange items side-by-side
        flexWrap: 'wrap', // Allow wrapping to next line
        justifyContent: 'center', // Center items horizontally
        marginTop: 15,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15, // Space between items
        marginBottom: 8, // Space between lines if wrapping
    },
    legendColorBox: {
        width: 14,
        height: 14,
        borderRadius: 2, // Slightly rounded square
        marginRight: 6,
    },
    legendText: {
        fontSize: 13,
        color: '#444',
    },

    // --- Pros & Cons Styles ---
    proConSection: { marginBottom: 15, paddingHorizontal: 5 },
    proConTitlePro: { fontSize: 15, fontWeight: '600', color: '#28a745', marginBottom: 8 },
    proConTitleCon: { fontSize: 15, fontWeight: '600', color: '#dc3545', marginBottom: 8 },
    proConItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 5 },
    proConIcon: { marginRight: 8 },
    proConText: { fontSize: 14, color: '#333', flexShrink: 1 },
    placeholderTextSmall: { fontSize: 14, color: '#888', fontStyle: 'italic', textAlign: 'left', paddingHorizontal: 5, marginTop: 5 },

    // --- Priority Progress Bar Styles ---
    progressContainer: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    progressItem: {
        marginBottom: 15,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
        marginBottom: 5,
    },
    progressBarBackground: {
        height: 18, // Increased height
        backgroundColor: '#e9ecef', // Light grey background
        borderRadius: 9, // Make it rounded
        overflow: 'hidden', // Ensure fill stays within bounds
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 9, // Match background rounding
    },
    progressPercentage: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 3,
    },

    // --- Modal Styles ---
     modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '85%', // Responsive width
        maxHeight: '70%', // Limit height
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1, // Allow title to take space
        marginRight: 10, // Space before close button
    },
    closeButton: {
       padding: 5, // Easier tap target
    },
    modalList: {
      flexGrow: 0, // Prevent list from taking over modal height unnecessarily
    },
    modalListItem: {
        fontSize: 15,
        color: '#555',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

});

export default PropertyDetailScreen;