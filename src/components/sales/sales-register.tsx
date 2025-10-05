"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { products, officeEmployee } from "@/lib/data";
import type { EmployeeSales, SalesRecord, PaymentEntry, Employee } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { addDays, subDays, format } from "date-fns";
import { cn } from "@/lib/utils";

type SalesData = { [employeeId: string]: EmployeeSales };
type PaymentType = "cash" | "digital" | "prepaid";

const productMap = Object.fromEntries(products.map(p => [p.id, p]));

export function SalesRegister() {
    const [date, setDate] = React.useState<Date>(new Date());
    const [salesData, setSalesData] = React.useState<SalesData>({});
    const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [activeEmployees, setActiveEmployees] = React.useState<Employee[]>([]);
    const { toast } = useToast();

    const dateString = format(date, 'yyyy-MM-dd');

    // Load employees from API
    React.useEffect(() => {
        const loadEmployees = async () => {
            try {
                const response = await fetch('/api/employees');
                if (response.ok) {
                    const data = await response.json();
                    setEmployees(data);
                    const active = data.filter((e: Employee) => e.status === 'active');
                    setActiveEmployees([officeEmployee, ...active]);
                }
            } catch (error) {
                console.error("Error loading employees:", error);
                setActiveEmployees([officeEmployee]);
            }
        };
        loadEmployees();
    }, []);

    const initializeData = React.useCallback(async (dateStr: string) => {
        if (activeEmployees.length === 0) return;
        
        try {
            const response = await fetch(`/api/sales?date=${dateStr}`);
            const record = response.ok ? await response.json() : null;
            
            const newData: SalesData = {};
            activeEmployees.forEach(emp => {
                const empSales = record?.sales?.find((s: EmployeeSales) => s.employeeId === emp.id);
                newData[emp.id] = {
                    employeeId: emp.id,
                    products: {}
                };
                products.forEach(prod => {
                    newData[emp.id].products[prod.id] = empSales?.products[prod.id] || {
                        cash: { nos: 0, amount: 0 },
                        digital: { nos: 0, amount: 0 },
                        prepaid: { nos: 0, amount: 0 },
                    };
                });
            });
            setSalesData(newData);
        } catch (error) {
            console.error("Error loading sales data:", error);
            // Initialize with empty data on error
            const newData: SalesData = {};
            activeEmployees.forEach(emp => {
                newData[emp.id] = {
                    employeeId: emp.id,
                    products: {}
                };
                products.forEach(prod => {
                    newData[emp.id].products[prod.id] = {
                        cash: { nos: 0, amount: 0 },
                        digital: { nos: 0, amount: 0 },
                        prepaid: { nos: 0, amount: 0 },
                    };
                });
            });
            setSalesData(newData);
        }
    }, [activeEmployees]);

    React.useEffect(() => {
        initializeData(dateString);
    }, [dateString, initializeData]);
    
    // Debounce saving
    React.useEffect(() => {
        if (Object.keys(salesData).length === 0 || savingStatus !== 'saving') {
            return;
        }

        const handler = setTimeout(async () => {
            const recordToSave: SalesRecord = {
                date: dateString,
                sales: Object.values(salesData),
            };
            
            try {
                const response = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recordToSave),
                });

                if (!response.ok) {
                    throw new Error('Failed to save');
                }

                console.log("Sales data saved successfully to database");
                setSavingStatus('saved');
                toast({
                    title: "Auto-saved!",
                    description: `Sales data for ${format(date, 'PPP')} has been saved.`,
                });
            } catch (error) {
                console.error("Error saving sales data:", error);
                toast({
                    title: "Save Failed",
                    description: "Could not save sales data. Please try again.",
                    variant: "destructive",
                });
                setSavingStatus('idle');
            }
            
            setTimeout(() => setSavingStatus('idle'), 2000);
        }, 1500);

        return () => clearTimeout(handler);
    }, [salesData, dateString, savingStatus, toast, date]);


    const handleInputChange = (employeeId: string, productId: string, paymentType: PaymentType, value: string) => {
        const nos = Number(value) || 0;
        const productCost = productMap[productId]?.unitCost || 0;
        const amount = nos * productCost;

        setSalesData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const paymentEntry = newData[employeeId].products[productId][paymentType] as PaymentEntry;
            paymentEntry.nos = nos;
            paymentEntry.amount = amount;
            return newData;
        });
        setSavingStatus('saving');
    };
    
    const copyPreviousDay = async () => {
        if (activeEmployees.length === 0) return;
        
        const prevDate = subDays(date, 1);
        const prevDateString = format(prevDate, 'yyyy-MM-dd');
        
        try {
            const response = await fetch(`/api/sales?date=${prevDateString}`);
            const prevRecord = response.ok ? await response.json() : null;

            if (prevRecord && prevRecord.sales) {
                const newData: SalesData = {};
                activeEmployees.forEach(emp => {
                    const empSales = prevRecord.sales.find((s: EmployeeSales) => s.employeeId === emp.id);
                    newData[emp.id] = {
                        employeeId: emp.id,
                        products: {}
                    };
                    products.forEach(prod => {
                        newData[emp.id].products[prod.id] = empSales?.products[prod.id] || {
                            cash: { nos: 0, amount: 0 },
                            digital: { nos: 0, amount: 0 },
                            prepaid: { nos: 0, amount: 0 },
                        };
                    });
                });
                setSalesData(newData);
                setSavingStatus('saving');
                toast({
                    title: "Copied!",
                    description: `Data from ${format(prevDate, 'PPP')} copied successfully.`,
                });
            } else {
                toast({
                    title: "No data found",
                    description: `No sales data found for ${format(prevDate, 'PPP')}.`,
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error("Error copying previous day:", error);
            toast({
                title: "Error",
                description: "Failed to copy previous day's data.",
                variant: 'destructive'
            });
        }
    };
    
    const formatCurrency = (amount: number) => {
        return `₹${amount.toFixed(2)}`;
    }
    
    const grandTotals = React.useMemo(() => {
        const totals = { totalNos: 0, totalAmount: 0 };
        Object.values(salesData).forEach(empSales => {
            Object.values(empSales.products).forEach(prodSales => {
                const totalNosForProd = prodSales.cash.nos + prodSales.digital.nos + prodSales.prepaid.nos;
                const totalAmountForProd = prodSales.cash.amount + prodSales.digital.amount + prodSales.prepaid.amount;
                totals.totalNos += totalNosForProd;
                totals.totalAmount += totalAmountForProd;
            });
        });
        return totals;
    }, [salesData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setDate(subDays(date, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(date, 'PPP')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={copyPreviousDay}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Previous Day
                    </Button>
                    <div className="text-sm text-muted-foreground w-20 text-right">
                        {savingStatus === 'saving' && "Saving..."}
                        {savingStatus === 'saved' && "Saved."}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
                <Table className="min-w-max">
                    <TableHeader>
                        <TableRow className="bg-muted/50 text-xs">
                            <TableHead className="sticky left-0 bg-muted/95 z-10 w-[200px]">Delivery Boy 👷</TableHead>
                            {products.map((p) => (
                                <TableHead key={p.id} colSpan={6} className="text-center border-x">{p.name}</TableHead>
                            ))}
                            <TableHead colSpan={2} className="text-center border-l">Grand Total</TableHead>
                        </TableRow>
                        <TableRow className="text-xs">
                             <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                            {products.map((p) => (
                                <React.Fragment key={`${p.id}-details`}>
                                    <TableHead className="text-center border-l">Cash Nos</TableHead>
                                    <TableHead className="text-center">Cash ₹</TableHead>
                                    <TableHead className="text-center">Digital Nos</TableHead>
                                    <TableHead className="text-center">Digital ₹</TableHead>
                                    <TableHead className="text-center">Prepaid Nos</TableHead>
                                    <TableHead className="text-center border-r">Prepaid ₹</TableHead>
                                </React.Fragment>
                            ))}
                            <TableHead className="text-center border-l">Total Nos</TableHead>
                            <TableHead className="text-center">Total ₹</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeEmployees.map((employee) => {
                            const empData = salesData[employee.id];
                            if (!empData) return null;

                            const employeeTotals = Object.values(empData.products).reduce((acc, p) => {
                                acc.totalNos += p.cash.nos + p.digital.nos + p.prepaid.nos;
                                acc.totalAmount += p.cash.amount + p.digital.amount + p.prepaid.amount;
                                return acc;
                            }, { totalNos: 0, totalAmount: 0 });

                            return (
                                <TableRow key={employee.id} className="text-sm">
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people avatar"/>
                                                <AvatarFallback>{employee.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            {employee.name}
                                        </div>
                                    </TableCell>
                                    {products.map((product) => {
                                        const prodSales = empData.products[product.id];
                                        if (!prodSales) return <TableCell colSpan={6} key={product.id}></TableCell>;
                                        return (
                                             <React.Fragment key={`${employee.id}-${product.id}`}>
                                                <TableCell className="border-l">
                                                    <Input type="number" className="w-16 h-8 text-center" value={prodSales.cash.nos} onChange={(e) => handleInputChange(employee.id, product.id, 'cash', e.target.value)} />
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(prodSales.cash.amount)}</TableCell>
                                                <TableCell>
                                                     <Input type="number" className="w-16 h-8 text-center" value={prodSales.digital.nos} onChange={(e) => handleInputChange(employee.id, product.id, 'digital', e.target.value)} />
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(prodSales.digital.amount)}</TableCell>
                                                <TableCell>
                                                    <Input type="number" className="w-16 h-8 text-center" value={prodSales.prepaid.nos} onChange={(e) => handleInputChange(employee.id, product.id, 'prepaid', e.target.value)} />
                                                </TableCell>
                                                <TableCell className="border-r text-right">{formatCurrency(prodSales.prepaid.amount)}</TableCell>
                                             </React.Fragment>
                                        )
                                    })}
                                    <TableCell className="font-bold border-l text-center">{employeeTotals.totalNos}</TableCell>
                                    <TableCell className="font-bold text-right">{formatCurrency(employeeTotals.totalAmount)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50 font-bold text-sm">
                            <TableCell className="sticky left-0 bg-muted/95 z-10">Total</TableCell>
                            {products.map(product => {
                                const productTotals = Object.values(salesData).reduce((acc, emp) => {
                                    const prodSales = emp.products[product.id];
                                    if (prodSales) {
                                        acc.cashNos += prodSales.cash.nos;
                                        acc.cashAmount += prodSales.cash.amount;
                                        acc.digitalNos += prodSales.digital.nos;
                                        acc.digitalAmount += prodSales.digital.amount;
                                        acc.prepaidNos += prodSales.prepaid.nos;
                                        acc.prepaidAmount += prodSales.prepaid.amount;
                                    }
                                    return acc;
                                }, { cashNos: 0, cashAmount: 0, digitalNos: 0, digitalAmount: 0, prepaidNos: 0, prepaidAmount: 0 });

                                return (
                                    <React.Fragment key={`${product.id}-totals`}>
                                        <TableCell className="border-l text-center">{productTotals.cashNos}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(productTotals.cashAmount)}</TableCell>
                                        <TableCell className="text-center">{productTotals.digitalNos}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(productTotals.digitalAmount)}</TableCell>
                                        <TableCell className="text-center">{productTotals.prepaidNos}</TableCell>
                                        <TableCell className="border-r text-right">{formatCurrency(productTotals.prepaidAmount)}</TableCell>
                                    </React.Fragment>
                                )
                            })}
                            <TableCell className="border-l text-center">{grandTotals.totalNos}</TableCell>
                            <TableCell className="text-right">{formatCurrency(grandTotals.totalAmount)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    );
}
