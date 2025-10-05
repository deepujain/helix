import { SalesRegister } from "@/components/sales/sales-register";

export default function SalesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Daily Cylinder Sales</h1>
      </div>
      <SalesRegister />
    </div>
  );
}
