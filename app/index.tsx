import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';

export default function Welcome() {
 const { session, loading } = useAuth(); const [mode,setMode] = useState<'login'|'signup'>('signup');
 const [name,setName] = useState(''); const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [busy,setBusy] = useState(false);
 if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0B1F3A" /></View>;
 if (session) return <Redirect href="/(tabs)" />;
 const submit = async () => {
  if (!isSupabaseConfigured) return Alert.alert('Setup required','Add your Supabase URL and publishable key to the .env file first.');
  if (!email.trim() || password.length < 8 || (mode==='signup' && !name.trim())) return Alert.alert('Check your details','Enter your name, a valid email and a password of at least 8 characters.');
  setBusy(true);
  const result = mode==='signup' ? await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim()}}}) : await supabase.auth.signInWithPassword({email:email.trim(),password});
  setBusy(false);
  if (result.error) Alert.alert('Unable to continue',result.error.message); else if(mode==='signup' && !result.data.session) Alert.alert('Check your email','Open the confirmation email to activate your account, then sign in.');
 };
 return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.brand}><View style={s.logo}><Text style={s.logoText}>C</Text></View><Text style={s.title}>Celebrity's Chat</Text><Text style={s.subtitle}>Connect • Share • Chat • Discover</Text></View><View style={s.card}><Text style={s.heading}>{mode==='signup'?'Join the conversation':'Welcome back'}</Text><Text style={s.helper}>A place to connect with people around the world.</Text>{mode==='signup'&&<TextInput placeholder="Your full name" value={name} onChangeText={setName} style={s.input} /> }<TextInput placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={s.input}/><TextInput placeholder="Password (8 characters minimum)" value={password} onChangeText={setPassword} secureTextEntry style={s.input}/><Pressable style={s.button} onPress={submit} disabled={busy}>{busy?<ActivityIndicator color="white"/>:<Text style={s.buttonText}>{mode==='signup'?'Create account':'Sign in'}</Text>}</Pressable><Pressable onPress={()=>setMode(mode==='signup'?'login':'signup')}><Text style={s.switch}>{mode==='signup'?'Already have an account? Sign in':'New here? Create an account'}</Text></Pressable></View><Text style={s.foot}>Be kind. Stay safe. Build real connections.</Text></KeyboardAvoidingView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F7FB',justifyContent:'center',padding:24},center:{flex:1,alignItems:'center',justifyContent:'center'},brand:{alignItems:'center',marginBottom:28},logo:{width:58,height:58,borderRadius:19,backgroundColor:'#0B1F3A',alignItems:'center',justifyContent:'center'},logoText:{color:'#fff',fontSize:32,fontWeight:'800'},title:{fontSize:27,fontWeight:'800',color:'#0B1F3A',marginTop:12},subtitle:{color:'#64748B',marginTop:6},card:{backgroundColor:'#fff',borderRadius:22,padding:22,shadowColor:'#0B1F3A',shadowOpacity:.08,shadowRadius:20,elevation:4},heading:{fontSize:22,fontWeight:'800',color:'#14243A'},helper:{color:'#64748B',marginTop:6,marginBottom:18},input:{height:52,borderWidth:1,borderColor:'#E2E8F0',borderRadius:12,paddingHorizontal:14,marginBottom:12,color:'#0F172A'},button:{height:52,backgroundColor:'#0B1F3A',borderRadius:13,alignItems:'center',justifyContent:'center',marginTop:4},buttonText:{color:'#fff',fontWeight:'700',fontSize:16},switch:{textAlign:'center',color:'#0D8B68',fontWeight:'700',marginTop:18},foot:{textAlign:'center',color:'#94A3B8',marginTop:22,fontSize:12}});
