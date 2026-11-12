import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '../../src/lib/supabase';
import {useAuth} from '../../src/providers/AuthProvider';
const NAVY='#08244A',GREEN='#079447';
type Withdrawal={id:string;user_id:string;points:number;status:string;created_at:string;payout_details:any;admin_note:string};
type Member={user_id:string;full_name:string;referral_code:string;created_at:string};
export default function AdminDashboard(){
 const {session,loading}=useAuth();const router=useRouter();const [checking,setChecking]=useState(true),[admin,setAdmin]=useState(false),[members,setMembers]=useState<Member[]>([]),[withdrawals,setWithdrawals]=useState<Withdrawal[]>([]),[refCount,setRefCount]=useState(0),[busy,setBusy]=useState('');
 const load=useCallback(async()=>{
  if(!session)return;
  const {data,error}=await supabase.auth.getUser();
  const ok=!error&&data.user?.app_metadata?.role==='admin';setAdmin(ok);setChecking(false);
  if(!ok)return;
  const [m,w,r]=await Promise.all([
   supabase.from('by_click_profiles').select('user_id,full_name,referral_code,created_at').order('created_at',{ascending:false}).limit(100),
   supabase.from('by_click_withdrawals').select('id,user_id,points,status,created_at,payout_details,admin_note').order('created_at',{ascending:false}).limit(100),
   supabase.from('by_click_referrals').select('id',{count:'exact',head:true})
  ]);
  if(m.error)Alert.alert('Members',m.error.message);else setMembers(m.data||[]);
  if(w.error)Alert.alert('Withdrawals',w.error.message);else setWithdrawals(w.data||[]);
  setRefCount(r.count||0);
 },[session]);
 useEffect(()=>{if(!loading&&!session)router.replace('/');else if(session)load();},[loading,session,load]);
 const review=async(w:Withdrawal,approve:boolean)=>{
  const label=approve?'approve':'reject';
  Alert.alert('Confirm action',`Are you sure you want to ${label} this ${w.points.toLocaleString()} point withdrawal?`,[{text:'Cancel',style:'cancel'},{text:'Confirm',onPress:async()=>{
   setBusy(w.id);const {error}=await supabase.rpc('by_click_review_withdrawal',{p_withdrawal_id:w.id,p_approve:approve,p_note:approve?'Approved by admin':'Rejected by admin'});setBusy('');
   if(error)Alert.alert('Action failed',error.message);else{Alert.alert('Updated',`Withdrawal ${approve?'approved':'rejected'}.`);await load();}
  }}]);
 };
 if(loading||checking)return <View style={s.center}><ActivityIndicator color={GREEN}/></View>;
 if(!admin)return <View style={s.center}><Ionicons name="lock-closed" size={40} color={NAVY}/><Text style={s.title}>Admin access only</Text><Text style={s.note}>A project owner must assign the trusted admin role in Supabase Auth app_metadata.</Text><Pressable style={s.button} onPress={()=>router.replace('/dashboard')}><Text style={s.buttonText}>Back to Member Dashboard</Text></Pressable></View>;
 const pending=withdrawals.filter(x=>x.status==='pending');
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={!!busy} onRefresh={load}/>}>
  <View style={s.header}><View><Text style={s.kicker}>BY CLICK CONTROL CENTRE</Text><Text style={s.title}>Admin Dashboard</Text></View><Pressable onPress={()=>router.replace('/dashboard')}><Ionicons name="close-circle-outline" size={28} color={NAVY}/></Pressable></View>
  <View style={s.banner}><Text style={s.bannerTitle}>Secure admin session</Text><Text style={s.bannerText}>Trusted role verified using Supabase app_metadata.</Text></View>
  <View style={s.stats}><View style={s.stat}><Text style={s.number}>{members.length}</Text><Text style={s.label}>Recent members</Text></View><View style={s.stat}><Text style={s.number}>{refCount}</Text><Text style={s.label}>Referrals recorded</Text></View><View style={s.stat}><Text style={s.number}>{pending.length}</Text><Text style={s.label}>Pending withdrawals</Text></View></View>
  <Text style={s.section}>Withdrawal Requests</Text>
  {withdrawals.length?withdrawals.map(w=><View key={w.id} style={s.card}><Text style={s.cardTitle}>{w.points.toLocaleString()} points • {w.status.toUpperCase()}</Text><Text style={s.detail}>Member ID: {w.user_id}</Text><Text style={s.detail}>Account: {w.payout_details?.account_name||'—'} • {w.payout_details?.bank_name||'—'}</Text><Text style={s.detail}>Number: {w.payout_details?.account_number||'—'}</Text><Text style={s.detail}>Requested: {new Date(w.created_at).toLocaleString()}</Text>{w.status==='pending'&&<View style={s.actions}><Pressable disabled={!!busy} style={s.approve} onPress={()=>review(w,true)}><Text style={s.actionText}>{busy===w.id?'Please wait':'Approve'}</Text></Pressable><Pressable disabled={!!busy} style={s.reject} onPress={()=>review(w,false)}><Text style={s.actionText}>Reject</Text></Pressable></View>}</View>):<Text style={s.note}>No withdrawal requests yet.</Text>}
  <Text style={s.section}>Recent Members</Text>
  {members.map(m=><View key={m.user_id} style={s.member}><View style={{flex:1}}><Text style={s.cardTitle}>{m.full_name||'BY CLICK Member'}</Text><Text style={s.detail}>Code: {m.referral_code}</Text><Text style={s.detail}>Joined: {new Date(m.created_at).toLocaleDateString()}</Text></View><Text style={s.detail}>{m.user_id.slice(0,8)}…</Text></View>)}
  <Text style={s.note}>Referral qualification and the 35-referral reward are not automated until the programme defines what counts as a successful referral.</Text>
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F8FA'},content:{padding:18,maxWidth:900,width:'100%',alignSelf:'center',paddingBottom:45},center:{flex:1,alignItems:'center',justifyContent:'center',padding:25,backgroundColor:'#F5F8FA'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:18},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:GREEN},title:{fontSize:29,fontWeight:'900',color:NAVY,marginTop:5},banner:{backgroundColor:NAVY,borderRadius:16,padding:18,marginBottom:14},bannerTitle:{fontSize:16,fontWeight:'900',color:'#fff'},bannerText:{fontSize:12,color:'#D4E0EC',marginTop:5},stats:{flexDirection:'row',gap:9},stat:{flex:1,backgroundColor:'#fff',padding:14,borderRadius:14,borderWidth:1,borderColor:'#E7EDF2'},number:{fontSize:25,fontWeight:'900',color:GREEN},label:{fontSize:10,color:'#64748B',marginTop:4},section:{fontSize:20,fontWeight:'900',color:NAVY,marginTop:25,marginBottom:10},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#E7EDF2',borderRadius:15,padding:15,marginBottom:10},cardTitle:{fontSize:15,fontWeight:'900',color:'#172B45'},detail:{fontSize:11,color:'#64748B',marginTop:5},actions:{flexDirection:'row',gap:10,marginTop:13},approve:{flex:1,backgroundColor:GREEN,padding:12,borderRadius:10,alignItems:'center'},reject:{flex:1,backgroundColor:'#B42318',padding:12,borderRadius:10,alignItems:'center'},actionText:{color:'#fff',fontWeight:'900'},member:{backgroundColor:'#fff',borderRadius:13,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#E7EDF2'},note:{fontSize:12,color:'#64748B',lineHeight:19,marginTop:10},button:{backgroundColor:NAVY,padding:14,borderRadius:11,marginTop:18},buttonText:{color:'#fff',fontWeight:'800'}});
