// File: src/screens/SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../services/firebase'; // Adjust path if needed
import { createUserWithEmailAndPassword } from 'firebase/auth';

function SignupScreen({ navigation }) { // Keep navigation prop for potential back navigation if needed
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Input Required', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Firebase sign-up
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('Signup Successful');

      // --- MODIFIED ALERT ---
      // Alert the user, but don't navigate manually.
      // The App.js listener will handle navigating to the main app.
      Alert.alert(
        'Account Created!',
        'You will now be logged in automatically.',
        // Optional: Add an OK button if you want the user to acknowledge
        // [{ text: 'OK' }]
      );
      // --- END MODIFICATION ---


      // --- REMOVED NAVIGATION CALL ---
      // navigation.navigate('Login'); // <<<--- REMOVE THIS LINE
      // --- END REMOVAL ---


      // Clear fields only after success (optional, screen might unmount quickly)
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Note: setLoading(false) is in 'finally' block

    } catch (error) {
      console.error('Signup Error:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'This email address is already registered.';
      } else if (error.code === 'auth/weak-password') {
          errorMessage = 'The password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
           errorMessage = 'Please enter a valid email address.';
      } else {
          errorMessage = error.message;
      }
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      // Ensure loading stops regardless of success or specific errors handled above
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
       <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoComplete="new-password"
      />
       <View style={styles.buttonContainer}>
        <Button title={loading ? 'Creating Account...' : 'Sign Up'} onPress={handleSignup} disabled={loading} />
      </View>
      {/* Keep this button in case user wants to manually go back */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchButton}>
        <Text style={styles.switchButtonText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Styles (Keep existing styles) ---
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#f4f6f8' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
    input: { height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8, fontSize: 16 },
    buttonContainer: { marginTop: 10, marginBottom: 20 },
    switchButton: { marginTop: 15, alignItems: 'center' },
    switchButtonText: { color: '#007bff', fontSize: 15 },
});

export default SignupScreen;