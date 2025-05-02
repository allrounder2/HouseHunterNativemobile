// File: src/components/Dropdown.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons'; // For a dropdown icon

// label: Text label displayed above the dropdown
// options: Array of { label: 'Display Text', value: 'actual_value' }
// onValueChange: Function called when value changes (receives the new value)
// value: The currently selected value
// placeholder: Text shown when nothing is selected (optional)
// ...other props RNPickerSelect accepts (like style, disabled)
function Dropdown({ label, options, onValueChange, value, placeholder, ...props }) {

  const placeholderObject = placeholder
    ? { label: placeholder, value: null, color: '#9EA0A4' }
    : {};

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerContainer}>
       <RNPickerSelect
         placeholder={placeholderObject}
         items={options || []} // Ensure options is an array
         onValueChange={onValueChange}
         style={{
           inputIOS: styles.inputIOS,
           inputAndroid: styles.inputAndroid,
           iconContainer: styles.iconContainer,
           placeholder: styles.placeholder,
         }}
         value={value}
         useNativeAndroidPickerStyle={false} // Use custom styling
         Icon={() => {
           // You can use a custom icon library here
           return <Ionicons name="chevron-down" size={24} color="gray" />;
         }}
         {...props} // Pass any other props down
       />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
     marginBottom: 15, // Spacing below dropdown
  },
  label: {
     fontSize: 14,
     color: '#333',
     marginBottom: 5,
     fontWeight: '500',
  },
   pickerContainer: {
       borderWidth: 1,
       borderColor: '#ccc',
       borderRadius: 6,
       backgroundColor: 'white',
   },
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30, // Ensure text doesn't overlap icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30, // Ensure text doesn't overlap icon
  },
  iconContainer: {
     top: 10, // Adjust position of the dropdown icon
     right: 12,
   },
   placeholder: {
       color: '#9EA0A4',
   }
});

export default Dropdown;