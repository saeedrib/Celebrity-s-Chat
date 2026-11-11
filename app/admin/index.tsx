import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../src/lib/supabase';
import {useAuth} from '../../src/providers/AuthProvider';

const NAVY='#08244A',GREEN='#079447';
export default function AdminDashboard(){
 const {session,loading}=useAuth();const router=useRouter();const [checking,setChecking]=useState(true);const [isAdmin,setIsAdmin]=useState(false);
 const verify=useCallback(async()=>{
  if(!session){setIsAdmin(false);setChecking(false);return;}
  // Admin privileges must come from trusted app_metadata, never user-editable user_metadata.
  const {data,error}=await supabase.auth.getUser();
  setIsAdmin(!error && data.user?.app_metadata?.role==='admin');setChecking(false);
 },[session]);
 useEffect(()=>{verify();},[verify]);
 if(loading||checking)return <View style={s.center}><ActivityIndicator color={GREEN}/></View>;
 if(!isAdmin)return <View style={s.center}><Ionicons name="lock-closed" size={42} color={NAVY}/><Text style={s.title}>Admin access only</Text><Text style={s.note}>This page is restricted. Administrator permission must be assigned securely by the project owner.</Text><Pressable style={s.button} onPress={()=>router.replace('/dashboard')}><Text style={s.buttonText}>Back to User Dashboard</Text></Pressable></View>;
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={checking} onRefresh={()=>{setChecking(true);verify();}}/>}>
  <View style={s.header}><View><Text style={s.kicker}>BY CLICK CONTROL CENTRE</Text><Text style={s.title}>Admin Dashboard</Text></View><Pressable onPress={()=>router.replace('/dashboard')}><Ionicons name="close-circle-outline" size={28} color={NAVY}/></Pressable></View>
  <View style={s.banner}><Ionicons name="shield-checkmark" size={25} color="#C9F0D5"/><View style={{flex:1}}><Text style={s.bannerTitle}>Administrator session verified</Text><Text style={s.bannerText}>You are signed in with a trusted administrator role.</Text></View></View>
  {[
   ['people-outline','Manage Users','Review member accounts and account status'],
   ['git-network-outline','Referrals','Review referral activity and qualification'],
   ['wallet-outline','Points & Transactions','Audit points ledger and reward adjustments'],
   ['cash-outline','Withdrawal Requests','Review, approve or reject withdrawal requests'],
   ['alert-circle-outline','Risk & Activity Review','Investigate suspicious activity and protect members'],
  ].map(([icon,title,detail])=><View key={title} style={s.card}><View style={s.icon}><Ionicons name={icon as any} size={23} color={GREEN}/></View><View style={{flex:1}}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardText}>{detail}</Text></View><Text style={s.pending}>Not connected</Text></View>)}
  <View style={s.notice}><Text style={s.noticeTitle}>Database connection pending</Text><Text style={s.noticeText}>These management controls will be enabled after the isolated BY CLICK database and its access policies are configured. No live user records or withdrawal requests are being changed from this screen.</Text></View>
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F8FA'},content:{padding:20,maxWidth:1000,width:'100%',alignSelf:'center',paddingBottom:40},center:{flex:1,backgroundColor:'#F5F8FA',alignItems:'center',justifyContent:'center',padding:28},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:18},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:GREEN},title:{fontSize:29,fontWeight:'900',color:NAVY,marginTop:5},note:{fontSize:14,color:'#64748B',textAlign:'center',lineHeight:22,marginTop:10,maxWidth:420},button:{marginTop:20,backgroundColor:NAVY,borderRadius:12,paddingHorizontal:20,paddingVertical:13},buttonText:{color:'#fff',fontWeight:'800'},banner:{backgroundColor:NAVY,borderRadius:16,padding:17,flexDirection:'row',alignItems:'center',gap:12,marginBottom:18},bannerTitle:{fontSize:15,fontWeight:'900',color:'#fff'},bannerText:{fontSize:12,color:'#D4E0EC',marginTop:4},card:{backgroundColor:'#fff',borderRadius:15,borderWidth:1,borderColor:'#E7EDF2',padding:15,marginBottom:10,flexDirection:'row',alignItems:'center',gap:12},icon:{width:44,height:44,borderRadius:13,backgroundColor:'#EAF7EF',alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:15,fontWeight:'900',color:'#172B45'},cardText:{fontSize:12,color:'#718096',marginTop:4,lineHeight:18},pending:{fontSize:9,fontWeight:'800',color:'#7A8795',backgroundColor:'#F1F4F6',paddingHorizontal:8,paddingVertical:6,borderRadius:9},notice:{marginTop:12,backgroundColor:'#FFF7E8',borderColor:'#F4DFB6',borderWidth:1,borderRadius:14,padding:16},noticeTitle:{fontSize:14,fontWeight:'900',color:'#765017'},noticeText:{fontSize:12,color:'#765F39',lineHeight:19,marginTop:5}});
