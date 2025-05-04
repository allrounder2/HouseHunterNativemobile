// File: src/components/Dropdown.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

// label: Text label displayed above the dropdown
// options: Array of { label: 'Display Text', value: 'actual_value' }
// onValueChange: Function called when value changes (receives the new value)
// value: The currently selected value
// --- REMOVED placeholder prop from here, handle it in the options array ---
function Dropdown({ label, options, onValueChange, value, ...props }) {

  // --- REMOVED placeholderObject logic ---
  // const placeholderObject = placeholder
  //   ? { label: placeholder, value: null, color: '#9EA0A4' }
  //   : {};
  // --- ------------------------------- ---

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerContainer}>
       <RNPickerSelect
         // --- REMOVED placeholder prop ---
         // placeholder={placeholderObject}
         // --- ------------------------ ---
         items={options || []} // Ensure options is an array
         onValueChange={onValueChange}
         style={{
           inputIOS: styles.inputIOS,
           inputAndroid: styles.inputAndroid,
           iconContainer: styles.iconContainer,
           // placeholder style might not be needed if not using the prop
           // placeholder: styles.placeholder,
         }}
         value={value}
         useNativeAndroidPickerStyle={false}
         Icon={() => <Ionicons name="chevron-down" size={24} color="gray" />}
         {...props}
       />
      </View>
    </View>
  );
}

// --- Styles (Keep existing styles) ---
const styles = StyleSheet.create({
  container: { marginBottom: 15, },
  label: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '500', },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: 'white', },
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, color: 'black', paddingRight: 30, },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, color: 'black', paddingRight: 30, },
  iconContainer: { top: 10, right: 12, },
  // placeholder: { color: '#9EA0A4', } // Style might be irrelevant now
});

export default Dropdown;