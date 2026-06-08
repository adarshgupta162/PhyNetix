import DashboardLayout from "@/components/layout/DashboardLayout";
import { BatchCatalog } from "@/components/batch/BatchCatalog";
import { motion } from "framer-motion";

export default function BatchCatalogPage() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Explore Batches</h1>
            <p className="text-muted-foreground">
              Find the perfect batch for your preparation journey
            </p>
          </div>

          <BatchCatalog showEnrollButtons={true} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
