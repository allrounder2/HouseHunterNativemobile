// File: src/components/Card.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// title: Optional title string for the card
// children: The content to display inside the card
// style: Custom styles to apply to the card container
function Card({ title, children, style }) {
  return (
    // Combine base styles with external styles
    <View style={[styles.cardBase, style]}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {/* Render the content passed into the card */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    // Android Shadow
    elevation: 3,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 1, // Optional subtle border
    borderColor: '#eee'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default Card;