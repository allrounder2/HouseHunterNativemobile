// File: App.js
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import Firebase auth and the listener function
// Make sure the path to firebase.js is correct
import { auth } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Import BOTH navigators (adjust paths if needed)
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator'; // Use the renamed navigator

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null); // Stores user ID or similar if logged in

  useEffect(() => {
    console.log('[App.js] Setting up Firebase Auth listener...');
    // This listener fires when the component mounts and whenever login/logout happens
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in.
        console.log('[App.js] Auth State Changed: User Found ->', user.uid);
        setUserToken(user.uid); // Set token to trigger switch to MainNavigator
      } else {
        // User is signed out.
        console.log('[App.js] Auth State Changed: No User');
        setUserToken(null); // Clear token to trigger switch to AuthNavigator
      }
      // We've finished the initial check, hide loading indicator
      if (isLoading) {
          setIsLoading(false);
      }
    });

    // Cleanup function: unsubscribe from the listener when App component unmounts
    return () => {
        console.log('[App.js] Cleaning up Firebase Auth listener.');
        unsubscribe();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Display a loading screen while Firebase checks the initial auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Render the correct navigator based on whether a user is logged in
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {/* If userToken exists (not null), show main app, otherwise show login/signup */}
      {userToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Basic styles for the loading screen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Optional: background color for loading screen
  },
});