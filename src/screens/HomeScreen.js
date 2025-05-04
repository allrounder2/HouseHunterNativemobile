// File: src/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native'; // Added Alert

// --- Firebase Imports ---
import { auth } from '../services/firebase'; // Adjust path if needed
import { signOut } from 'firebase/auth';
// -----------------------

// The navigation prop is passed automatically by React Navigation Stack Navigator
function HomeScreen({ navigation }) {

  // --- Logout Handler ---
  const handleLogout = async () => {
      console.log('Attempting logout...');
      try {
          await signOut(auth);
          console.log('Logout successful');
          // Listener in App.js will automatically navigate back to AuthNavigator
      } catch (error) {
          console.error('Logout Error:', error);
          Alert.alert('Logout Failed', error.message || 'Could not log out.');
      }
  };
  // ---------------------

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.lead}>
        Start by creating Wishlists and adding Properties.
      </Text>
      <View style={styles.buttonContainer}>
        {/* Use navigation.navigate('ScreenName') to move */}
        <Button
          title="Go to Wishlists"
          onPress={() => navigation.navigate('Wishlists')}
        />
         <View style={styles.spacer} />
        <Button
          title="Go to Properties"
          onPress={() => navigation.navigate('Properties')}
          color="#6c757d" // Secondary button color
        />
         <View style={styles.spacer} />
         <Button
          title="Go to Comparison"
          onPress={() => navigation.navigate('Comparison')}
          color="#17a2b8" // Info button color
        />
      </View>

      {/* --- Logout Button Added --- */}
      <View style={styles.logoutButtonContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          color="#dc3545" // Danger color for logout
        />
      </View>
      {/* -------------------------- */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff', // White background
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  lead: {
    fontSize: 16,
    color: '#6c757d', // Muted text
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '80%', // Make buttons take up some width
    alignItems: 'stretch', // Make buttons fill the width
  },
  spacer: {
    height: 15, // Add space between buttons
  },
  // --- Style for Logout Button Container ---
  logoutButtonContainer: {
    marginTop: 40, // Add more space above the logout button
    width: '60%', // Make logout button slightly narrower if desired
  }
  // ------------------------------------
});

export default HomeScreen;