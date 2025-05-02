// File: src/components/Button.js
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';

// onPress: Function to call when pressed
// title: Text displayed on the button
// style: Custom container styles (e.g., { backgroundColor: 'green', marginBottom: 10 })
// textStyle: Custom text styles
// disabled: Boolean to disable the button
// children: Alternative to title for button text
function Button({ onPress, title, style, textStyle, disabled, children }) {

  const combinedButtonStyle = [
    styles.buttonBase,
    style, // External styles can override base
    disabled && styles.buttonDisabled, // Apply disabled style conditionally
  ];
  const combinedTextStyle = [
    styles.textBase,
    textStyle,
    disabled && styles.textDisabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        combinedButtonStyle,
        // Darken slightly when pressed, but only if not disabled
        pressed && !disabled ? styles.buttonPressed : null
      ]}
      disabled={disabled}
      // Accessibility hints
      accessibilityRole="button"
      accessibilityState={disabled ? { disabled: true } : {}}
    >
      {/* Use title prop OR children for the text content */}
      <Text style={combinedTextStyle}>{title || children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    elevation: 3, // Android shadow
    backgroundColor: '#007bff', // Default blue color
     // iOS shadow (optional, but good practice)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonPressed: {
    backgroundColor: '#0056b3', // Darker shade when pressed
    elevation: 1, // Reduce shadow slightly
  },
   buttonDisabled: {
     backgroundColor: '#cccccc', // Grey out when disabled
     elevation: 0,
     shadowOpacity: 0,
   },
  textBase: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600', // Semi-bold often looks good
    letterSpacing: 0.25,
    color: 'white',
  },
   textDisabled: {
       color: '#666666',
   },
});

export default Button;