// File: src/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

// The navigation prop is passed automatically by React Navigation Stack Navigator
function HomeScreen({ navigation }) {
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
  },
  spacer: {
    height: 15, // Add space between buttons
  }
});

export default HomeScreen;