// File: src/constants/appConstants.js

// Storage Keys
export const ASYNC_STORAGE_WISHLIST_KEY = '@HouseHunter:wishlists';
export const ASYNC_STORAGE_PROPERTY_KEY = '@HouseHunter:properties';

// Comparison Limit
export const MAX_COMPARE_ITEMS = 3;

// --- Wishlist Related ---
export const IMPORTANCE_LEVELS_MAP = {
    MUST_HAVE: 'mustHave', VERY_IMPORTANT: 'veryImportant', IMPORTANT: 'important',
    NICE_TO_HAVE: 'niceToHave', OPTIONAL: 'optional',
};
// Ensure values here match keys in IMPORTANCE_LEVELS_MAP and importanceColors
export const IMPORTANCE_LEVELS_ARRAY = [
    { label: 'Must Have', value: IMPORTANCE_LEVELS_MAP.MUST_HAVE },
    { label: 'Very Important', value: IMPORTANCE_LEVELS_MAP.VERY_IMPORTANT },
    { label: 'Important', value: IMPORTANCE_LEVELS_MAP.IMPORTANT },
    { label: 'Nice to Have', value: IMPORTANCE_LEVELS_MAP.NICE_TO_HAVE },
    { label: 'Optional', value: IMPORTANCE_LEVELS_MAP.OPTIONAL },
];

// --- Property Rating Related ---
export const RATING_VALUES_MAP = {
    NOT_RATED: 'not_rated', VERY_POOR: 'very_poor', POOR: 'poor', AVERAGE: 'average', GOOD: 'good', EXCELLENT: 'excellent',
};
export const RATING_OPTIONS_ARRAY = [ // For PropertyForm rating dropdown
    // Ensure first value is not null
    { label: 'Not Rated', value: RATING_VALUES_MAP.NOT_RATED }, // 'not_rated' is OK
    { label: 'Very Poor', value: RATING_VALUES_MAP.VERY_POOR },
    { label: 'Poor', value: RATING_VALUES_MAP.POOR },
    { label: 'Average', value: RATING_VALUES_MAP.AVERAGE },
    { label: 'Good', value: RATING_VALUES_MAP.GOOD },
    { label: 'Excellent', value: RATING_VALUES_MAP.EXCELLENT },
];
// Map Rating Values to Numeric Scores (0-5)
export const RATING_SCORE_MAP = {
    [RATING_VALUES_MAP.NOT_RATED]: 0, [RATING_VALUES_MAP.VERY_POOR]: 1, [RATING_VALUES_MAP.POOR]: 2,
    [RATING_VALUES_MAP.AVERAGE]: 3, [RATING_VALUES_MAP.GOOD]: 4, [RATING_VALUES_MAP.EXCELLENT]: 5,
};
// Maximum possible numeric score per item used in calculations
export const MAX_SCORE_PER_ITEM = 5;


// --- Property Form Related Dropdowns etc. (CORRECTED VERSION) ---
export const PROPERTY_STATUS_OPTIONS = [
    { label: 'Select Status...', value: "" }, // CHANGED value to ""
    { label: 'Researching', value: 'researching' },
    { label: 'Viewing Scheduled', value: 'viewingScheduled' },
    { label: 'Visited - Interested', value: 'visitedInterested' },
    { label: 'Visited - Not Interested', value: 'visitedNotInterested' },
    { label: 'Offer Made', value: 'offerMade' },
    { label: 'Under Contract', value: 'underContract' },
    { label: 'Rejected / Lost', value: 'rejectedLost' },
    { label: 'Archived', value: 'archived' }
];
export const BEDROOM_OPTIONS = [
    { label: 'Any Bedrooms', value: "" }, // CHANGED value to "" and label slightly
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6+', value: 6 }
];
export const BATHROOM_OPTIONS = [
    { label: 'Any Bathrooms', value: "" }, // CHANGED value to "" and label slightly
    { label: '1', value: 1 },
    { label: '1.5', value: 1.5 },
    { label: '2', value: 2 },
    { label: '2.5', value: 2.5 },
    { label: '3', value: 3 },
    { label: '3.5', value: 3.5 },
    { label: '4+', value: 4 }
];
export const GARAGE_OPTIONS = [
    { label: 'Any Garage Size', value: "" }, // CHANGED value to "" and label slightly
    { label: 'None', value: 0 },
    { label: '1 Car', value: 1 },
    { label: '2 Cars', value: 2 },
    { label: '3+ Cars', value: 3 }
];
// --- END CORRECTIONS ---

export const CHECKLIST_FEATURES = [ 'Fresh Paint Job', 'Hardwood Floors', 'Updated Kitchen', 'Updated Bathrooms', 'Good Natural Light', 'New/Recent HVAC', 'Double Pane Windows', 'Good Curb Appeal', 'Fenced Yard', 'Finished Basement'];

// --- Add Other Constants as needed ---