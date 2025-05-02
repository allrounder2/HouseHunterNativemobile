// File: src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screen components (Make sure these files exist in ../screens/)
import HomeScreen from '../screens/HomeScreen';
import WishlistsScreen from '../screens/WishlistsScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import SideBySideCompareScreen from '../screens/SideBySideCompareScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import WishlistFormScreen from '../screens/WishlistFormScreen';
import PropertyFormScreen from '../screens/PropertyFormScreen';

// Create the stack navigator instance
const Stack = createStackNavigator();

function AppNavigator() {
  return (
    // Define the navigator and its screens
    <Stack.Navigator
      initialRouteName="Home" // The first screen to show
      screenOptions={{
        // Default options for all screens in this stack
        headerStyle: { backgroundColor: '#f8f9fa' }, // Light header background
        headerTintColor: '#333', // Header text color
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* Define each screen */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '🏠 House Hunter Home' }} // Set screen title
      />
      <Stack.Screen
        name="Wishlists"
        component={WishlistsScreen}
        options={{ title: 'My Wishlists' }}
      />
      <Stack.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{ title: 'Tracked Properties' }}
      />
      <Stack.Screen
        name="Comparison"
        component={ComparisonScreen}
        options={{ title: 'Comparison Overview' }}
      />
      <Stack.Screen
        name="SideBySideCompare"
        component={SideBySideCompareScreen}
        options={{ title: 'Side-by-Side Comparison' }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ title: 'Property Analysis' }}
      />
      <Stack.Screen
        name="WishlistForm"
        component={WishlistFormScreen}
        // Dynamically set title based on whether editing or creating
        options={({ route }) => ({
           title: route.params?.wishlistId ? 'Edit Wishlist' : 'Create New Wishlist'
        })}
      />
      <Stack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        // Dynamically set title based on whether editing or creating
        options={({ route }) => ({
          title: route.params?.propertyId ? 'Edit Property' : 'Add New Property'
        })}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;