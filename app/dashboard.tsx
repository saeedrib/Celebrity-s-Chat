import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,Share,StyleSheet,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {supabase,isSupabaseConfigured} from '../src/lib/supabase';
import {useAuth} from '../src/providers/AuthProvider';

const NAVY='#08244A',GREEN='#079447',MUTED='#64748B';
type Profile={full_name:string;referral_code:string};
type Ledger={id:string;points:number;entry_type:string;note:string;created_at:string};
type Referral={id:string;status:string;created_at:string};
type Withdrawal={id:string;points:number;status:string;admin_note:string;created_at:string};
export default function UserDashboard(){
 const {session,loading}=useAuth();const router=useRouter();
 const [profile,setProfile]=useState<Profile|null>(null),[ledger,setLedger]=useState<Ledger[]>([]),[referrals,setReferrals]=useState<Referral[]>([]),[withdrawals,setWithdrawals]=useState<Withdrawal[]>([]);
 const [busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false),[tapBusy,setTapBusy]=useState(false),[withdrawPoints,setWithdrawPoints]=useState('5000'),[accountName,setAccountName]=useState(''),[bankName,setBankName]=useState(''),[accountNumber,setAccountNumber]=useState('');
 const notify=(title:string,msg:string)=>Alert.alert(title,msg);
 const load=useCallback(async()=>{
  if(!session)return;
  const uid=session.user.id;
  const [p,l,r,w]=await Promise.all([
   supabase.from('by_click_profiles').select('full_name,referral_code').eq('user_id',uid).single(),
   supabase.from('by_click_ledger').select('id,points,entry_type,note,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(30),
   supabase.from('by_click_referrals').select('id,status,created_at').eq('inviter_id',uid).order('created_at',{ascending:false}).limit(100),
   supabase.from('by_click_withdrawals').select('id,points,status,admin_note,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(20)
  ]);
  if(p.error)notify('Profile error',p.error.message);else setProfile(p.data);
  if(l.error)notify('Wallet error',l.error.message);else setLedger(l.data||[]);
  if(!r.error)setReferrals(r.data||[]);
  if(!w.error)setWithdrawals(w.data||[]);
 },[session]);
 useEffect(()=>{if(!loading&&!session)router.replace('/');else if(session)load();},[loading,session,load]);
 const balance=ledger.reduce((sum,x)=>sum+x.points,0);
 const today=new Date();today.setHours(0,0,0,0);
 const todayTap=ledger.filter(x=>x.entry_type==='tap'&&new Date(x.created_at)>=today).reduce((sum,x)=>sum+x.points,0);
 const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false);};
 const tap=async()=>{setTapBusy(true);const {data,error}=await supabase.rpc('by_click_tap');setTapBusy(false);if(error)notify('Tap & Earn',error.message);else{notify('Points added','You earned 2 points.');await load();}};
 const copyInvite=async()=>{const code=profile?.referral_code||'';if(!code)return;try{await Share.share({message:'Join BY CLICK using my referral code: '+code});}catch{}};
 const withdraw=async()=>{
  const pts=Number(withdrawPoints);
  if(!Number.isInteger(pts)||pts<5000)return notify('Invalid amount','Minimum withdrawal is 5,000 points.');
  if(!accountName.trim()||!bankName.trim()||!/^\\d{10}$/.test(accountNumber))return notify('Complete payout details','Enter account name, bank name and a valid 10-digit account number.');
  setBusy(true);
  const {error}=await supabase.rpc('by_click_request_withdrawal',{p_points:pts,p_payout_details:{account_name:accountName.trim(),bank_name:bankName.trim(),account_number:accountNumber}});
  setBusy(false);if(error)notify('Withdrawal request',error.message);else{notify('Request submitted','Your withdrawal is pending admin review.');await load();}
 };
 const logout=async()=>{await supabase.auth.signOut();router.replace('/');};
 if(loading||!session||(!profile&&isSupabaseConfigured))return <View style={s.center}><ActivityIndicator color={GREEN}/></View>;
 if(!isSupabaseConfigured)return <View style={s.center}><Text style={s.heading}>Database setup required</Text><Text style={s.muted}>BY CLICK is not connected to its live database yet.</Text></View>;
 const name=profile?.full_name||String(session.user.user_metadata?.display_name||session.user.email?.split('@')[0]||'Member');
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>}>
  <View style={s.top}><View><Text style={s.brand}>BY CLICK</Text><Text style={s.tag}>TAP • INVITE • EARN</Text></View><Pressable style={s.outline} onPress={logout}><Text style={s.outlineText}>Log out</Text></Pressable></View>
  <Text style={s.kicker}>MEMBER DASHBOARD</Text><Text style={s.heading}>Welcome, {name}</Text><Text style={s.muted}>Your rewards, referrals and account activity.</Text>
  <View style={s.wallet}><Text style={s.walletLabel}>AVAILABLE POINTS</Text><Text style={s.balance}>{balance.toLocaleString()} <Text style={s.points}>pts</Text></Text><Text style={s.walletFoot}>1,000 points = ₦1,000  •  Minimum withdrawal: 5,000 points</Text></View>
  <View style={s.stats}><View style={s.stat}><Text style={s.statNum}>{todayTap.toLocaleString()}</Text><Text style={s.statLabel}>Today's tap points</Text></View><View style={s.stat}><Text style={s.statNum}>{referrals.length}</Text><Text style={s.statLabel}>Invited members</Text></View></View>
  <View style={s.card}><Text style={s.cardTitle}>Tap & Earn</Text><Text style={s.muted}>Earn 2 points per tap. Daily Tap & Earn limit: 1,200 points.</Text><Text style={s.limit}>{todayTap.toLocaleString()} / 1,200 points today</Text><Pressable style={[s.button,tapBusy&&{opacity:.6}]} disabled={tapBusy||todayTap>=1200} onPress={tap}>{tapBusy?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>{todayTap>=1200?'Daily limit reached':'Tap to earn +2 points'}</Text>}</Pressable></View>
  <View style={s.card}><Text style={s.cardTitle}>Invite Friends</Text><Text style={s.muted}>Your personal referral code</Text><Text selectable style={s.code}>{profile?.referral_code||'Loading...'}</Text><Pressable style={s.button} onPress={copyInvite}><Text style={s.buttonText}>Share referral code</Text></Pressable><Text style={s.small}>Referrals are recorded when a new member registers. Bonus eligibility is subject to qualification checks.</Text></View>
  <View style={s.card}><Text style={s.cardTitle}>My Referrals ({referrals.length})</Text>{referrals.length?referrals.slice(0,12).map(r=><View style={s.row} key={r.id}><Text style={s.rowText}>{new Date(r.created_at).toLocaleDateString()}</Text><Text style={s.status}>{r.status.toUpperCase()}</Text></View>):<Text style={s.muted}>No referrals yet. Share your code to invite friends.</Text>}</View>
  <View style={s.card}><Text style={s.cardTitle}>Withdraw</Text><Text style={s.muted}>Submit a request from 5,000 points. Admin approval is required before payment.</Text><TextInput style={s.input} keyboardType="number-pad" value={withdrawPoints} onChangeText={setWithdrawPoints} placeholder="Points to withdraw"/><TextInput style={s.input} value={accountName} onChangeText={setAccountName} placeholder="Account name"/><TextInput style={s.input} value={bankName} onChangeText={setBankName} placeholder="Bank name"/><TextInput style={s.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="10-digit account number" keyboardType="number-pad" maxLength={10}/><Pressable style={[s.button,busy&&{opacity:.6}]} disabled={busy} onPress={withdraw}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>Submit withdrawal request</Text>}</Pressable></View>
  <View style={s.card}><Text style={s.cardTitle}>Withdrawal History</Text>{withdrawals.length?withdrawals.map(w=><View style={s.row} key={w.id}><View><Text style={s.rowText}>{w.points.toLocaleString()} points</Text><Text style={s.small}>{new Date(w.created_at).toLocaleDateString()} {w.admin_note? '• '+w.admin_note:''}</Text></View><Text style={s.status}>{w.status.toUpperCase()}</Text></View>):<Text style={s.muted}>No withdrawal requests yet.</Text>}</View>
  <View style={s.card}><Text style={s.cardTitle}>Transaction History</Text>{ledger.length?ledger.map(x=><View style={s.row} key={x.id}><View style={{flex:1}}><Text style={s.rowText}>{x.note||x.entry_type}</Text><Text style={s.small}>{new Date(x.created_at).toLocaleString()}</Text></View><Text style={[s.amount,x.points<0&&{color:'#B42318'}]}>{x.points>0?'+':''}{x.points}</Text></View>):<Text style={s.muted}>No transactions yet.</Text>}</View>
  <Text style={s.footer}>BY CLICK • Points and withdrawals follow programme rules and review.</Text>
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F8FA'},content:{padding:18,paddingBottom:40,maxWidth:850,width:'100%',alignSelf:'center'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#F5F8FA'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:28},brand:{fontSize:22,fontWeight:'900',color:NAVY},tag:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:MUTED},outline:{padding:11,borderWidth:1,borderColor:'#D8E2EA',borderRadius:11,backgroundColor:'#fff'},outlineText:{fontWeight:'800',color:NAVY},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.6,color:GREEN},heading:{fontSize:30,fontWeight:'900',color:NAVY,marginTop:6},muted:{fontSize:13,color:MUTED,lineHeight:20,marginTop:5},wallet:{backgroundColor:NAVY,borderRadius:20,padding:23,marginTop:22},walletLabel:{fontSize:11,color:'#D1DFEF',fontWeight:'900',letterSpacing:1.4},balance:{fontSize:43,color:'#fff',fontWeight:'900',marginTop:12},points:{fontSize:16,color:'#C8D8E9'},walletFoot:{fontSize:12,color:'#D0DCE9',marginTop:7,lineHeight:19},stats:{flexDirection:'row',gap:12,marginTop:13,marginBottom:8},stat:{flex:1,backgroundColor:'#fff',borderRadius:15,padding:17,borderWidth:1,borderColor:'#E6EDF2'},statNum:{fontSize:24,fontWeight:'900',color:GREEN},statLabel:{fontSize:11,color:MUTED,marginTop:4},card:{backgroundColor:'#fff',padding:18,borderRadius:17,borderWidth:1,borderColor:'#E6EDF2',marginTop:13},cardTitle:{fontSize:18,fontWeight:'900',color:NAVY,marginBottom:7},limit:{fontSize:12,fontWeight:'800',color:GREEN,marginVertical:12},button:{backgroundColor:GREEN,borderRadius:12,padding:14,alignItems:'center',justifyContent:'center',marginTop:12,minHeight:48},buttonText:{color:'#fff',fontWeight:'900',fontSize:14},code:{fontSize:25,fontWeight:'900',letterSpacing:2,color:NAVY,backgroundColor:'#F0F7F3',padding:14,borderRadius:12,marginTop:12,textAlign:'center'},small:{fontSize:11,color:MUTED,lineHeight:17,marginTop:8},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#EEF2F5',gap:12},rowText:{fontSize:13,fontWeight:'700',color:'#26384C'},status:{fontSize:10,fontWeight:'900',color:GREEN,backgroundColor:'#EAF7EF',padding:7,borderRadius:8},amount:{fontWeight:'900',color:GREEN},input:{height:48,borderWidth:1,borderColor:'#DCE5ED',borderRadius:11,paddingHorizontal:13,marginTop:10,color:'#14243A',backgroundColor:'#FBFCFD'},footer:{textAlign:'center',fontSize:11,color:'#8794A3',marginTop:25}});
