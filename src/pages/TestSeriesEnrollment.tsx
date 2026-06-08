import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Trophy,
  Users,
  Tag,
  X,
  Sparkles,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Shield,
  Zap,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Gift,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data
const testSeriesData = {
  "jee-main-2026": {
    id: "jee-main-2026",
    title: "JEE Main 2026 Test Series",
    subtitle: "February Batch",
    description: "Complete Test Series for JEE Main 2026 - Full Syllabus & PYQs as Mocks",
    features: [
      "30 Full Tests (Video & Textual Solutions)",
      "15 RPYQs (Recent Previous Year Questions)",
      "12 Part Tests for focused practice",
      "Chapter-wise Tests for all topics",
      "All attempts of JEE Main 2026",
      "Live doubt solving sessions",
      "Performance analytics dashboard",
      "Mobile app access"
    ],
    validTill: "All attempts of JEE Main 2026 - 2025 PYQs as Mocks",
    originalPrice: 12000,
    discount: 6000,
    finalPrice: 6000,
    couponCode: "CHAMPS26",
    couponMessage: "Valid till next Sunday!",
    logo: "/logos/test-series/jee-main.png",
    offerEndsIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    studentsEnrolled: 25430,
    rating: 4.8,
    reviews: 3240
  }
};

const testimonials = [
  {
    name: "Rahul Sharma",
    rank: "AIR 245",
    exam: "JEE Main 2025",
    image: "👨‍🎓",
    text: "PhyNetix test series helped me identify my weak areas. The detailed analysis after each test was game-changing!",
    rating: 5
  },
  {
    name: "Priya Patel",
    rank: "AIR 567",
    exam: "JEE Main 2025",
    image: "👩‍🎓",
    text: "Best test series I've used. The question quality matches exactly with JEE Main pattern. Highly recommended!",
    rating: 5
  },
  {
    name: "Ankit Kumar",
    rank: "AIR 892",
    exam: "JEE Main 2025",
    image: "👨‍🎓",
    text: "The video solutions are incredible. Every concept is explained in detail. Worth every penny!",
    rating: 5
  }
];

