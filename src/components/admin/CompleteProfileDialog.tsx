import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Ghaziabad", "Prayagraj"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
};

interface CompleteProfileDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete: () => void;
  userId: string;
  existingName?: string;
  isGoogleUser?: boolean;
}

export default function CompleteProfileDialog({ 
  open, 
  onOpenChange,
  onComplete, 
  userId, 
  existingName,
  isGoogleUser 
}: CompleteProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: existingName || "",
    target_exam: "",
    academic_status: "",
    gender: "",
    phone: "",
    preferred_language: "english",
    state: "",
    city: "",
    coaching_type: "",
    coaching_name: "",
    telegram_id: "",
  });

  useEffect(() => {
    if (existingName) {
      setFormData(prev => ({ ...prev, full_name: existingName }));
    }
  }, [existingName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.full_name.trim() || !formData.target_exam || !formData.academic_status || !formData.gender) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          target_exam: formData.target_exam,
          academic_status: formData.academic_status,
          gender: formData.gender,
          phone: formData.phone || null,
          preferred_language: formData.preferred_language,
          state: formData.state || null,
          city: formData.city || null,
          coaching_type: formData.coaching_type || null,
          coaching_name: formData.coaching_name || null,
          telegram_id: formData.telegram_id || null,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Your profile has been saved successfully."
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const availableCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide the following information to get started. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Mandatory Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Required Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_exam">Target Exam *</Label>
                <Select value={formData.target_exam} onValueChange={(v) => setFormData({ ...formData, target_exam: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jee_main">JEE Main</SelectItem>
                    <SelectItem value="jee_advanced">JEE Advanced</SelectItem>
                    <SelectItem value="jee_main_advanced">JEE Mains + Advanced</SelectItem>
                    <SelectItem value="neet">NEET</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic_status">Academic Status *</Label>
                <Select value={formData.academic_status} onValueChange={(v) => setFormData({ ...formData, academic_status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_11">Class 11</SelectItem>
                    <SelectItem value="class_12">Class 12</SelectItem>
                    <SelectItem value="dropper">Dropper</SelectItem>
                    <SelectItem value="dropper_1plus">Dropper 1+ year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Optional Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Optional Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Select value={formData.preferred_language} onValueChange={(v) => setFormData({ ...formData, preferred_language: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v, city: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(v) => setFormData({ ...formData, city: v })}
                  disabled={!formData.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_id">Telegram ID</Label>
                <Input
                  id="telegram_id"
                  value={formData.telegram_id}
                  onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Academic Profiling */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Academic Profiling</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coaching_type">Coaching Type</Label>
                <Select value={formData.coaching_type} onValueChange={(v) => setFormData({ ...formData, coaching_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coaching type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Self Study)</SelectItem>
                    <SelectItem value="offline">Offline Coaching</SelectItem>
                    <SelectItem value="online">Online Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.coaching_type && formData.coaching_type !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="coaching_name">Coaching Name</Label>
                  <Input
                    id="coaching_name"
                    value={formData.coaching_name}
                    onChange={(e) => setFormData({ ...formData, coaching_name: e.target.value })}
                    placeholder="e.g., Allen, FIITJEE, Physics Wallah"
                  />
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}