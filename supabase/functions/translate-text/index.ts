import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async (req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{...cors,"Content-Type":"application/json"}});
 try{
  const authorization=req.headers.get("Authorization");
  if(!authorization)return new Response(JSON.stringify({error:"Sign in is required"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:authorization}}});
  const {data:auth,error:authError}=await client.auth.getUser();
  if(authError||!auth.user)return new Response(JSON.stringify({error:"Invalid session"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});
  const apiKey=Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
  if(!apiKey)return new Response(JSON.stringify({error:"Translation service is not configured. Add GOOGLE_TRANSLATE_API_KEY to Supabase Edge Function secrets."}),{status:503,headers:{...cors,"Content-Type":"application/json"}});
  const body=await req.json();const text=typeof body.text==="string"?body.text.trim():"";const target=typeof body.target==="string"?body.target.trim().slice(0,8):"";
  if(!text||text.length>5000||!/^[a-zA-Z-]{2,8}$/.test(target))return new Response(JSON.stringify({error:"Provide text up to 5,000 characters and a valid target language code."}),{status:400,headers:{...cors,"Content-Type":"application/json"}});
  const response=await fetch("https://translation.googleapis.com/language/translate/v2?key="+encodeURIComponent(apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:text,target,format:"text"})});
  const result=await response.json();if(!response.ok)return new Response(JSON.stringify({error:"Translation provider rejected the request.",details:result?.error?.message||"Provider error"}),{status:502,headers:{...cors,"Content-Type":"application/json"}});
  const translatedText=result?.data?.translations?.[0]?.translatedText;if(typeof translatedText!=="string")return new Response(JSON.stringify({error:"No translation was returned."}),{status:502,headers:{...cors,"Content-Type":"application/json"}});
  return new Response(JSON.stringify({translatedText,detectedSourceLanguage:result.data.translations[0].detectedSourceLanguage||null}),{status:200,headers:{...cors,"Content-Type":"application/json"}});
 }catch(_error){return new Response(JSON.stringify({error:"Translation request failed. Please try again."}),{status:500,headers:{...cors,"Content-Type":"application/json"}});}
});