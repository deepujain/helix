"use client";

import * as React from "react";
import { Package, PackageOpen, Users, TrendingUp, UserPlus, ArrowLeftRight, Undo2, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SalesByType } from "./sales-by-type";
import { TopEmployeesTable } from "./top-employees-table";
import { KpiCard, KpiCardSkeleton } from "./kpi-cards";
import { products } from "@/lib/data";
import type { Employee } from "@/lib/definitions";

type StockSummary = {
    totalFull: number;
    totalEmpty: number;
    totalDue: number;
};

type SalesSummary = {
    totalSales: number;
    newConnections: number;
};

type FlowSummary = {
    plantDispatch: number;
    customerReturns: number;
};

export function DashboardPage() {
    const [stockSummary, setStockSummary] = React.useState<StockSummary | null>(null);
    const [salesSummary, setSalesSummary] = React.useState<SalesSummary | null>(null);
    const [flowSummary, setFlowSummary] = React.useState<FlowSummary | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [employees, setEmployees] = React.useState<Employee[]>([]);

    // Load employees from API
    React.useEffect(() => {
        const loadEmployees = async () => {
            try {
                const response = await fetch('/api/employees');
                if (response.ok) {
                    const data = await response.json();
                    setEmployees(data);
                }
            } catch (error) {
                console.error("Error loading employees:", error);
                setEmployees([]);
            }
        };
        loadEmployees();
    }, []);

    React.useEffect(() => {
        // Simulate fetching data
        const timer = setTimeout(() => {
            setStockSummary({
                totalFull: Math.floor(Math.random() * 1000) + 500,
                totalEmpty: Math.floor(Math.random() * 800) + 300,
                totalDue: Math.floor(Math.random() * 100) + 10,
            });
            setSalesSummary({
                totalSales: Math.floor(Math.random() * 200) + 50,
                newConnections: Math.floor(Math.random() * 20) + 5,
            });
            setFlowSummary({
                plantDispatch: Math.floor(Math.random() * 400) + 100,
                customerReturns: Math.floor(Math.random() * 600) + 200,
            });
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const stockKpis = stockSummary ? [
        { title: "Total Full Cylinders", value: stockSummary.totalFull.toString(), Icon: Package, description: "Sum of all Full Closing Balances" },
        { title: "Total Empty Cylinders", value: stockSummary.totalEmpty.toString(), Icon: PackageOpen, description: "Sum of all Empty Closing Balances" },
        { title: "Total Due Cylinders", value: stockSummary.totalDue.toString(), Icon: Users, description: "Cylinders pending return" },
    ] : [];
    
    const salesKpis = salesSummary ? [
        { title: "Total Sales (Today)", value: salesSummary.totalSales.toString(), Icon: TrendingUp, description: "Total cylinders sold (Refill + New Connection)" },
        { title: "Total New Connections (Today)", value: salesSummary.newConnections.toString(), Icon: UserPlus, description: "Total new customer connections created" },
    ] : [];

    const flowKpis = flowSummary ? [
        { title: "Plant Dispatch Summary", value: flowSummary.plantDispatch.toString(), Icon: ArrowUp, description: "Total empty cylinders sent back to plant" },
        { title: "Customer Returns Summary", value: flowSummary.customerReturns.toString(), Icon: ArrowDown, description: "Total empties received from customers" },
    ] : [];

    const topSalesEmployees = React.useMemo(() => employees
        .map(e => ({ ...e, metric: Math.floor(Math.random() * 100) + 10 }))
        .sort((a,b) => b.metric - a.metric)
        .slice(0,5), []);

    const topDueEmployees = React.useMemo(() => employees
        .map(e => ({ ...e, metric: Math.floor(Math.random() * 20) }))
        .sort((a,b) => b.metric - a.metric)
        .slice(0,5), []);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
            
            <div className="space-y-8">
                {/* Stock Summary Section */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Stock Summary</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i}/>) 
                            : stockKpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                    </div>
                </div>

                {/* Sales & Distribution Section */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Sales & Distribution</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                        {isLoading ? Array.from({ length: 2 }).map((_, i) => <KpiCardSkeleton key={i}/>) 
                            : salesKpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                    </div>
                    <SalesByType products={products} isLoading={isLoading}/>
                </div>
                
                {/* Employee & Delivery Performance Section */}
                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Employee & Delivery Performance</h2>
                    <div className="grid gap-8 md:grid-cols-2">
                        <TopEmployeesTable title="Top 5 by Sales" metricLabel="Full Delivered" employees={topSalesEmployees} isLoading={isLoading} />
                        <TopEmployeesTable title="Top 5 by Dues" metricLabel="Cylinders Due" employees={topDueEmployees} isLoading={isLoading} />
                    </div>
                </div>

                {/* Flow & Movement Analytics Section */}
                 <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Flow & Movement Analytics</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                         {isLoading ? Array.from({ length: 2 }).map((_, i) => <KpiCardSkeleton key={i}/>) 
                            : flowKpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
