import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

type Profile={id:string;display_name:string;username:string;is_verified:boolean};
type Message={id:string;sender_id:string;recipient_id:string;body:string;created_at:string;read_at:string|null};

export default function ChatScreen(){
 const {userId}=useLocalSearchParams<{userId:string}>();
 const {session}=useAuth(); const router=useRouter(); const uid=session?.user.id;
 const [person,setPerson]=useState<Profile|null>(null); const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState(''); const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false);
 const list=useRef<FlatList<Message>>(null);
 const load=useCallback(async()=>{
  if(!uid||!userId)return;
  const [p,m]=await Promise.all([
   supabase.from('profiles').select('id,display_name,username,is_verified').eq('id',userId).maybeSingle(),
   supabase.from('messages').select('id,sender_id,recipient_id,body,created_at,read_at').or(`and(sender_id.eq.${uid},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${uid})`).order('created_at',{ascending:true}).limit(500)
  ]);
  if(p.data)setPerson(p.data as Profile);
  if(m.data){setMessages(m.data as Message[]);const unread=m.data.filter((x:Message)=>x.recipient_id===uid&&!x.read_at).map((x:Message)=>x.id);if(unread.length)await supabase.from('messages').update({read_at:new Date().toISOString()}).in('id',unread);}
  setLoading(false);
 },[uid,userId]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{
  if(!uid||!userId)return;
  const channel=supabase.channel('conversation-'+[uid,userId].sort().join('-'))
   .on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>load()).subscribe();
  return()=>{supabase.removeChannel(channel);};
 },[uid,userId,load]);
 const send=async()=>{
  const body=draft.trim();if(!body||!uid||!userId||sending)return;
  setSending(true);
  const {error}=await supabase.from('messages').insert({sender_id:uid,recipient_id:userId,body});
  if(error){setSending(false);return;}
  setDraft('');await load();setSending(false);
 };
 return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={Platform.OS==='ios'?85:0}>
  <Stack.Screen options={{headerShown:false}}/>
  <View style={s.header}><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={22} color="#142238"/></Pressable><View style={s.avatar}><Text style={s.avatarText}>{(person?.display_name||'?').slice(0,1).toUpperCase()}</Text></View><View style={{flex:1,marginLeft:11}}><View style={{flexDirection:'row',alignItems:'center',gap:5}}><Text style={s.personName}>{person?.display_name||'Conversation'}</Text>{person?.is_verified?<Ionicons name="checkmark-circle" size={15} color="#0D8B68"/>:null}</View><Text style={s.handle}>@{person?.username||' '}</Text></View></View>
  {loading?<ActivityIndicator color="#0D8B68" style={{flex:1}}/>:<FlatList ref={list} data={messages} keyExtractor={m=>m.id} contentContainerStyle={{padding:17,flexGrow:1,justifyContent:'flex-end'}} onContentSizeChange={()=>list.current?.scrollToEnd({animated:true})} ListEmptyComponent={<View style={s.empty}><Ionicons name="chatbubble-ellipses-outline" size={35} color="#0D8B68"/><Text style={s.emptyTitle}>Start the conversation</Text><Text style={s.emptyText}>Send a friendly message to say hello.</Text></View>} renderItem={({item})=>{const mine=item.sender_id===uid;return <View style={[s.bubble,mine?s.mine:s.theirs]}><Text style={[s.bubbleText,mine?s.mineText:s.theirText]}>{item.body}</Text><Text style={[s.time,mine?{color:'#D5F4E9'}:{color:'#8995A5'}]}>{new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text></View>}}/>}
  <View style={s.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Write a message..." placeholderTextColor="#9AA5B4" multiline style={s.messageInput}/><Pressable onPress={send} disabled={!draft.trim()||sending} style={[s.send,(!draft.trim()||sending)&&{opacity:.45}]}>{sending?<ActivityIndicator color="#fff" size="small"/>:<Ionicons name="send" size={18} color="#fff"/>}</Pressable></View>
 </KeyboardAvoidingView>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F7F9FC'},header:{height:76,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',paddingHorizontal:15,borderBottomWidth:1,borderBottomColor:'#E9EEF4'},
 back:{width:38,height:38,alignItems:'center',justifyContent:'center',marginRight:8},avatar:{width:42,height:42,borderRadius:15,backgroundColor:'#E3F4ED',alignItems:'center',justifyContent:'center'},avatarText:{fontSize:18,fontWeight:'800',color:'#087A5C'},personName:{fontSize:15,fontWeight:'800',color:'#17263C'},handle:{fontSize:11,color:'#8793A5',marginTop:3},
 bubble:{maxWidth:'82%',paddingHorizontal:14,paddingVertical:10,borderRadius:17,marginVertical:5},mine:{alignSelf:'flex-end',backgroundColor:'#087F5B',borderBottomRightRadius:5},theirs:{alignSelf:'flex-start',backgroundColor:'#fff',borderBottomLeftRadius:5,borderWidth:1,borderColor:'#E9EEF4'},bubbleText:{fontSize:14,lineHeight:20},mineText:{color:'#fff'},theirText:{color:'#17263C'},time:{fontSize:9,alignSelf:'flex-end',marginTop:5},
 empty:{alignItems:'center',justifyContent:'center',paddingBottom:50},emptyTitle:{fontSize:17,fontWeight:'800',color:'#17263C',marginTop:12},emptyText:{fontSize:12,color:'#8793A5',marginTop:5},
 composer:{flexDirection:'row',alignItems:'flex-end',padding:12,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E9EEF4',gap:9},messageInput:{flex:1,maxHeight:110,minHeight:43,borderRadius:15,backgroundColor:'#F2F5F8',paddingHorizontal:14,paddingTop:12,paddingBottom:10,fontSize:14,color:'#17263C'},send:{width:44,height:44,borderRadius:15,backgroundColor:'#087F5B',alignItems:'center',justifyContent:'center'}
});