const faqs = [
  {
    question: "When will I get access after enrollment?",
    answer: "You'll get instant access to the complete test series immediately after successful payment. Login credentials will be sent to your registered email."
  },
  {
    question: "Can I access tests on mobile?",
    answer: "Yes! Our platform is fully responsive and works seamlessly on mobile, tablet, and desktop. We also have a dedicated mobile app for Android and iOS."
  },
  {
    question: "Are solutions provided for all questions?",
    answer: "Absolutely! Every question comes with detailed step-by-step solutions in both video and text format, explained by expert faculty."
  },
  {
    question: "What if I need help during preparation?",
    answer: "We offer 24/7 doubt support through WhatsApp, email, and live chat. You can also join our weekly live doubt sessions with expert teachers."
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with the course within 7 days, you can request a full refund."
  }
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const paymentMethods = [
  { icon: CreditCard, name: "Credit/Debit Card", supported: true },
  { icon: Smartphone, name: "UPI (GPay, PhonePe, Paytm)", supported: true },
  { icon: Wallet, name: "Net Banking", supported: true },
  { icon: Wallet, name: "Wallets", supported: true },
];

export default function TestSeriesEnrollment() {
  const { testSeriesId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const testSeries = testSeriesData[testSeriesId as keyof typeof testSeriesData];

  const [formData, setFormData] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem(`enrollment_${testSeriesId}`);
    return saved ? JSON.parse(saved) : {
      studentName: "",
      studentEmail: "",
      confirmEmail: "",
      mobileNumber: "",
      class: "",
      country: "India",
      state: "",
      city: "",
      couponCode: "",
      referralCode: "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Auto-save form to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`enrollment_${testSeriesId}`, JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, testSeriesId]);

  // Countdown timer for offer
  useEffect(() => {
    if (!testSeries?.offerEndsIn) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = testSeries.offerEndsIn.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testSeries]);

  // Testimonial carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!testSeries) {
      toast({
        title: "Test series not found",
        description: "Redirecting to home page...",
        variant: "destructive",
      });
      setTimeout(() => navigate("/"), 2000);
    }
  }, [testSeries, navigate, toast]);

  if (!testSeries) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "studentName":
        if (!value.trim()) error = "Name is required";
        else if (value.trim().length < 3) error = "Name must be at least 3 characters";
        break;
      case "studentEmail":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      case "confirmEmail":
        if (value !== formData.studentEmail) error = "Emails do not match";
        break;
      case "mobileNumber":
        if (!value) error = "Mobile number is required";
        else if (!/^[6-9]\d{9}$/.test(value)) error = "Invalid mobile number";
        break;
      case "class":
        if (!value) error = "Please select your class";
        break;
      case "state":
        if (formData.country === "India" && !value) error = "Please select your state";
        break;
      case "city":
        if (!value) error = "City is required";
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const handleApplyCoupon = () => {
    if (formData.couponCode.toUpperCase() === testSeries.couponCode) {
      setAppliedCoupon(formData.couponCode);
      setDiscountApplied(true);
      toast({
        title: "🎉 Coupon applied successfully!",
        description: `You saved ₹${testSeries.discount.toLocaleString()}`,
      });
    } else {
      toast({
        title: "Invalid coupon code",
        description: "Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearCoupon = () => {
    setFormData({ ...formData, couponCode: "" });
    setAppliedCoupon("");
    setDiscountApplied(false);
  };

  const handleSendOtp = () => {
    if (!formData.mobileNumber || errors.mobileNumber) {
      toast({
        title: "Please enter a valid mobile number",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending OTP
    setShowOtpModal(true);
    toast({
      title: "OTP sent successfully",
      description: `Verification code sent to ${formData.mobileNumber}`,
    });
  };

  const handleVerifyOtp = () => {
    // Simulate OTP verification (in real app, verify with backend)
    if (otp === "123456" || otp.length === 6) {
      setOtpVerified(true);
      setShowOtpModal(false);
      toast({
        title: "✓ Mobile number verified",
        description: "You can now proceed with enrollment",
      });
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please check and try again",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const fieldsToValidate = ["studentName", "studentEmail", "confirmEmail", "mobileNumber", "class", "state", "city"];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData])) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast({
        title: "Please fix all errors",
        description: "Check the form for invalid fields",
        variant: "destructive",
      });
      return;
    }

    if (!otpVerified) {
      toast({
        title: "Please verify your mobile number",
        variant: "destructive",
      });
      return;
    }

    // Clear saved form data
    localStorage.removeItem(`enrollment_${testSeriesId}`);

    // TODO: Integration with payment gateway
    toast({
      title: "🎉 Enrollment initiated!",
      description: "Redirecting to secure payment...",
    });

    console.log("Form submitted:", formData);
    // Redirect to payment gateway
  };

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-primary/20 top-20 -left-48" />
        <div className="floating-orb w-80 h-80 bg-accent/20 top-1/2 -right-40" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display gradient-text">PhyNetix</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>  
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Countdown Banner */}
      {timeLeft.days > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3"
        >
          <div className="container mx-auto px-4 flex items-center justify-center gap-6 flex-wrap">
            <span className="font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Limited Time Offer Ends In:
            </span>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-bold text-2xl">{timeLeft.days}</div>
                <div className="text-xs opacity-90">Days</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="text-center">
                <div className="font-bold text-2xl">{timeLeft.hours}</div>
                <div className="text-xs opacity-90">Hours</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="text-center">
                <div className="font-bold text-2xl">{timeLeft.minutes}</div>
                <div className="text-xs opacity-90">Mins</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="text-center">
                <div className="font-bold text-2xl">{timeLeft.seconds}</div>
                <div className="text-xs opacity-90">Secs</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8"
            >
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
                  {testSeries.title}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-muted-foreground">{testSeries.subtitle}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn(
                          "w-4 h-4",
                          i < Math.floor(testSeries.rating) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                        )} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{testSeries.rating}</span>
                    <span className="text-sm text-muted-foreground">({testSeries.reviews} reviews)</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{testSeries.studentsEnrolled.toLocaleString()} students already enrolled</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Name */}
                <div className="space-y-2">
                  <Label htmlFor="studentName">
                    Student Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    placeholder="Enter full name"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange("studentName", e.target.value)}
                    className={errors.studentName ? "border-destructive" : ""}
                  />
                  {errors.studentName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.studentName}
                    </p>
                  )}
                </div>

                {/* Student Email */}
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">
                    Student's Email <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (for login & updates)
                    </span>
                  </Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.studentEmail}
                    onChange={(e) => handleInputChange("studentEmail", e.target.value)}
                    className={errors.studentEmail ? "border-destructive" : ""}
                  />
                  {errors.studentEmail && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.studentEmail}
                    </p>
                  )}
                </div>

                {/* Confirm Email */}
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">
                    Confirm Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="Re-enter email address"
                    value={formData.confirmEmail}
                    onChange={(e) => handleInputChange("confirmEmail", e.target.value)}
                    className={errors.confirmEmail ? "border-destructive" : ""}
                  />
                  {errors.confirmEmail && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.confirmEmail}
                    </p>
                  )}
                </div>

                {/* Mobile Number with OTP */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <Input value="+91" disabled className="text-center" />
                    </div>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="10-digit mobile"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                      className={cn(
                        errors.mobileNumber && "border-destructive",
                        otpVerified && "border-success"
                      )}
                      maxLength={10}
                      disabled={otpVerified}
                    />
                    {!otpVerified ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={!!errors.mobileNumber || !formData.mobileNumber}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" disabled className="bg-success/10 border-success text-success">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verified
                      </Button>
                    )}
                  </div>
                  {errors.mobileNumber && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.mobileNumber}
                    </p>
                  )}
                  {otpVerified && (
                    <p className="text-sm text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Mobile number verified successfully
                    </p>
                  )}
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <Label htmlFor="class">
                    Class <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => handleInputChange("class", value)}
                  >
                    <SelectTrigger id="class" className={errors.class ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select Your Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Class 10</SelectItem>
                      <SelectItem value="11">Class 11</SelectItem>
                      <SelectItem value="12">Class 12</SelectItem>
                      <SelectItem value="12-pass">Class 12 Pass</SelectItem>
                      <SelectItem value="dropper">Dropper</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.class && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.class}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* State (India only) */}
                {formData.country === "India" && (
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleInputChange("state", value)}
                    >
                      <SelectTrigger id="state" className={errors.state ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                )}

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referralCode">
                    Referral Code <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="referralCode"
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => handleInputChange("referralCode", e.target.value.toUpperCase())}
                    />
                    <Button type="button" variant="outline">
                      <Gift className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get ₹500 off by using a friend's referral code
                  </p>
                </div>

                {/* Coupon Code */}
                <div className="space-y-2">
                  <Label htmlFor="couponCode">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="couponCode"
                      placeholder={testSeries.couponCode}
                      value={formData.couponCode}
                      onChange={(e) => handleInputChange("couponCode", e.target.value.toUpperCase())}
                      disabled={discountApplied}
                    />
                    {!discountApplied ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={!formData.couponCode}
                      >
                        Apply
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearCoupon}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-success flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Coupon "{appliedCoupon}" applied! You saved ₹{testSeries.discount.toLocaleString()}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                >
                  Proceed to Payment →
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </motion.div>

            {/* Testimonials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                What Our Top Rankers Say
              </h3>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                      {testimonials[currentTestimonial].image}
                    </div>
                    <div>
                      <div className="font-bold">{testimonials[currentTestimonial].name}</div>
                      <div className="text-sm text-primary font-medium">{testimonials[currentTestimonial].rank}</div>
                      <div className="text-xs text-muted-foreground">{testimonials[currentTestimonial].exam}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonials[currentTestimonial].text}"</p>
                  <div className="flex items-center gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-center gap-2 mt-4">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentTestimonial ? "bg-primary w-6" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
            {/* Test Series Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{testSeries.title}</h3>
                  <p className="text-sm text-muted-foreground">{testSeries.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-sm">What's Included:</h4>
                {testSeries.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Valid Till */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm">{testSeries.validTill}</span>
              </div>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4">Price Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span className="line-through text-muted-foreground">
                    ₹{testSeries.originalPrice.toLocaleString()}
                  </span>
                </div>

                {discountApplied && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between text-success"
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount Applied:
                    </span>
                    <span className="font-medium">- ₹{testSeries.discount.toLocaleString()}</span>
                  </motion.div>
                )}

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Total Amount:</span>
                    <span className="font-bold text-2xl gradient-text">
                      ₹{(discountApplied ? testSeries.finalPrice : testSeries.originalPrice).toLocaleString()}
                    </span>
                  </div>
                  {discountApplied && (
                    <p className="text-xs text-success text-right">
                      You save ₹{testSeries.discount.toLocaleString()} ({Math.round((testSeries.discount / testSeries.originalPrice) * 100)}%)
                    </p>
                  )}
                </div>
              </div>

              {!discountApplied && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-600 mb-1">
                        Limited Time: Save ₹{testSeries.discount.toLocaleString()}!
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Use code <span className="font-mono font-bold text-foreground">{testSeries.couponCode}</span> at checkout
                      </p>
                      <p className="text-xs text-orange-600">{testSeries.couponMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm mb-3">Accepted Payment Methods:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-xs"
                    >
                      <method.icon className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{method.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h4 className="font-semibold mb-4">Why Choose PhyNetix?</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">50,000+ Students</p>
                    <p className="text-xs text-muted-foreground">Trust our platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">99% Success Rate</p>
                    <p className="text-xs text-muted-foreground">Students achieving goals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">7-Day Money Back</p>
                    <p className="text-xs text-muted-foreground">100% refund guarantee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Expert Solutions</p>
                    <p className="text-xs text-muted-foreground">Video & text explanations</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Support Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h4 className="font-semibold mb-4">Need Help?</h4>
              <div className="space-y-3">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div className="text-sm">
                    <div className="font-medium">WhatsApp Support</div>
                    <div className="text-xs text-muted-foreground">Get instant help</div>
                  </div>
                </a>
                <a
                  href="mailto:support@phynetix.me"
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">Email Us</div>
                    <div className="text-xs text-muted-foreground">support@phynetix.me</div>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-xl mb-2">Verify Mobile Number</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the 6-digit OTP sent to +91 {formData.mobileNumber}
              </p>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowOtpModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6}
                  >
                    Verify OTP
                  </Button>
                </div>
                <button
                  className="text-sm text-primary hover:underline w-full text-center"
                  onClick={handleSendOtp}
                >
                  Resend OTP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/919876543210"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </motion.a>
    </div>
  );
}