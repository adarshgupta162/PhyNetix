import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { BatchCatalog } from "@/components/batch/BatchCatalog";
import { TestSeriesSection } from "@/components/landing/TestSeriesSection";
import { useAuth } from "@/hooks/useAuth";
export default function BatchCatalogPage(){
 const {user,isLoading}=useAuth();
 if(isLoading)return <div className="product-utility grid place-items-center" role="status">Loading test series…</div>;
 if(!user)return <PublicLayout><TestSeriesSection/></PublicLayout>;
 return <StudentWorkspaceLayout><div className="workspace-page-header"><div><div className="workspace-overline">Find your next challenge</div><h1>Explore batches</h1><p>Find the test series that fits your preparation.</p></div></div><BatchCatalog showEnrollButtons/></StudentWorkspaceLayout>;
}
