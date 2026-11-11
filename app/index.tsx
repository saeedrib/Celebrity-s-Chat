import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase';

const NAVY = '#08244A';
const GREEN = '#079447';
const INK = '#14243A';
const MUTED = '#64748B';

function Pill({ children }: { children: React.ReactNode }) {
  return <View style={s.pill}><Text style={s.pillText}>{children}</Text></View>;
}

export default function Welcome() {
  const { session, loading } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [mode, setMode] = useState<'login' | 'signup' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [busy, setBusy] = useState(false);

  const notify = (title: string, body: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(title + '\\n\\n' + body);
    else Alert.alert(title, body);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={GREEN} /></View>;
  if (session) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    if (!isSupabaseConfigured) return notify('Setup required', 'The account service is not configured yet.');
    if (!email.trim() || password.length < 8 || (mode === 'signup' && !name.trim())) {
      return notify('Check your details', 'Please enter your name (for sign up), email and a password of at least 8 characters.');
    }
    setBusy(true);
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim(), referral_code_used: referral.trim() || null } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) notify('Unable to continue', result.error.message);
      else if (mode === 'signup' && !result.data.session) notify('Account created', 'Please check your email for a confirmation message before signing in.');
      else if (mode === 'signup') notify('Welcome to BY CLICK', 'Your account has been created.');
    } catch (e) {
      notify('Connection problem', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.announcement}><Text style={s.announceText}>✦  WELCOME TO BY CLICK  ·  TAP • INVITE • EARN</Text><Text style={s.announceRight}>A rewards community built around simple actions</Text></View>
        <View style={s.nav}>
          <View style={s.brand}><View style={s.logo}><Text style={s.logoGlyph}>↗</Text></View><View><Text style={s.brandName}>BY <Text style={{color:GREEN}}>CLICK</Text></Text><Text style={s.brandTag}>TAP  •  INVITE  •  EARN</Text></View></View>
          {wide && <View style={s.navLinks}><Text style={s.navLink}>Home</Text><Text style={s.navLink}>How it works</Text><Text style={s.navLink}>Rewards</Text><Text style={s.navLink}>Help</Text></View>}
          <View style={s.navActions}><Pressable onPress={()=>setMode('login')} style={s.loginBtn}><Text style={s.loginText}>Log in</Text></Pressable><Pressable onPress={()=>setMode('signup')} style={s.signupBtn}><Text style={s.signupText}>Create account</Text></Pressable></View>
        </View>

        <View style={[s.hero,{flexDirection:wide?'row':'column'}]}>
          <View style={[s.heroCopy,{width:wide?'56%':'100%'}]}>
            <Pill>YOUR NEXT REWARD STARTS HERE</Pill>
            <Text style={[s.heroTitle,{fontSize:wide?62:43}]}>Small actions.{ '\\n' }<Text style={{color:GREEN}}>Real rewards.</Text></Text>
            <Text style={s.heroLead}>Welcome to BY CLICK — a simple way to collect points, invite friends and request rewards when you reach the required balance.</Text>
            <View style={s.heroButtons}><Pressable style={s.primaryBtn} onPress={()=>setMode('signup')}><Text style={s.primaryText}>Get started free  →</Text></Pressable><Pressable style={s.secondaryBtn} onPress={()=>notify('How BY CLICK works','Create an account, earn points through eligible activities, invite friends and request a withdrawal when you meet the minimum.') }><Text style={s.secondaryText}>How it works</Text></Pressable></View>
            <Text style={s.trustLine}>✓ Clear point rules     ✓ Secure account access     ✓ Withdrawal review</Text>
          </View>
          <View style={[s.visual,{width:wide?'44%':'100%',marginTop:wide?0:34}]}>
            <View style={s.glow} />
            <View style={s.rewardCard}><Text style={s.cardEyebrow}>YOUR REWARDS OVERVIEW</Text><Text style={s.coin}>✦</Text><Text style={s.points}>5,240 <Text style={s.pts}>pts</Text></Text><Text style={s.naira}>Illustrative points balance</Text><View style={s.progress}><View style={s.progressFill}/></View><Text style={s.progressText}>A clear path to your next milestone</Text></View>
            <View style={s.floatBadge}><Text style={s.badgeIcon}>＋</Text><View><Text style={s.badgeTitle}>Invite friends</Text><Text style={s.badgeSub}>Grow together</Text></View></View>
            <View style={s.orb}><Text style={s.orbText}>BC</Text></View>
          </View>
        </View>

        <View style={[s.metrics,{flexDirection:wide?'row':'column'}]}>
          <View style={s.metric}><Text style={s.metricValue}>15</Text><Text style={s.metricLabel}>Welcome points</Text></View>
          <View style={s.metric}><Text style={s.metricValue}>2</Text><Text style={s.metricLabel}>Points per eligible tap</Text></View>
          <View style={s.metric}><Text style={s.metricValue}>1,200</Text><Text style={s.metricLabel}>Daily tap points limit</Text></View>
          <View style={s.metric}><Text style={s.metricValue}>5,000</Text><Text style={s.metricLabel}>Minimum withdrawal points</Text></View>
        </View>

        <View style={s.section}><Text style={s.kicker}>SIMPLE FROM THE START</Text><Text style={s.sectionTitle}>How BY CLICK works</Text><Text style={s.sectionLead}>A straightforward journey, with the rules explained clearly at every step.</Text>
          <View style={[s.steps,{flexDirection:wide?'row':'column'}]}>
            {[
              ['01','Create your account','Register with your email and set up your secure account.'],
              ['02','Earn points','Use the eligible Tap & Earn feature within the daily limit.'],
              ['03','Invite your friends','Share your personal referral code and track successful referrals.'],
              ['04','Request a withdrawal','Reach 5,000 points and submit a request for admin review.'],
            ].map(([n,t,d])=><View key={n} style={s.step}><Text style={s.stepNo}>{n}</Text><Text style={s.stepTitle}>{t}</Text><Text style={s.stepDesc}>{d}</Text></View>)}
          </View>
        </View>

        <View style={[s.bottomCta,{flexDirection:wide?'row':'column'}]}><View style={{flex:1}}><Text style={s.ctaTitle}>Ready to get started?</Text><Text style={s.ctaDesc}>Join BY CLICK and follow your points from one clear dashboard.</Text></View><Pressable style={s.ctaButton} onPress={()=>setMode('signup')}><Text style={s.ctaButtonText}>Create your free account  →</Text></Pressable></View>
        <View style={s.footer}><Text style={s.footerBrand}>BY CLICK</Text><Text style={s.footerText}>Tap • Invite • Earn</Text><Text style={s.footerFine}>Rewards are subject to the published programme rules, eligibility checks and withdrawal review. Points are not a guaranteed income.</Text><Text style={s.footerFine}>© 2026 BY CLICK. All rights reserved.</Text></View>
      </ScrollView>

      {mode && <View style={s.modalBackdrop}><View style={s.modal}><Pressable onPress={()=>setMode(null)} style={s.close}><Text style={s.closeText}>×</Text></Pressable><Text style={s.modalKicker}>BY CLICK ACCOUNT</Text><Text style={s.modalTitle}>{mode==='signup'?'Create your account':'Welcome back'}</Text><Text style={s.modalLead}>{mode==='signup'?'Start your rewards journey with a few details.':'Log in to continue to your account.'}</Text>
        {mode==='signup' && <TextInput placeholder="Full name" value={name} onChangeText={setName} style={s.input} autoCapitalize="words" />}
        <TextInput placeholder="Email address" value={email} onChangeText={setEmail} style={s.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password (at least 8 characters)" value={password} onChangeText={setPassword} style={s.input} secureTextEntry />
        {mode==='signup' && <TextInput placeholder="Referral code (optional)" value={referral} onChangeText={setReferral} style={s.input} autoCapitalize="characters" />}
        <Pressable style={[s.primaryBtn,{width:'100%',marginTop:8,opacity:busy?0.7:1}]} onPress={submit} disabled={busy}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.primaryText}>{mode==='signup'?'Create account':'Log in securely'}</Text>}</Pressable>
        <Pressable onPress={()=>setMode(mode==='signup'?'login':'signup')}><Text style={s.switchText}>{mode==='signup'?'Already registered? Log in':'New to BY CLICK? Create an account'}</Text></Pressable>
        <Text style={s.smallNote}>Your account details are handled through the secure sign-in service.</Text>
      </View></View>}
    </KeyboardAvoidingView>
  );
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#F7FAFC'},scroll:{paddingBottom:0},center:{flex:1,alignItems:'center',justifyContent:'center'},
 announcement:{backgroundColor:NAVY,minHeight:38,paddingHorizontal:24,paddingVertical:9,flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap'},
 announceText:{color:'#DCEBFF',fontSize:12,fontWeight:'800',letterSpacing:1},announceRight:{color:'#B8C9DD',fontSize:12},
 nav:{minHeight:86,paddingHorizontal: '5%' as any,backgroundColor:'#FFFFFF',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#E9EFF5',gap:12},
 brand:{flexDirection:'row',alignItems:'center',gap:11},logo:{width:48,height:48,borderRadius:16,backgroundColor:'#E9F8EF',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#BCE8CB'},logoGlyph:{fontSize:30,color:GREEN,fontWeight:'900'},brandName:{fontSize:25,fontWeight:'900',color:NAVY,letterSpacing:-1},brandTag:{fontSize:10,color:MUTED,fontWeight:'800',letterSpacing:2,marginTop:1},
 navLinks:{flexDirection:'row',gap:30},navLink:{color:'#334155',fontSize:14,fontWeight:'700'},navActions:{flexDirection:'row',alignItems:'center',gap:9},loginBtn:{paddingVertical:12,paddingHorizontal:18,borderRadius:24,borderWidth:1,borderColor:'#C9D7E5'},loginText:{color:NAVY,fontWeight:'800'},signupBtn:{paddingVertical:13,paddingHorizontal:19,borderRadius:24,backgroundColor:GREEN},signupText:{color:'#fff',fontWeight:'800'},
 hero:{paddingHorizontal:'6%' as any,paddingTop:62,paddingBottom:58,alignItems:'center',backgroundColor:'#F0F7FB',overflow:'hidden'},heroCopy:{maxWidth:680},pill:{alignSelf:'flex-start',backgroundColor:'#E1F5E8',borderRadius:30,paddingHorizontal:14,paddingVertical:8,borderWidth:1,borderColor:'#C6EBD2'},pillText:{color:'#087A3B',fontSize:11,fontWeight:'900',letterSpacing:1},heroTitle:{fontWeight:'900',color:NAVY,lineHeight:1.08,letterSpacing:-2,marginTop:22},heroLead:{fontSize:17,lineHeight:28,color:'#53657A',marginTop:18,maxWidth:570},heroButtons:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:28},primaryBtn:{backgroundColor:GREEN,borderRadius:14,paddingHorizontal:24,paddingVertical:16,alignItems:'center',justifyContent:'center',minHeight:54},primaryText:{color:'#fff',fontSize:15,fontWeight:'900'},secondaryBtn:{borderWidth:1,borderColor:'#B9C9D8',borderRadius:14,paddingHorizontal:22,paddingVertical:15,justifyContent:'center',minHeight:54,backgroundColor:'#fff'},secondaryText:{color:NAVY,fontWeight:'800',fontSize:15},trustLine:{fontSize:12,color:'#65788B',fontWeight:'700',marginTop:23,lineHeight:22},
 visual:{minHeight:320,maxWidth:490,alignItems:'center',justifyContent:'center',position:'relative'},glow:{position:'absolute',width:300,height:300,borderRadius:150,backgroundColor:'#D5F4E0',right:10,top:5},rewardCard:{width:'83%',backgroundColor:NAVY,borderRadius:25,padding:26,borderWidth:3,borderColor:'#FFFFFF',elevation:10,shadowColor:NAVY,shadowOpacity:0.2,shadowRadius:22,transform:[{rotate:'-3deg'}]},cardEyebrow:{color:'#BBD1E8',fontSize:11,fontWeight:'800',letterSpacing:1},coin:{fontSize:37,color:'#F6C84A',marginTop:14},points:{fontSize:48,fontWeight:'900',color:'#fff',letterSpacing:-2},pts:{fontSize:19,color:'#B8D6C3'},naira:{color:'#B9C9DC',fontSize:13,marginTop:2},progress:{height:8,borderRadius:10,backgroundColor:'#294363',marginTop:22,overflow:'hidden'},progressFill:{height:8,width:'68%',backgroundColor:'#21C66A',borderRadius:10},progressText:{color:'#B9C9DC',fontSize:11,marginTop:9},floatBadge:{position:'absolute',right:0,bottom:15,backgroundColor:'#fff',borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',gap:10,elevation:8,shadowColor:NAVY,shadowOpacity:0.13,shadowRadius:12},badgeIcon:{width:35,height:35,borderRadius:12,backgroundColor:'#E6F8EC',color:GREEN,textAlign:'center',textAlignVertical:'center',fontSize:26,fontWeight:'800'},badgeTitle:{color:INK,fontWeight:'900',fontSize:13},badgeSub:{color:MUTED,fontSize:11,marginTop:2},orb:{position:'absolute',left:0,top:18,width:58,height:58,borderRadius:29,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',borderWidth:5,borderColor:'#fff'},orbText:{color:'#fff',fontWeight:'900',fontSize:18},
 metrics:{marginHorizontal:'5%' as any,marginTop:-22,backgroundColor:'#fff',borderRadius:20,paddingVertical:22,paddingHorizontal:10,elevation:5,shadowColor:NAVY,shadowOpacity:0.08,shadowRadius:18,justifyContent:'space-around',borderWidth:1,borderColor:'#E7EEF4'},metric:{flex:1,alignItems:'center',paddingVertical:8},metricValue:{fontSize:27,fontWeight:'900',color:GREEN},metricLabel:{fontSize:12,color:'#596A7C',fontWeight:'700',textAlign:'center',marginTop:4},
 section:{paddingHorizontal:'6%' as any,paddingTop:70,paddingBottom:62,alignItems:'center'},kicker:{fontSize:11,color:GREEN,fontWeight:'900',letterSpacing:2},sectionTitle:{fontSize:34,color:NAVY,fontWeight:'900',marginTop:9,textAlign:'center',letterSpacing:-1},sectionLead:{fontSize:15,color:MUTED,marginTop:10,textAlign:'center',lineHeight:24},steps:{width:'100%',gap:16,marginTop:34,justifyContent:'center'},step:{flex:1,minHeight:180,backgroundColor:'#fff',borderRadius:18,borderWidth:1,borderColor:'#E4ECF2',padding:23,shadowColor:NAVY,shadowOpacity:0.04,shadowRadius:12,elevation:2},stepNo:{color:GREEN,fontSize:13,fontWeight:'900',letterSpacing:2},stepTitle:{fontSize:18,fontWeight:'900',color:NAVY,marginTop:18},stepDesc:{fontSize:14,lineHeight:23,color:'#657589',marginTop:9},
 bottomCta:{marginHorizontal:'5%' as any,marginBottom:48,padding:30,borderRadius:22,backgroundColor:NAVY,alignItems:'center',gap:20},ctaTitle:{fontSize:27,color:'#fff',fontWeight:'900'},ctaDesc:{fontSize:14,color:'#C7D6E6',marginTop:6,lineHeight:22},ctaButton:{backgroundColor:'#20B85A',borderRadius:13,paddingHorizontal:22,paddingVertical:16},ctaButtonText:{color:'#fff',fontWeight:'900'},footer:{backgroundColor:'#061A35',paddingHorizontal:'6%' as any,paddingTop:30,paddingBottom:28,alignItems:'center'},footerBrand:{fontSize:24,color:'#fff',fontWeight:'900',letterSpacing:2},footerText:{fontSize:12,color:'#9EB4CC',marginTop:3},footerFine:{fontSize:11,color:'#8FA4BC',textAlign:'center',lineHeight:18,marginTop:13,maxWidth:700},
 modalBackdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,18,39,0.62)',justifyContent:'center',alignItems:'center',padding:18,zIndex:20},modal:{width:'100%',maxWidth:460,backgroundColor:'#fff',borderRadius:24,padding:27,elevation:20},close:{position:'absolute',right:17,top:12,zIndex:2},closeText:{fontSize:30,color:'#718096'},modalKicker:{color:GREEN,fontSize:10,fontWeight:'900',letterSpacing:2,marginTop:8},modalTitle:{fontSize:28,color:NAVY,fontWeight:'900',marginTop:8},modalLead:{fontSize:14,color:MUTED,lineHeight:21,marginTop:7,marginBottom:20},input:{height:52,borderWidth:1,borderColor:'#DCE5ED',borderRadius:12,paddingHorizontal:14,marginBottom:12,color:INK,fontSize:15,backgroundColor:'#FBFCFD'},switchText:{textAlign:'center',color:GREEN,fontWeight:'800',marginTop:18},smallNote:{fontSize:11,color:'#8795A5',textAlign:'center',marginTop:18,lineHeight:17}
});
