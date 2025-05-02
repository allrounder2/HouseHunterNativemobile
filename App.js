// File: App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator'; // Import the navigator

export default function App() {
  return (
    // Wrap the entire app in NavigationContainer
    <NavigationContainer>
      <StatusBar style="auto" />
      {/* Render the navigator component which defines all screens */}
      <AppNavigator />
    </NavigationContainer>
  );
}