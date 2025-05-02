// File: src/services/CalculatorService.js

// Import shared constants
import {
  IMPORTANCE_LEVELS_MAP,
  RATING_SCORE_MAP,
  RATING_VALUES_MAP,
  MAX_SCORE_PER_ITEM
} from "../constants/appConstants"; // Verify path is correct

// Define the logic for determining if a "Must Have" is met
// Example: Needs at least an "Average" rating (numeric score 3)
const MUST_HAVE_MET_THRESHOLD_SCORE = RATING_SCORE_MAP[RATING_VALUES_MAP.AVERAGE]; // -> 3

// Define weights based on importance strings
const IMPORTANCE_WEIGHT_MAP = {
  [IMPORTANCE_LEVELS_MAP.MUST_HAVE]: 5,       // Example weight for Must Have
  [IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT]: 4,
  [IMPORTANCE_LEVELS_MAP.IMPORTANT]: 3,
  [IMPORTANCE_LEVELS_MAP.NICE_TO_HAVE]: 2,
  [IMPORTANCE_LEVELS_MAP.OPTIONAL]: 1,
};

const CalculatorService = {
/**
 * Calculates how well a property matches a wishlist.
 * @param {object} property Property object with `wishlistRatings` { criterionId: ratingString }
 * @param {object} wishlist Wishlist object with `items` [{ id, criterion, importance }]
 * @returns {object | null} Detailed result or null if inputs invalid.
 * Result: { matchPercentage: number, mustHaveMet: boolean, details: array }
 * Details array item: { criterionId, criterion, importance, ratingValue, numericScore, maxPoints, isMustHave, met }
 */
calculateMatchPercentage: (property, wishlist) => {
  if (!property || !wishlist || !Array.isArray(wishlist.items) || !property.wishlistRatings) {
    console.warn("[Calculator] Invalid input provided.");
    return null; // Return null for invalid input case
  }

  let totalWeightedScore = 0;
  let totalMaxPossibleWeightedScore = 0;
  let mustHaveCriteriaCount = 0;
  let mustHaveCriteriaMetCount = 0;
  const calculationDetails = [];

  wishlist.items.forEach((criterionItem) => {
    const { id: criterionId, criterion, importance } = criterionItem || {};
    if (!criterionId || !criterion || !importance) { /* Skip invalid items */ return; }

    const isMustHave = importance === IMPORTANCE_LEVELS_MAP.MUST_HAVE;
    const weight = IMPORTANCE_WEIGHT_MAP[importance] || IMPORTANCE_WEIGHT_MAP[IMPORTANCE_LEVELS_MAP.OPTIONAL];

    // Convert stored rating string ('good') to numeric score (4)
    const ratingString = property.wishlistRatings[criterionId] || RATING_VALUES_MAP.NOT_RATED;
    const numericScore = RATING_SCORE_MAP[ratingString] ?? 0;

    const weightedScore = numericScore * weight;
    const maxPossibleWeightedScoreForItem = MAX_SCORE_PER_ITEM * weight;

    totalWeightedScore += weightedScore;
    totalMaxPossibleWeightedScore += maxPossibleWeightedScoreForItem;

    let met = false;
    if (isMustHave) {
      mustHaveCriteriaCount++;
      if (numericScore >= MUST_HAVE_MET_THRESHOLD_SCORE) {
        mustHaveCriteriaMetCount++;
        met = true;
      }
    } else {
      // Non-must-have considered 'met' if rated at all
      met = numericScore > RATING_SCORE_MAP[RATING_VALUES_MAP.NOT_RATED];
    }

    calculationDetails.push({
      criterionId, criterion, importance, ratingValue: ratingString, numericScore,
      maxPoints: MAX_SCORE_PER_ITEM, // Raw max score (e.g., 5)
      isMustHave, met
    });
  });

  const matchPercentage = totalMaxPossibleWeightedScore === 0
    ? 100 // If no weighted items, 100% match? Or 0? Decide.
    : (totalWeightedScore / totalMaxPossibleWeightedScore) * 100;

  const allMustHavesMet = mustHaveCriteriaCount === 0 || mustHaveCriteriaMetCount === mustHaveCriteriaCount;

  // Decide if penalty applies - here we don't penalize score, just report `mustHaveMet`
  const finalPercentageClamped = Math.max(0, Math.min(100, matchPercentage));

  return {
    matchPercentage: finalPercentageClamped,
    mustHaveMet: allMustHavesMet,
    details: calculationDetails, // Array of detailed results per item
  };
},
};

export default CalculatorService;