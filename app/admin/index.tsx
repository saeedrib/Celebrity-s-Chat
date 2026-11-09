import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Alert,FlatList,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../src/lib/supabase';
import {useAuth} from '../../src/providers/AuthProvider';
type Report={id:string;reporter_id:string;target_user_id:string|null;post_id:string|null;reason:string;status:'open'|'reviewing'|'resolved'|'dismissed';created_at:string};
export default function AdminDashboard(){
 const {session}=useAuth();const router=useRouter();const [stats,setStats]=useState({users:0,posts:0,openReports:0,pendingVerification:0});const [reports,setReports]=useState<Report[]>([]);const [admin,setAdmin]=useState(false);const [busy,setBusy]=useState(true);const [refreshing,setRefreshing]=useState(false);const [acting,setActing]=useState<string|null>(null);
 const load=useCallback(async()=>{
  if(!session){setBusy(false);return;}
  const {data:me,error:meError}=await supabase.from('profiles').select('role').eq('id',session.user.id).single();
  if(meError||me?.role!=='admin'){setAdmin(false);setBusy(false);setRefreshing(false);return;}
  setAdmin(true);
  const [u,p,r,v,list]=await Promise.all([
   supabase.from('profiles').select('id',{count:'exact',head:true}),
   supabase.from('posts').select('id',{count:'exact',head:true}),
   supabase.from('reports').select('id',{count:'exact',head:true}).in('status',['open','reviewing']),
   supabase.from('verification_requests').select('id',{count:'exact',head:true}).eq('status','pending'),
   supabase.from('reports').select('id,reporter_id,target_user_id,post_id,reason,status,created_at').in('status',['open','reviewing']).order('created_at',{ascending:true}).limit(50)
  ]);
  if(list.error)Alert.alert('Reports unavailable',list.error.message);
  setStats({users:u.count||0,posts:p.count||0,openReports:r.count||0,pendingVerification:v.count||0});
  setReports((list.data||[]) as Report[]);setBusy(false);setRefreshing(false);
 },[session]);
 useEffect(()=>{load();},[load]);
 const review=async(row:Report,status:'reviewing'|'resolved'|'dismissed')=>{
  if(!session)return;setActing(row.id);
  const {error}=await supabase.from('reports').update({status,reviewed_by:session.user.id}).eq('id',row.id);
  setActing(null);if(error)Alert.alert('Could not update report',error.message);else{setReports(old=>old.filter(x=>x.id!==row.id));setStats(old=>({...old,openReports:Math.max(0,old.openReports-1)}));}
 };
 if(busy)return <View style={s.center}><ActivityIndicator color="#0D8B68"/></View>;
 if(!admin)return <View style={s.center}><Ionicons name="lock-closed" size={38} color="#64748B"/><Text style={s.denied}>Admin access only</Text><Text style={s.hint}>This account does not have administrator permissions.</Text><Pressable style={s.back} onPress={()=>router.back()}><Text style={s.backText}>Go back</Text></Pressable></View>;
 return <ScrollView style={s.page} contentContainerStyle={{padding:18,paddingBottom:40}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}}/>}>
  <View style={s.header}><View><Text style={s.eyebrow}>CELEBRITY'S CHAT</Text><Text style={s.title}>Admin dashboard</Text></View><Pressable onPress={()=>router.back()}><Ionicons name="close-circle-outline" size={27} color="#64748B"/></Pressable></View>
  <View style={s.grid}><Stat label="Members" value={stats.users} icon="people-outline"/><Stat label="Posts" value={stats.posts} icon="newspaper-outline"/><Stat label="Open reports" value={stats.openReports} icon="flag-outline"/><Stat label="Pending badges" value={stats.pendingVerification} icon="checkmark-circle-outline"/></View>
  <Pressable style={s.verify} onPress={()=>router.push('/admin/verification')}><Ionicons name="shield-checkmark-outline" size={21} color="#fff"/><Text style={s.verifyText}>Review verified badge applications ({stats.pendingVerification})</Text><Ionicons name="chevron-forward" size={19} color="#fff"/></Pressable>
  <View style={s.sectionHead}><Text style={s.section}>COMMUNITY REPORTS</Text><Pressable onPress={()=>{setRefreshing(true);load();}}><Ionicons name="refresh" size={20} color="#0D8B68"/></Pressable></View>
  <FlatList scrollEnabled={false} data={reports} keyExtractor={x=>x.id} ListEmptyComponent={<Text style={s.empty}>No open reports. The community is all clear.</Text>} renderItem={({item})=><View style={s.report}><View style={s.reportTop}><Text style={s.reportType}>{item.target_user_id?'Account report':'Post report'}</Text><Text style={s.reportDate}>{new Date(item.created_at).toLocaleDateString()}</Text></View><Text style={s.reason}>{item.reason}</Text><Text style={s.meta}>Report ID: {item.id.slice(0,8)} · {item.status.toUpperCase()}</Text><View style={s.actions}><Pressable disabled={acting===item.id} onPress={()=>review(item,'reviewing')} style={[s.action,s.review]}><Text style={s.actionText}>Reviewing</Text></Pressable><Pressable disabled={acting===item.id} onPress={()=>review(item,'dismissed')} style={[s.action,s.dismiss]}><Text style={s.actionText}>Dismiss</Text></Pressable><Pressable disabled={acting===item.id} onPress={()=>review(item,'resolved')} style={[s.action,s.resolve]}>{acting===item.id?<ActivityIndicator color="#fff"/>:<Text style={s.actionText}>Resolve</Text>}</Pressable></View></View>}/>
 </ScrollView>;
}
function Stat({label,value,icon}:{label:string;value:number;icon:any}){return <View style={s.stat}><Ionicons name={icon} size={22} color="#0D8B68"/><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F7FB'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#F4F7FB'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20,marginTop:8},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#0D8B68'},title:{fontSize:27,fontWeight:'900',color:'#0B1F3A',marginTop:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',backgroundColor:'#fff',borderRadius:15,padding:15,borderWidth:1,borderColor:'#E8EDF3'},statValue:{fontSize:25,fontWeight:'900',color:'#17263C',marginTop:10},statLabel:{fontSize:12,color:'#64748B',marginTop:2},verify:{marginTop:16,backgroundColor:'#0B1F3A',borderRadius:13,padding:15,flexDirection:'row',alignItems:'center',gap:9},verifyText:{flex:1,color:'#fff',fontWeight:'700',fontSize:12},sectionHead:{marginTop:25,marginBottom:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},section:{fontSize:11,fontWeight:'900',letterSpacing:1.2,color:'#64748B'},report:{backgroundColor:'#fff',padding:15,borderRadius:14,marginBottom:10},reportTop:{flexDirection:'row',justifyContent:'space-between'},reportType:{fontWeight:'800',color:'#17263C'},reportDate:{fontSize:11,color:'#94A3B8'},reason:{fontSize:14,color:'#334155',marginTop:10},meta:{fontSize:10,color:'#94A3B8',marginTop:8},actions:{flexDirection:'row',gap:7,marginTop:13},action:{flex:1,borderRadius:8,paddingVertical:9,alignItems:'center'},review:{backgroundColor:'#2563EB'},dismiss:{backgroundColor:'#64748B'},resolve:{backgroundColor:'#0D8B68'},actionText:{fontSize:10,color:'#fff',fontWeight:'800'},empty:{textAlign:'center',color:'#94A3B8',padding:28,backgroundColor:'#fff',borderRadius:12},denied:{fontSize:20,fontWeight:'800',color:'#17263C',marginTop:12},hint:{color:'#64748B',textAlign:'center',marginTop:8},back:{backgroundColor:'#0B1F3A',paddingHorizontal:25,paddingVertical:12,borderRadius:10,marginTop:18},backText:{color:'#fff',fontWeight:'700'}});
