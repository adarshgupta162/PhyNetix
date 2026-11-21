import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Batch = {id:string;name:string;short_description:string|null;category:string|null;price:number;original_price:number|null;features:string[]|null;start_date:string|null};
const categoryNames:Record<string,string>={jee_main:"JEE Main",jee_advanced:"JEE Advanced",jee_main_advanced:"JEE Main + Advanced",neet:"NEET",bitsat:"BITSAT",mht_cet:"MHT-CET",foundation:"Foundation"};
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export function TestSeriesSection() {
  const [category,setCategory]=useState("all");
  const [search,setSearch]=useState("");
  const {data:batches=[],isLoading,error,refetch,isFetching}=useQuery({queryKey:["landing-batches"],queryFn:async()=>{
    const {data,error}=await supabase.from("batches").select("id,name,short_description,category,price,original_price,features,start_date").eq("is_active",true).order("is_featured",{ascending:false}).order("created_at",{ascending:false});
    if(error) throw error; return (data||[]) as Batch[];
  },staleTime:60000});
  const categories=useMemo(()=>Array.from(new Set(batches.map(b=>b.category).filter((v):v is string=>!!v))),[batches]);
  const visible=batches.filter(b=>(category==="all"||b.category===category)&&(!search.trim()||(b.name+" "+(b.short_description||"")).toLowerCase().includes(search.trim().toLowerCase())));
  return <section id="test-series" className="product-container product-section">
    <div className="product-catalog-heading"><div><p className="product-eyebrow">Find your next challenge</p><h2>Test series, with a purpose.</h2><p>Explore the batches currently open for enrollment.</p></div><label className="product-search"><Search size={19}/><span className="sr-only">Search test series</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search test series"/></label></div>
    {categories.length>1&&<div className="product-filters" aria-label="Filter by exam">{["all",...categories].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c==="all"?"All exams":categoryNames[c]||c}</button>)}</div>}
    {isLoading?<div className="product-catalog-grid" aria-label="Loading test series" role="status">{[1,2,3].map(n=><div key={n} className="product-skeleton"/>)}</div>:error?<div className="product-empty" role="alert"><h3>We couldn't load test series.</h3><p>Please check your connection and try again.</p><button className="product-button product-button-secondary" disabled={isFetching} onClick={()=>void refetch()}>{isFetching?"Trying again…":"Try again"}</button></div>:!batches.length?<div className="product-empty"><BookOpen size={32}/><h3>The next series is on its way.</h3><p>There are no batches open for enrollment right now. Please check back soon.</p><Link to="/contact" className="product-text-link">Contact support</Link></div>:!visible.length?<div className="product-empty" role="status"><h3>No matching test series.</h3><p>Try a different exam or search term.</p><button className="product-button product-button-secondary" onClick={()=>{setSearch("");setCategory("all");}}>Clear filters</button></div>:<div className="product-catalog-grid">{visible.map(b=><article className="product-batch-card" key={b.id}><div className="product-batch-top"><span className="product-badge">{categoryNames[b.category||""]||"Test series"}</span><BookOpen size={22}/></div><h3>{b.name}</h3><p>{b.short_description||"Explore the schedule, content, and access details for this batch."}</p>{b.start_date&&<p className="product-batch-date">{new Date(b.start_date).getTime()>Date.now()?"Starts ":"Started "}{new Date(b.start_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>}<ul>{(b.features||[]).slice(0,3).map((f,i)=><li key={i}><Check size={15}/>{f}</li>)}</ul><div className="product-batch-bottom"><div><span>Batch fee</span><strong>{b.price===0?"Free":money(Number(b.price))}</strong>{b.original_price&&b.original_price>b.price?<del>{money(b.original_price)}</del>:null}</div><Link to={"/batches/"+b.id} className="product-button product-button-small">View batch</Link></div></article>)}</div>}
  </section>;
}
