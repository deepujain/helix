
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/data";
import type { DailyRecord, DailyStockEntry, StockEntry, Employee } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";

type StockTableData = { [employeeId: string]: DailyStockEntry };

interface StockTableProps {
    selectedDate: Date;
    onDataChange: (data: DailyRecord) => void;
}

export function StockTable({ selectedDate, onDataChange }: StockTableProps) {
    const [data, setData] = React.useState<StockTableData>({});
    const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
    const [activeEmployees, setActiveEmployees] = React.useState<Employee[]>([]);
    const { toast } = useToast();

    const dateString = selectedDate.toISOString().split('T')[0];

    // Load employees from API
    React.useEffect(() => {
        const loadEmployees = async () => {
            try {
                const response = await fetch('/api/employees');
                if (response.ok) {
                    const allEmployees = await response.json();
                    const active = allEmployees.filter((e: Employee) => e.status === 'active');
                    setActiveEmployees(active);
                }
            } catch (error) {
                console.error("Error loading employees:", error);
                setActiveEmployees([]);
            }
        };
        loadEmployees();
    }, []);

    React.useEffect(() => {
        // Load data from API
        const loadData = async () => {
            if (activeEmployees.length === 0) return;
            
            try {
                const response = await fetch(`/api/stock?date=${dateString}`);
                const todayRecord = response.ok ? await response.json() : null;
                const newData: StockTableData = {};

                activeEmployees.forEach(emp => {
                    const existingEntry = todayRecord?.entries?.find((e: DailyStockEntry) => e.employeeId === emp.id);
                    newData[emp.id] = {
                        employeeId: emp.id,
                        products: {},
                        notes: existingEntry?.notes || ""
                    };
                    products.forEach(prod => {
                        const productEntry = existingEntry?.products[prod.id] || {
                            fullGiven: 0,
                            emptyCollected: 0,
                            newConnection: 0,
                            due: 0,
                        };
                        productEntry.due = productEntry.fullGiven - productEntry.emptyCollected - productEntry.newConnection;
                        newData[emp.id].products[prod.id] = productEntry;
                    });
                });
                setData(newData);
            } catch (error) {
                console.error("Error loading stock data:", error);
                // Initialize with empty data on error
                const newData: StockTableData = {};
                activeEmployees.forEach(emp => {
                    newData[emp.id] = {
                        employeeId: emp.id,
                        products: {},
                        notes: ""
                    };
                    products.forEach(prod => {
                        newData[emp.id].products[prod.id] = {
                            fullGiven: 0,
                            emptyCollected: 0,
                            newConnection: 0,
                            due: 0,
                        };
                    });
                });
                setData(newData);
            }
        };
        loadData();
    }, [dateString, activeEmployees]);
    
    
    // Debounce saving
    React.useEffect(() => {
        if (Object.keys(data).length === 0 || savingStatus !== 'saving') {
            return;
        }

        const handler = setTimeout(async () => {
            try {
                // Get existing inventory data
                const response = await fetch(`/api/stock?date=${dateString}`);
                const existingRecord: DailyRecord | null = response.ok ? await response.json() : null;
                
                const recordToSave: DailyRecord = {
                    date: dateString,
                    entries: Object.values(data),
                    inventoryFull: existingRecord?.inventoryFull,
                    inventoryEmpty: existingRecord?.inventoryEmpty,
                };
                
                const saveResponse = await fetch('/api/stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recordToSave),
                });

                if (!saveResponse.ok) {
                    throw new Error('Failed to save');
                }

                onDataChange(recordToSave);
                console.log("Delivery data saved successfully to database");
                
                setSavingStatus('saved');
                toast({
                    title: "Save Successful",
                    description: "Your changes have been saved.",
                    variant: 'default',
                });
            } catch (error) {
                console.error("Error saving stock data:", error);
                toast({
                    title: "Save Failed",
                    description: "Could not save stock data. Please try again.",
                    variant: "destructive",
                });
                setSavingStatus('idle');
            }
            
            setTimeout(() => setSavingStatus('idle'), 2000);
        }, 1000); // 1-second debounce

        return () => {
            clearTimeout(handler);
        };
    }, [data, dateString, onDataChange, savingStatus, toast]);


    const handleInputChange = (employeeId: string, productId: string, field: keyof Omit<StockEntry, 'due'>, value: string | number) => {
        setData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const productEntry = newData[employeeId].products[productId];
            (productEntry as any)[field] = Number(value);
            productEntry.due = productEntry.fullGiven - productEntry.emptyCollected - productEntry.newConnection;
            return newData;
        });
        setSavingStatus('saving');
    };
    
    const handleNotesChange = (employeeId: string, value: string) => {
        setData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            newData[employeeId].notes = value;
            return newData;
        });
        setSavingStatus('saving');
    }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
            <TableHeader>
                 <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] row-span-2 border-r" rowSpan={2}>Employee</TableHead>
                    {products.map((p) => (
                        <TableHead key={p.id} colSpan={4} className="text-center border-x">{p.name}</TableHead>
                    ))}
                    <TableHead className="row-span-2 border-l" rowSpan={2}>Notes</TableHead>
                 </TableRow>
                <TableRow>
                    {products.map((p) => (
                    <React.Fragment key={`${p.id}-details`}>
                        <TableHead className="text-center">Full</TableHead>
                        <TableHead className="text-center">Empty</TableHead>
                        <TableHead className="text-center">New</TableHead>
                        <TableHead className="text-center border-r">Due</TableHead>
                    </React.Fragment>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {activeEmployees.map((employee) => (
                <TableRow key={employee.id}>
                    <TableCell className="font-medium border-r">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-8 w-8">
                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people avatar"/>
                                <AvatarFallback>{employee.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            {employee.name} 
                        </div>
                    </TableCell>
                    {products.map((product) => (
                    <React.Fragment key={product.id}>
                        <TableCell>
                        <Input
                            type="number"
                            className="w-20 text-center"
                            value={data[employee.id]?.products[product.id]?.fullGiven ?? 0}
                            onChange={(e) => handleInputChange(employee.id, product.id, 'fullGiven', e.target.value)}
                        />
                        </TableCell>
                        <TableCell>
                        <Input
                            type="number"
                            className="w-20 text-center"
                            value={data[employee.id]?.products[product.id]?.emptyCollected ?? 0}
                            onChange={(e) => handleInputChange(employee.id, product.id, 'emptyCollected', e.target.value)}
                        />
                        </TableCell>
                        <TableCell>
                         <Input
                            type="number"
                            className="w-20 text-center"
                            value={data[employee.id]?.products[product.id]?.newConnection ?? 0}
                            onChange={(e) => handleInputChange(employee.id, product.id, 'newConnection', e.target.value)}
                        />
                        </TableCell>
                        <TableCell className="border-r text-center">
                            <span className="w-20 font-medium">{data[employee.id]?.products[product.id]?.due ?? 0}</span>
                        </TableCell>
                    </React.Fragment>
                    ))}
                    <TableCell>
                    <Textarea 
                        placeholder="Add notes..." 
                        className="min-w-[200px]"
                        value={data[employee.id]?.notes ?? ''}
                        onChange={(e) => handleNotesChange(employee.id, e.target.value)}
                    />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
        <div className="p-4 flex justify-end items-center gap-2 text-sm text-muted-foreground">
            {savingStatus === 'saving' && "Saving..."}
            {savingStatus === 'saved' && "Saved."}
        </div>
    </div>
  );
}
