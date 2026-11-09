import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [message, setMessage] = useState('Confirming your email…');

  useEffect(() => {
    let active = true;
    const finish = async () => {
      if (params.error) {
        const reason = params.error_description || params.error;
        if (active) setMessage(reason);
        Alert.alert('Email confirmation failed', reason, [{ text: 'OK', onPress: () => router.replace('/') }]);
        return;
      }
      if (!params.code || typeof params.code !== 'string') {
        if (active) setMessage('The confirmation link is missing its sign-in code. Please request a new email and open the link on this phone.');
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!active) return;
      if (error) {
        setMessage(error.message);
        Alert.alert('Unable to confirm email', error.message, [{ text: 'OK', onPress: () => router.replace('/') }]);
      } else {
        setMessage('Email confirmed. Opening Celebrity’s Chat…');
        router.replace('/(tabs)');
      }
    };
    finish();
    return () => { active = false; };
  }, [params.code, params.error, params.error_description]);

  return <View style={styles.page}><ActivityIndicator size="large" color="#0B1F3A" /><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#F4F7FB' },
  text: { marginTop: 18, textAlign: 'center', color: '#0B1F3A', fontSize: 16 }
});
