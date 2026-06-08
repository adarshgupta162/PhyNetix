 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   Plus, Percent, IndianRupee, Calendar, Users, 
   MoreVertical, Edit2, Trash2, Copy, Check, X, Tag
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import { 
   Dialog, 
   DialogContent, 
   DialogHeader, 
   DialogTitle, 
   DialogTrigger 
 } from "@/components/ui/dialog";
 import { 
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { 
   Table, 
   TableBody, 
   TableCell, 
   TableHead, 
   TableHeader, 
   TableRow 
 } from "@/components/ui/table";
 import { Checkbox } from "@/components/ui/checkbox";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 
 interface Coupon {
   id: string;
   code: string;
   description: string | null;
   discount_type: string;
   discount_value: number;
   max_uses: number | null;
   current_uses: number;
   min_purchase_amount: number | null;
   valid_from: string | null;
   valid_until: string | null;
   is_active: boolean;
   applicable_batches: string[] | null;
 }
 
 interface Batch {
   id: string;
   name: string;
 }
 
 export function CouponManager() {
   const [showDialog, setShowDialog] = useState(false);
   const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
   const queryClient = useQueryClient();
 
   // Form state
   const [code, setCode] = useState("");
   const [description, setDescription] = useState("");
   const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
   const [discountValue, setDiscountValue] = useState(10);
   const [maxUses, setMaxUses] = useState<number | null>(null);
   const [minPurchase, setMinPurchase] = useState<number | null>(null);
   const [validUntil, setValidUntil] = useState("");
   const [isActive, setIsActive] = useState(true);
   const [applicableToAll, setApplicableToAll] = useState(true);
   const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
 
   // Fetch coupons
   const { data: coupons, isLoading } = useQuery({
     queryKey: ['admin-coupons'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('coupons')
         .select('*')
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data as Coupon[];
     },
   });
 
   // Fetch batches for selection
   const { data: batches } = useQuery({
     queryKey: ['batches-for-coupons'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('batches')
         .select('id, name')
         .eq('is_active', true)
         .order('name');
       if (error) throw error;
       return data as Batch[];
     },
   });
 
   // Create/Update coupon
   const couponMutation = useMutation({
     mutationFn: async (isUpdate: boolean) => {
       const couponData = {
         code: code.toUpperCase().trim(),
         description: description || null,
         discount_type: discountType,
         discount_value: discountValue,
         max_uses: maxUses,
         min_purchase_amount: minPurchase,
         valid_until: validUntil || null,
         is_active: isActive,
         applicable_batches: applicableToAll ? null : selectedBatches,
       };
 
       if (isUpdate && editingCoupon) {
         const { error } = await supabase
           .from('coupons')
           .update(couponData)
           .eq('id', editingCoupon.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('coupons')
           .insert([couponData]);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
       toast({ title: editingCoupon ? "Coupon updated!" : "Coupon created!" });
       resetForm();
       setShowDialog(false);
     },
     onError: (error: any) => {
       toast({ 
         title: "Error", 
         description: error.message || "Failed to save coupon",
         variant: "destructive" 
       });
     },
   });
 
   // Delete coupon
   const deleteMutation = useMutation({
     mutationFn: async (couponId: string) => {
       const { error } = await supabase
         .from('coupons')
         .delete()
         .eq('id', couponId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
       toast({ title: "Coupon deleted" });
     },
   });
 
   // Toggle active
   const toggleActive = async (coupon: Coupon) => {
     await supabase
       .from('coupons')
       .update({ is_active: !coupon.is_active })
       .eq('id', coupon.id);
     queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
   };
 
   const resetForm = () => {
     setCode("");
     setDescription("");
     setDiscountType("percentage");
     setDiscountValue(10);
     setMaxUses(null);
     setMinPurchase(null);
     setValidUntil("");
     setIsActive(true);
     setApplicableToAll(true);
     setSelectedBatches([]);
     setEditingCoupon(null);
   };
 
   const openEdit = (coupon: Coupon) => {
     setEditingCoupon(coupon);
     setCode(coupon.code);
     setDescription(coupon.description || "");
     setDiscountType(coupon.discount_type as "percentage" | "fixed");
     setDiscountValue(coupon.discount_value);
     setMaxUses(coupon.max_uses);
     setMinPurchase(coupon.min_purchase_amount);
     setValidUntil(coupon.valid_until?.split('T')[0] || "");
     setIsActive(coupon.is_active);
     setApplicableToAll(!coupon.applicable_batches || coupon.applicable_batches.length === 0);
     setSelectedBatches(coupon.applicable_batches || []);
     setShowDialog(true);
   };
 
   const generateCode = () => {
     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
     let result = '';
     for (let i = 0; i < 8; i++) {
       result += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     setCode(result);
   };
 
   const copyCode = (code: string) => {
     navigator.clipboard.writeText(code);
     toast({ title: "Copied!", description: code });
   };
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold">Coupon Management</h3>
         <Dialog open={showDialog} onOpenChange={(open) => {
           setShowDialog(open);
           if (!open) resetForm();
         }}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="w-4 h-4 mr-2" />
               Create Coupon
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
               {/* Code */}
               <div className="space-y-2">
                 <Label>Coupon Code</Label>
                 <div className="flex gap-2">
                   <Input
                     value={code}
                     onChange={(e) => setCode(e.target.value.toUpperCase())}
                     placeholder="SAVE20"
                     className="font-mono uppercase"
                   />
                   <Button type="button" variant="outline" onClick={generateCode}>
                     Generate
                   </Button>
                 </div>
               </div>
 
               {/* Description */}
               <div className="space-y-2">
                 <Label>Description (optional)</Label>
                 <Input
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="New year discount"
                 />
               </div>
 
               {/* Discount Type */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Discount Type</Label>
                   <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="percentage">
                         <span className="flex items-center gap-2">
                           <Percent className="w-4 h-4" /> Percentage
                         </span>
                       </SelectItem>
                       <SelectItem value="fixed">
                         <span className="flex items-center gap-2">
                           <IndianRupee className="w-4 h-4" /> Fixed Amount
                         </span>
                       </SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Discount Value</Label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                       {discountType === 'percentage' ? '%' : '₹'}
                     </span>
                     <Input
                       type="number"
                       value={discountValue}
                       onChange={(e) => setDiscountValue(Number(e.target.value))}
                       className="pl-8"
                       min={1}
                       max={discountType === 'percentage' ? 100 : undefined}
                     />
                   </div>
                 </div>
               </div>
 
               {/* Limits */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Max Uses (empty = unlimited)</Label>
                   <Input
                     type="number"
                     value={maxUses || ''}
                     onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                     placeholder="Unlimited"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Min Purchase (₹)</Label>
                   <Input
                     type="number"
                     value={minPurchase || ''}
                     onChange={(e) => setMinPurchase(e.target.value ? Number(e.target.value) : null)}
                     placeholder="No minimum"
                   />
                 </div>
               </div>
 
               {/* Validity */}
               <div className="space-y-2">
                 <Label>Valid Until (empty = no expiry)</Label>
                 <Input
                   type="date"
                   value={validUntil}
                   onChange={(e) => setValidUntil(e.target.value)}
                 />
               </div>
 
               {/* Batch Selection */}
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label>Applicable Batches</Label>
                   <div className="flex items-center gap-2">
                     <Switch 
                       checked={applicableToAll} 
                       onCheckedChange={setApplicableToAll} 
                     />
                     <span className="text-sm text-muted-foreground">All batches</span>
                   </div>
                 </div>
                 {!applicableToAll && batches && (
                   <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                     {batches.map((batch) => (
                       <label key={batch.id} className="flex items-center gap-2 cursor-pointer">
                         <Checkbox
                           checked={selectedBatches.includes(batch.id)}
                           onCheckedChange={(checked) => {
                             if (checked) {
                               setSelectedBatches([...selectedBatches, batch.id]);
                             } else {
                               setSelectedBatches(selectedBatches.filter(id => id !== batch.id));
                             }
                           }}
                         />
                         <span className="text-sm">{batch.name}</span>
                       </label>
                     ))}
                   </div>
                 )}
               </div>
 
               {/* Active Toggle */}
               <div className="flex items-center justify-between">
                 <Label>Active</Label>
                 <Switch checked={isActive} onCheckedChange={setIsActive} />
               </div>
 
               {/* Actions */}
               <div className="flex gap-2 pt-4">
                 <Button 
                   className="flex-1"
                   onClick={() => couponMutation.mutate(!!editingCoupon)}
                   disabled={!code.trim() || couponMutation.isPending}
                 >
                   {editingCoupon ? "Update Coupon" : "Create Coupon"}
                 </Button>
                 <Button variant="outline" onClick={() => setShowDialog(false)}>
                   Cancel
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       {/* Coupons Table */}
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>Code</TableHead>
             <TableHead>Discount</TableHead>
             <TableHead>Uses</TableHead>
             <TableHead>Valid Until</TableHead>
             <TableHead>Scope</TableHead>
             <TableHead>Status</TableHead>
             <TableHead></TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {coupons?.map((coupon) => (
             <TableRow key={coupon.id}>
               <TableCell>
                 <div className="flex items-center gap-2">
                   <code className="px-2 py-1 bg-secondary rounded font-mono text-sm">
                     {coupon.code}
                   </code>
                   <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}>
                     <Copy className="w-3 h-3" />
                   </Button>
                 </div>
                 {coupon.description && (
                   <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                 )}
               </TableCell>
               <TableCell>
                 <Badge variant="outline" className="font-mono">
                   {coupon.discount_type === 'percentage' 
                     ? `${coupon.discount_value}%`
                     : `₹${coupon.discount_value}`}
                 </Badge>
               </TableCell>
               <TableCell>
                 {coupon.current_uses}/{coupon.max_uses || '∞'}
               </TableCell>
               <TableCell>
                 {coupon.valid_until 
                   ? format(new Date(coupon.valid_until), 'MMM d, yyyy')
                   : 'No expiry'}
               </TableCell>
               <TableCell>
                 {coupon.applicable_batches && coupon.applicable_batches.length > 0 ? (
                   <Badge variant="secondary">{coupon.applicable_batches.length} batches</Badge>
                 ) : (
                   <Badge>All batches</Badge>
                 )}
               </TableCell>
               <TableCell>
                 <Badge 
                   className={coupon.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}
                 >
                   {coupon.is_active ? 'Active' : 'Inactive'}
                 </Badge>
               </TableCell>
               <TableCell>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="sm">
                       <MoreVertical className="w-4 h-4" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => openEdit(coupon)}>
                       <Edit2 className="w-4 h-4 mr-2" /> Edit
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => toggleActive(coupon)}>
                       {coupon.is_active ? (
                         <><X className="w-4 h-4 mr-2" /> Deactivate</>
                       ) : (
                         <><Check className="w-4 h-4 mr-2" /> Activate</>
                       )}
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => deleteMutation.mutate(coupon.id)}
                       className="text-destructive"
                     >
                       <Trash2 className="w-4 h-4 mr-2" /> Delete
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </TableCell>
             </TableRow>
           ))}
           {(!coupons || coupons.length === 0) && (
             <TableRow>
               <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                 <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                 <p>No coupons created yet</p>
               </TableCell>
             </TableRow>
           )}
         </TableBody>
       </Table>
     </div>
   );
 }