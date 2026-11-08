import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StaffRolesProvider } from "@/hooks/useStaffRoles";
import AdminRoute from "@/components/AdminRoute";
import ProfileGuard from "@/components/ProfileGuard";
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const StaffAuthPage = lazy(() => import("./pages/StaffAuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TestLibrary = lazy(() => import("./pages/TestLibrary"));
const NormalTestInterface = lazy(() => import("./pages/NormalTestInterface"));
const NormalTestAnalysis = lazy(() => import("./pages/NormalTestAnalysis"));

const QuestionWiseAnalysis = lazy(() => import("./pages/QuestionWiseAnalysis"));

const Analytics = lazy(() => import("./pages/Analytics"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const QuestionBankPage = lazy(() => import("./pages/QuestionBankPage"));
const AnalysisPage = lazy(() => import("./pages/AnalysisPage"));
const SolutionsPage = lazy(() => import("./pages/SolutionsPage"));
const TestSeriesEnrollment = lazy(() => import("./pages/TestSeriesEnrollment"));
// Batch pages
const BatchCatalogPage = lazy(() => import("./pages/BatchCatalogPage"));
const BatchDetailsPage = lazy(() => import("./pages/BatchDetailsPage"));
const MyBatchesPage = lazy(() => import("./pages/MyBatchesPage"));
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistoryPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminQuestionBank = lazy(() => import("./pages/admin/AdminQuestionBank"));
const AdminTests = lazy(() => import("./pages/admin/AdminTests"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const TestCreator = lazy(() => import("./pages/admin/TestCreator"));
const TestEditor = lazy(() => import("./pages/admin/TestEditor"));
const NormalTestAnalytics = lazy(() => import("./pages/admin/NormalTestAnalytics"));
const TestManagement = lazy(() => import("./pages/admin/TestManagement"));
const StaffCommunity = lazy(() => import("./pages/admin/StaffCommunity"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const StaffRequests = lazy(() => import("./pages/admin/StaffRequests"));
const PhyNetixLibrary = lazy(() => import("./pages/admin/PhyNetixLibrary"));
const FullscreenTestEditor = lazy(() => import("./pages/admin/FullscreenTestEditor"));
const FinanceDashboard = lazy(() => import("./pages/admin/FinanceDashboard"));
const DPPManager = lazy(() => import("./pages/admin/DPPManager"));
const DPPEditor = lazy(() => import("./pages/admin/DPPEditor"));
const DPPPage = lazy(() => import("./pages/DPPPage"));
const DPPPractice = lazy(() => import("./pages/DPPPractice"));
const AcademicDashboard = lazy(() => import("./pages/admin/AcademicDashboard"));
const OperationsDashboard = lazy(() => import("./pages/admin/OperationsDashboard"));
const BatchManagement = lazy(() => import("./pages/admin/BatchManagement"));
const RoleSelectorPage = lazy(() => import("./pages/admin/RoleSelectorPage"));
const BulkImportPage = lazy(() => import("./pages/admin/BulkImportPage"));
const InstitutionsManager = lazy(() => import("./pages/admin/InstitutionsManager"));
const LiveMonitoring = lazy(() => import("./pages/admin/LiveMonitoring"));
const DevPortfolio = lazy(() => import("./pages/DevPortfolio"));
const RegisterInstitutePage = lazy(() => import("./pages/RegisterInstitutePage"));
import InstituteRoute from "@/components/institute/InstituteRoute";
const InstituteDashboard = lazy(() => import("./pages/institute/InstituteDashboard"));
const InstituteBatches = lazy(() => import("./pages/institute/InstituteBatches"));
const InstituteStudents = lazy(() => import("./pages/institute/InstituteStudents"));
const InstituteTests = lazy(() => import("./pages/institute/InstituteTests"));
const InstituteDPPs = lazy(() => import("./pages/institute/InstituteDPPs"));
const InstituteProctoring = lazy(() => import("./pages/institute/InstituteProctoring"));
const InstituteAuditLogs = lazy(() => import("./pages/institute/InstituteAuditLogs"));
const InstituteResults = lazy(() => import("./pages/institute/InstituteResults"));
const InstituteStaff = lazy(() => import("./pages/institute/InstituteStaff"));
const InstituteSettings = lazy(() => import("./pages/institute/InstituteSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StaffRolesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProfileGuard>
              <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] px-6 py-8"><div className="mx-auto max-w-6xl space-y-4"><div className="h-6 w-36 animate-pulse rounded bg-[#E9ECE7]" /><div className="h-32 animate-pulse rounded-lg bg-[#F0F1ED]" /><div className="h-56 animate-pulse rounded-lg bg-[#F0F1ED]" /></div></div>}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dev" element={<DevPortfolio />} />
                {/* Marketing/Pre-Login Pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/courses" element={<Navigate to="/batches" replace />} />
                <Route path="/course/:courseId" element={<CoursePage />} />
                <Route path="/pricing" element={<Navigate to="/batches" replace />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/refund" element={<RefundPage />} />
                {/* Test Series Enrollment */}
                <Route path="/enroll/:testSeriesId" element={<TestSeriesEnrollment />} />
                {/* Authentication Pages */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/staff-login" element={<StaffAuthPage />} />
                {/* Institute Management */}
                <Route path="/register-institute" element={<RegisterInstitutePage />} />
                <Route path="/institute" element={<InstituteRoute><InstituteDashboard /></InstituteRoute>} />
                <Route path="/institute/batches" element={<InstituteRoute><InstituteBatches /></InstituteRoute>} />
                <Route path="/institute/students" element={<InstituteRoute><InstituteStudents /></InstituteRoute>} />
                <Route path="/institute/tests" element={<InstituteRoute><InstituteTests /></InstituteRoute>} />
                <Route path="/institute/dpps" element={<InstituteRoute><InstituteDPPs /></InstituteRoute>} />
                <Route path="/institute/proctoring" element={<InstituteRoute><InstituteProctoring /></InstituteRoute>} />
                <Route path="/institute/audit" element={<InstituteRoute><InstituteAuditLogs /></InstituteRoute>} />
                <Route path="/institute/results" element={<InstituteRoute><InstituteResults /></InstituteRoute>} />
                <Route path="/institute/staff" element={<InstituteRoute><InstituteStaff /></InstituteRoute>} />
                <Route path="/institute/settings" element={<InstituteRoute><InstituteSettings /></InstituteRoute>} />

                {/* Role Selector */}
                <Route path="/admin/select-role" element={<AdminRoute><RoleSelectorPage /></AdminRoute>} />
                {/* Student Dashboard & Features */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tests" element={<TestLibrary />} />
                <Route path="/question-bank" element={<QuestionBankPage />} />
                <Route path="/test/:testId" element={<NormalTestInterface />} />
                <Route path="/test/:testId/analysis" element={<AnalysisPage />} />
                <Route path="/analysis/:testId" element={<AnalysisPage />} />
                <Route path="/solutions/:testId" element={<SolutionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/attempts" element={<Navigate to="/tests" replace />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* DPP Routes */}
                <Route path="/dpps" element={<DPPPage />} />
                <Route path="/dpp/:dppId" element={<DPPPractice />} />
                {/* Batch Pages - Student */}
                <Route path="/batches" element={<BatchCatalogPage />} />
                <Route path="/batches/:batchId" element={<BatchDetailsPage />} />
                <Route path="/my-batches" element={<MyBatchesPage />} />
                <Route path="/checkout/:batchId" element={<CheckoutPage />} />
                <Route path="/payments" element={<PaymentHistoryPage />} />
                {/* Admin Routes - All protected with AdminRoute */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/finance" element={<AdminRoute><FinanceDashboard /></AdminRoute>} />
                <Route path="/admin/academic" element={<AdminRoute><AcademicDashboard /></AdminRoute>} />
                <Route path="/admin/operations" element={<AdminRoute><OperationsDashboard /></AdminRoute>} />
                <Route path="/admin/batches" element={<AdminRoute><BatchManagement /></AdminRoute>} />
                <Route path="/admin/question-bank" element={<AdminRoute><AdminQuestionBank /></AdminRoute>} />
                <Route path="/admin/tests" element={<AdminRoute><AdminTests /></AdminRoute>} />
                <Route path="/admin/live-monitoring" element={<AdminRoute><LiveMonitoring /></AdminRoute>} />
                <Route path="/admin/test-creator" element={<AdminRoute><TestCreator /></AdminRoute>} />
                <Route path="/admin/test-editor/:testId" element={<AdminRoute><TestEditor /></AdminRoute>} />
                <Route path="/admin/test-analytics/:testId" element={<AdminRoute><NormalTestAnalytics /></AdminRoute>} />
                <Route path="/admin/test-management/:testId" element={<AdminRoute><TestManagement /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/community" element={<AdminRoute><StaffCommunity /></AdminRoute>} />
                <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
                <Route path="/admin/requests" element={<AdminRoute><StaffRequests /></AdminRoute>} />
                <Route path="/admin/phynetix-library" element={<AdminRoute><PhyNetixLibrary /></AdminRoute>} />
                <Route path="/admin/dpps" element={<AdminRoute><DPPManager /></AdminRoute>} />
                <Route path="/admin/dpp-editor/:dppId" element={<AdminRoute><DPPEditor /></AdminRoute>} />
                <Route path="/admin/fullscreen-editor/:testId" element={<AdminRoute><FullscreenTestEditor /></AdminRoute>} />
                <Route path="/admin/bulk-import" element={<AdminRoute><BulkImportPage /></AdminRoute>} />
                <Route path="/admin/institutions" element={<AdminRoute><InstitutionsManager /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ProfileGuard>
          </BrowserRouter>
        </TooltipProvider>
      </StaffRolesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
