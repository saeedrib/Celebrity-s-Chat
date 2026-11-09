import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null; is_verified: boolean };
type Message = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };

export default function Messages() {
  const { session } = useAuth();
  const router = useRouter();
  const [people, setPeople] = useState<Profile[]>([]);
  const [latest, setLatest] = useState<Record<string, Message>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const uid = session?.user.id;
    if (!uid) { setLoading(false); return; }
    const [{ data: profiles }, { data: messages, error }] = await Promise.all([
      supabase.from('profiles').select('id,username,display_name,avatar_url,is_verified').neq('id', uid).order('display_name').limit(100),
      supabase.from('messages').select('id,sender_id,recipient_id,body,created_at').or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order('created_at', { ascending: false }).limit(300)
    ]);
    if (!error && messages) {
      const map: Record<string, Message> = {};
      messages.forEach((m: Message) => {
        const other = m.sender_id === uid ? m.recipient_id : m.sender_id;
        if (!map[other]) map[other] = m;
      });
      setLatest(map);
    }
    setPeople((profiles || []) as Profile[]);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!session?.user.id) return;
    const channel = supabase.channel('inbox-' + session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id, load]);

  const filtered = people.filter(p => (p.display_name + ' ' + p.username).toLowerCase().includes(query.toLowerCase()));
  const ordered = [...filtered].sort((a,b) => (latest[b.id]?.created_at || '').localeCompare(latest[a.id]?.created_at || ''));

  return <View style={s.page}>
    <View style={s.header}><View><Text style={s.eyebrow}>STAY CONNECTED</Text><Text style={s.title}>Messages</Text></View><View style={s.headerIcon}><Ionicons name="chatbubbles" size={23} color="#0D8B68" /></View></View>
    <View style={s.search}><Ionicons name="search" size={18} color="#8793A5"/><TextInput value={query} onChangeText={setQuery} placeholder="Find people by name or username" placeholderTextColor="#94A3B8" style={s.input}/></View>
    <Text style={s.section}>{query ? 'SEARCH RESULTS' : 'PEOPLE & CONVERSATIONS'}</Text>
    {loading ? <ActivityIndicator color="#0D8B68" style={{marginTop:35}}/> : <FlatList data={ordered} keyExtractor={p=>p.id} contentContainerStyle={{paddingBottom:28}} ListEmptyComponent={<Text style={s.empty}>No people found yet. Try another name.</Text>} renderItem={({item})=>{
      const last=latest[item.id];
      return <Pressable style={s.row} onPress={()=>router.push({pathname:'/chat/[userId]',params:{userId:item.id}})}>
        <View style={s.avatar}><Text style={s.avatarText}>{(item.display_name || item.username || '?').slice(0,1).toUpperCase()}</Text></View>
        <View style={s.person}><View style={s.nameLine}><Text style={s.name} numberOfLines={1}>{item.display_name}</Text>{item.is_verified ? <Ionicons name="checkmark-circle" size={15} color="#0D8B68"/> : null}</View><Text style={s.preview} numberOfLines={1}>{last ? (last.sender_id===session?.user.id?'You: ':'')+last.body : '@'+item.username}</Text></View>
        <Ionicons name="chevron-forward" size={18} color="#A4AFBD"/>
      </Pressable>;
    }}/> }
  </View>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F7F9FC',paddingHorizontal:20,paddingTop:22},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
 eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#0D8B68'},title:{fontSize:29,fontWeight:'800',color:'#142238',marginTop:4},
 headerIcon:{width:46,height:46,borderRadius:16,backgroundColor:'#E5F5EF',alignItems:'center',justifyContent:'center'},
 search:{height:50,backgroundColor:'#fff',borderRadius:15,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:9,borderWidth:1,borderColor:'#E8EDF3',marginBottom:24},
 input:{flex:1,color:'#142238',fontSize:14},section:{fontSize:10,fontWeight:'800',letterSpacing:1.2,color:'#8290A3',marginBottom:9},
 row:{backgroundColor:'#fff',borderRadius:17,padding:13,marginBottom:9,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#EEF1F5'},
 avatar:{width:48,height:48,borderRadius:16,backgroundColor:'#E5F5EF',alignItems:'center',justifyContent:'center'},avatarText:{fontSize:19,fontWeight:'800',color:'#087A5C'},
 person:{flex:1,marginLeft:12},nameLine:{flexDirection:'row',alignItems:'center',gap:5},name:{fontSize:15,fontWeight:'700',color:'#17263C',maxWidth:'90%'},preview:{fontSize:12,color:'#8290A3',marginTop:5},
 empty:{textAlign:'center',color:'#8793A5',marginTop:45,fontSize:14}
});