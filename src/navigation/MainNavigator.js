// File: src/navigation/MainNavigator.js (Previously AppNavigator.js)
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screen components (Make sure paths are correct)
import HomeScreen from '../screens/HomeScreen';
import WishlistsScreen from '../screens/WishlistsScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import SideBySideCompareScreen from '../screens/SideBySideCompareScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import WishlistFormScreen from '../screens/WishlistFormScreen';
import PropertyFormScreen from '../screens/PropertyFormScreen';

const Stack = createStackNavigator();

// --- RENAME FUNCTION ---
function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#f8f9fa' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '🏠 House Hunter Home' }} />
      <Stack.Screen name="Wishlists" component={WishlistsScreen} options={{ title: 'My Wishlists' }} />
      <Stack.Screen name="Properties" component={PropertiesScreen} options={{ title: 'Tracked Properties' }} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Comparison Overview' }} />
      <Stack.Screen name="SideBySideCompare" component={SideBySideCompareScreen} options={{ title: 'Side-by-Side Comparison' }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property Analysis' }} />
      <Stack.Screen name="WishlistForm" component={WishlistFormScreen} options={({ route }) => ({ title: route.params?.wishlistId ? 'Edit Wishlist' : 'Create New Wishlist' })} />
      <Stack.Screen name="PropertyForm" component={PropertyFormScreen} options={({ route }) => ({ title: route.params?.propertyId ? 'Edit Property' : 'Add New Property' })} />
      {/* Add other main app screens here */}
    </Stack.Navigator>
  );
}
// --- RENAME EXPORT ---
export default MainNavigator;