import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAuthMode, safeReturnPath, type AuthMode } from "@/lib/authNavigation";

export default function AuthPage() {
  const location=useLocation(),navigate=useNavigate();
  const [params,setParams]=useSearchParams();
  const mode=getAuthMode(location.pathname,params.get("mode"));
  const {user,isAdmin,isLoading:authLoading,signIn}=useAuth();
  const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [providers,setProviders]=useState<string[]>([]);
  const next=safeReturnPath(params.get("next"),isAdmin?"/admin":"/dashboard");
  function changeMode(value:AuthMode) {const p=new URLSearchParams(params);p.set("mode",value);setParams(p);setError("");setMessage("");setPassword("");setConfirm("");}
  useEffect(()=>{
    const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
      if(event==="PASSWORD_RECOVERY") setParams(p=>{const next=new URLSearchParams(p);next.set("mode","recovery");return next;},{replace:true});
    });
    return ()=>subscription.unsubscribe();
  },[setParams]);
  useEffect(()=>{if(!authLoading&&user&&(mode==="login"||mode==="signup"))navigate(next,{replace:true});},[authLoading,user,mode,next,navigate]);
  useEffect(()=>{
    const abort=new AbortController();
    fetch(import.meta.env.VITE_SUPABASE_URL+"/auth/v1/settings",{headers:{apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},signal:abort.signal})
      .then(r=>r.ok?r.json():null).then(data=>{if(data)setProviders(["google","apple"].filter(p=>data.external?.[p]===true));}).catch(()=>{});
    return ()=>abort.abort();
  },[]);
  useEffect(()=>{if(user?.email)setEmail(user.email);},[user?.email]);
  async function submit(event:FormEvent) {
    event.preventDefault();setError("");setMessage("");
    if(mode==="signup"&&name.trim().length<2){setError("Enter your full name (at least two characters).");return;}
    if((mode==="signup"||mode==="recovery")&&password.length<8){setError("Use a password with at least 8 characters.");return;}
    if(mode==="recovery"&&password!==confirm){setError("The passwords don't match.");return;}
    setBusy(true);
    try {
      if(mode==="login"){const {error}=await signIn(email.trim(),password);if(error)throw error;}
      if(mode==="signup"){const {error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:window.location.origin+"/auth"}});if(error)throw error;setMessage("Check your email for a confirmation link, then return here to sign in.");}
      if(mode==="forgot"){const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/auth?mode=recovery"});if(error)throw error;setMessage("If an account exists for this email, a password reset link will arrive shortly. Check your inbox and spam folder.");}
      if(mode==="recovery"){if(!user)throw new Error("Open the password reset link from your email first. If it has expired, request a new one.");const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword("");setConfirm("");setMessage("Your password has been updated. You can continue to your workspace.");}
    }catch(err){setError(err instanceof Error?err.message:"We couldn't complete this request. Please try again.");}finally{setBusy(false);}
  }
  async function oauth(provider:"google"|"apple") {
    setError("");setBusy(true);
    try {const redirect=new URL("/auth",window.location.origin);redirect.searchParams.set("next",next);const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:redirect.href}});if(error)throw error;}
    catch(err){setError(err instanceof Error?err.message:"Unable to start sign in.");setBusy(false);}
  }
  const title=mode==="signup"?"Your preparation starts here.":mode==="forgot"?"Let's get you back in.":mode==="recovery"?"Choose a new password.":"Welcome back.";
  const intro=mode==="signup"?"Create your free PhyNetix account.":mode==="forgot"?"Enter your registered email to receive a reset link.":mode==="recovery"?"Use a strong password you haven't used elsewhere.":"Your next step is waiting in your workspace.";
  return <div className="auth-product">
    <aside className="auth-story"><Link to="/" aria-label="PhyNetix home"><BrandLogo/></Link><div><p className="product-eyebrow">Prepare with purpose</p><h2>Small steps.<br/>Clear progress.<br/><span>Your best attempt.</span></h2><p>Bring your tests, practice, and progress together. Turn tough problems into simple solutions.</p></div><small>PhyNetix · Built around your preparation</small></aside>
    <main className="auth-main"><div className="auth-panel"><h1>{title}</h1><p>{intro}</p>
      <form onSubmit={submit} className="product-form">
        {mode==="signup"&&<div><label htmlFor="full-name">Full name</label><input id="full-name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100}/></div>}
        {mode!=="recovery"&&<div><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required maxLength={254}/></div>}
        {mode!=="forgot"&&<div><label htmlFor="password">{mode==="recovery"?"New password":"Password"}</label><div className="auth-password"><input id="password" type={visible?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={mode==="login"?1:8} aria-describedby={mode==="login"?undefined:"password-hint"}/><button type="button" aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>{mode!=="login"&&<p id="password-hint" className="mt-2 text-sm text-slate-400">At least 8 characters.</p>}</div>}
        {mode==="recovery"&&<div><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type={visible?"text":"password"} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>}
        {mode==="login"&&<div className="auth-links"><button type="button" onClick={()=>changeMode("forgot")}>Forgot password?</button><Link to="/staff-login">Staff sign in</Link></div>}
        {error&&<p className="product-form-message product-form-error" role="alert">{error}</p>}
        {message&&<p className="product-form-message" role="status">{message}</p>}
        <button className="product-button" disabled={busy||authLoading} type="submit">{busy?<><Loader2 size={17} className="animate-spin"/>Please wait…</>:mode==="signup"?"Create account":mode==="forgot"?"Send reset link":mode==="recovery"?"Update password":"Log in"}</button>
        {mode==="recovery"&&<Link className="product-text-link text-center" to={message?"/dashboard":"/auth?mode=forgot"}>{message?"Continue to workspace":"Request a new reset link"}</Link>}
      </form>
      {(mode==="login"||mode==="signup")&&providers.length>0&&<div className="auth-provider">{providers.map(p=><button type="button" key={p} disabled={busy} className="product-button product-button-secondary" onClick={()=>void oauth(p as "google"|"apple")}>Continue with {p==="google"?"Google":"Apple"}</button>)}</div>}
      <div className="auth-bottom">{mode==="signup"?<>Already have an account? <button onClick={()=>changeMode("login")}>Log in</button></>:mode==="login"?<>New to PhyNetix? <button onClick={()=>changeMode("signup")}>Create an account</button></>:<button onClick={()=>changeMode("login")}>Back to log in</button>}</div>
      <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
    </div></main>
  </div>;
}
