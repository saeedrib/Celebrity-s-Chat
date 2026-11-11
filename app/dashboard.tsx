import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/providers/AuthProvider';

const NAVY='#08244A', GREEN='#079447';
const items = [
  { icon:'wallet-outline', title:'My Wallet', detail:'View your points and reward balance', tag:'Coming soon' },
  { icon:'hand-left-outline', title:'Tap & Earn', detail:'Earn points through eligible daily taps', tag:'Coming soon' },
  { icon:'people-outline', title:'Invite Friends', detail:'Share your personal referral code', tag:'Coming soon' },
  { icon:'git-network-outline', title:'My Referrals', detail:'Track people who joined with your code', tag:'Coming soon' },
  { icon:'cash-outline', title:'Withdraw', detail:'Request a reward when eligible', tag:'Coming soon' },
  { icon:'receipt-outline', title:'Transaction History', detail:'Review points and withdrawal activity', tag:'Coming soon' },
  { icon:'person-circle-outline', title:'Profile & Settings', detail:'Manage your account information', tag:'Coming soon' },
];
export default function UserDashboard(){
 const {session,loading}=useAuth(); const router=useRouter();
 if(loading)return <View style={s.center}><ActivityIndicator color={GREEN}/></View>;
 if(!session){router.replace('/');return <View style={s.center}><ActivityIndicator color={GREEN}/></View>;}
 const name=String(session.user.user_metadata?.display_name||session.user.email?.split('@')[0]||'Member');
 const logout=async()=>{await supabase.auth.signOut();router.replace('/');};
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <View style={s.top}><View style={s.brandRow}><View style={s.logo}><Text style={s.logoText}>↗</Text></View><View><Text style={s.brand}>BY CLICK</Text><Text style={s.tag}>TAP • INVITE • EARN</Text></View></View><Pressable onPress={logout} style={s.logout}><Ionicons name="log-out-outline" size={19} color={NAVY}/><Text style={s.logoutText}>Log out</Text></Pressable></View>
  <View style={s.greeting}><Text style={s.kicker}>USER DASHBOARD</Text><Text style={s.title}>Welcome, {name}</Text><Text style={s.subtitle}>Your BY CLICK account overview.</Text></View>
  <View style={s.wallet}><View style={s.walletHead}><Text style={s.walletLabel}>MY REWARDS BALANCE</Text><Ionicons name="shield-checkmark-outline" size={22} color="#BCE8CB"/></View><Text style={s.walletValue}>— <Text style={s.pts}>points</Text></Text><Text style={s.walletNote}>Your live points balance will appear when the secure rewards ledger is connected.</Text><View style={s.walletDivider}/><View style={s.walletFoot}><Text style={s.walletSmall}>1,000 points = ₦1,000</Text><Text style={s.walletSmall}>Minimum withdrawal: 5,000 points</Text></View></View>
  <View style={s.sectionHead}><Text style={s.sectionTitle}>Your account</Text><Text style={s.sectionSub}>Choose a service</Text></View>
  <View style={s.grid}>{items.map(item=><View key={item.title} style={s.card}><View style={s.cardTop}><View style={s.iconBox}><Ionicons name={item.icon as any} size={23} color={GREEN}/></View><Text style={s.tagSoon}>{item.tag}</Text></View><Text style={s.cardTitle}>{item.title}</Text><Text style={s.cardDetail}>{item.detail}</Text></View>)}</View>
  <View style={s.notice}><Ionicons name="information-circle-outline" size={22} color={NAVY}/><View style={{flex:1}}><Text style={s.noticeTitle}>Account setup in progress</Text><Text style={s.noticeText}>Your sign-in is connected. The wallet, earning, referral and withdrawal services are being connected to the secure database before they are activated. No points or payments are being claimed yet.</Text></View></View>
  <Text style={s.footer}>BY CLICK • Rewards are subject to programme rules and review.</Text>
 </ScrollView>
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F5F8FA'},content:{padding:20,paddingBottom:42,maxWidth:1050,width:'100%',alignSelf:'center'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F5F8FA'},
 top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10},brandRow:{flexDirection:'row',alignItems:'center',gap:10},logo:{width:43,height:43,borderRadius:13,backgroundColor:'#E5F5EB',alignItems:'center',justifyContent:'center'},logoText:{fontSize:28,fontWeight:'900',color:GREEN},brand:{fontSize:20,fontWeight:'900',color:NAVY,letterSpacing:-.5},tag:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:'#64748B'},logout:{flexDirection:'row',alignItems:'center',gap:6,padding:10,borderRadius:12,backgroundColor:'#fff',borderWidth:1,borderColor:'#E4EAF0'},logoutText:{fontSize:13,fontWeight:'800',color:NAVY},
 greeting:{marginTop:30,marginBottom:20},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.6,color:GREEN},title:{fontSize:32,fontWeight:'900',color:NAVY,marginTop:7},subtitle:{fontSize:15,color:'#64748B',marginTop:5},
 wallet:{backgroundColor:NAVY,borderRadius:22,padding:22,marginBottom:30},walletHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},walletLabel:{fontSize:11,fontWeight:'900',letterSpacing:1.4,color:'#D1DFEF'},walletValue:{fontSize:42,fontWeight:'900',color:'#fff',marginTop:19},pts:{fontSize:16,color:'#C8D8E9'},walletNote:{fontSize:13,lineHeight:20,color:'#D0DCE9',marginTop:6,maxWidth:650},walletDivider:{height:1,backgroundColor:'#FFFFFF30',marginVertical:18},walletFoot:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:8},walletSmall:{fontSize:12,fontWeight:'700',color:'#E1ECF6'},
 sectionHead:{marginBottom:14},sectionTitle:{fontSize:22,fontWeight:'900',color:NAVY},sectionSub:{fontSize:13,color:'#718096',marginTop:3},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},card:{backgroundColor:'#fff',borderRadius:17,padding:16,borderWidth:1,borderColor:'#E7EDF2',width:'48%',minWidth:145,flexGrow:1,minHeight:145},cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},iconBox:{width:43,height:43,borderRadius:13,backgroundColor:'#EAF7EF',alignItems:'center',justifyContent:'center'},tagSoon:{fontSize:9,fontWeight:'800',color:'#7A8795',backgroundColor:'#F1F4F6',paddingHorizontal:8,paddingVertical:5,borderRadius:10},cardTitle:{fontSize:16,fontWeight:'900',color:'#172B45',marginTop:13},cardDetail:{fontSize:12,lineHeight:18,color:'#718096',marginTop:5},
 notice:{marginTop:22,backgroundColor:'#EAF1F8',borderWidth:1,borderColor:'#D8E4EF',borderRadius:15,padding:16,flexDirection:'row',gap:11,alignItems:'flex-start'},noticeTitle:{fontSize:14,fontWeight:'900',color:NAVY},noticeText:{fontSize:12,lineHeight:19,color:'#52657A',marginTop:5},footer:{textAlign:'center',fontSize:11,color:'#8794A3',marginTop:28}
});
