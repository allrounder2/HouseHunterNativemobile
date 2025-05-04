// File: src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../services/firebase'; // Adjust path if needed
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Input Required', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('Login Successful');
      // Auth state listener in App.js handles navigation
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Login Failed', error.message || 'An unknown error occurred.');
      setLoading(false); // Only stop loading on error
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>House Hunter Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email" // Use 'email' for autocomplete
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password" // Use 'password' for autocomplete
      />
      <View style={styles.buttonContainer}>
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.switchButton}>
        <Text style={styles.switchButtonText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#f4f6f8' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, marginBottom: 15, paddingHorizontal: 15, borderRadius: 8, fontSize: 16 },
  buttonContainer: { marginTop: 10, marginBottom: 20 },
  switchButton: { marginTop: 15, alignItems: 'center' },
  switchButtonText: { color: '#007bff', fontSize: 15 },
});

export default LoginScreen;