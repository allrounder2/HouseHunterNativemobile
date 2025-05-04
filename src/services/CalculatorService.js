// File: src/services/CalculatorService.js
import {
  IMPORTANCE_LEVELS_MAP, RATING_SCORE_MAP, RATING_VALUES_MAP, MAX_SCORE_PER_ITEM
} from "../constants/appConstants";

const MUST_HAVE_MET_THRESHOLD_SCORE = RATING_SCORE_MAP[RATING_VALUES_MAP.AVERAGE] || 3;
const IMPORTANCE_WEIGHT_MAP = {
  [IMPORTANCE_LEVELS_MAP.MUST_HAVE]: 5, [IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT]: 4,
  [IMPORTANCE_LEVELS_MAP.IMPORTANT]: 3, [IMPORTANCE_LEVELS_MAP.NICE_TO_HAVE]: 2,
  [IMPORTANCE_LEVELS_MAP.OPTIONAL]: 1,
};

const CalculatorService = {
  calculateMatchPercentage: (property, wishlist) => {
    if (!property || !wishlist || !Array.isArray(wishlist.items) || (property.wishlistRatings && typeof property.wishlistRatings !== 'object')) {
        console.warn("[Calculator] Invalid input.", { propertyExists: !!property, wishlistExists: !!wishlist, itemsIsArray: Array.isArray(wishlist?.items), ratingsIsObject: typeof property?.wishlistRatings === 'object' });
        return { matchPercentage: 0, mustHaveMet: true, details: [] };
    }
    const ratings = property.wishlistRatings || {};
    let totalWeightedScore = 0, totalMaxPossibleWeightedScore = 0;
    let mustHaveCriteriaCount = 0, mustHaveCriteriaMetCount = 0;
    const calculationDetails = [];
    console.log("[Calculator] Starting calculation..."); // Keep log

    wishlist.items.forEach((criterionItem, index) => {
        const { criterion, importance } = criterionItem || {};
        if (!criterion || typeof criterion !== 'string' || !criterion.trim() || !importance) {
            console.warn(`[Calculator] Skipping invalid criterionItem at index ${index}:`, criterionItem); return;
        }
        const trimmedCriterion = criterion.trim();
        // console.log(`[Calculator] Processing: Criterion="${trimmedCriterion}", Importance=${importance}`); // Keep if needed

        const isMustHave = importance === IMPORTANCE_LEVELS_MAP.MUST_HAVE;
        const weight = IMPORTANCE_WEIGHT_MAP[importance] || IMPORTANCE_WEIGHT_MAP[IMPORTANCE_LEVELS_MAP.OPTIONAL];

        // --- USE CRITERION NAME FOR LOOKUP ---
        const ratingString = ratings[trimmedCriterion] || RATING_VALUES_MAP.NOT_RATED;
        // --- END LOOKUP CHANGE ---
        // console.log(`   -> Rating String (using name "${trimmedCriterion}"): ${ratingString}`); // Keep if needed

        const numericScore = RATING_SCORE_MAP[ratingString] ?? 0;
        // console.log(`   -> Numeric Score: ${numericScore}`); // Keep if needed

        const weightedScore = numericScore * weight;
        const maxPossibleWeightedScoreForItem = MAX_SCORE_PER_ITEM * weight;
        totalWeightedScore += weightedScore;
        totalMaxPossibleWeightedScore += maxPossibleWeightedScoreForItem;

        let met = false;
        if (isMustHave) {
            mustHaveCriteriaCount++;
            if (numericScore >= MUST_HAVE_MET_THRESHOLD_SCORE) { mustHaveCriteriaMetCount++; met = true; }
        } else { met = numericScore > RATING_SCORE_MAP[RATING_VALUES_MAP.NOT_RATED]; }

        calculationDetails.push({ criterionId: trimmedCriterion, criterion: trimmedCriterion, importance, ratingValue: ratingString, numericScore, maxPoints: MAX_SCORE_PER_ITEM, isMustHave, met });
    });

    console.log(`[Calculator] Final Scores - TotalWeighted: ${totalWeightedScore}, TotalMaxPossible: ${totalMaxPossibleWeightedScore}`); // Keep log
    const matchPercentage = totalMaxPossibleWeightedScore === 0 ? 100 : (totalWeightedScore / totalMaxPossibleWeightedScore) * 100;
    const allMustHavesMet = mustHaveCriteriaCount === 0 || mustHaveCriteriaMetCount === mustHaveCriteriaCount;
    const finalPercentageClamped = Math.max(0, Math.min(100, matchPercentage));
    console.log(`[Calculator] Final Percentage: ${finalPercentageClamped}, MustHavesMet: ${allMustHavesMet}`); // Keep log

    return { matchPercentage: finalPercentageClamped, mustHaveMet: allMustHavesMet, details: calculationDetails };
  },
};
export default CalculatorService;