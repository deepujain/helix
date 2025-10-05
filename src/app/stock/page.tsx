
"use client";

import * as React from "react";
import { StockTable } from "@/components/stock/stock-table";
import { DataImportSection } from "@/components/stock/data-import-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { addDays, subDays } from "date-fns";
import { products } from "@/lib/data";
import type { DailyRecord } from "@/lib/definitions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InventoryData = {
  openingStock: number;
  received: number;
  refill: number;
  nc: number;
};

type InventoryEmptyData = {
  openingStock: number;
  received: number;
  transferOut: number;
  defective: number;
  plantDispatch: number;
};


type InventoryFullData = {
  [productId: string]: InventoryData;
};

type InventoryEmptyFullData = {
    [productId: string]: InventoryEmptyData;
}

type DailyInventoryMap = { [date: string]: InventoryFullData };
type DailyEmptyInventoryMap = { [date: string]: InventoryEmptyFullData };

export default function StockPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [dailyData, setDailyData] = React.useState<DailyRecord | undefined>(undefined);
  
  const [dailyInventory, setDailyInventory] = React.useState<DailyInventoryMap>({});
  const [dailyEmptyInventory, setDailyEmptyInventory] = React.useState<DailyEmptyInventoryMap>({});
  const [inventorySaving, setInventorySaving] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  React.useEffect(() => {
    // Set initial date only on client side to avoid hydration error
    if (!date) {
      setDate(new Date());
    }
  }, [date]);

  const dateString = date ? date.toISOString().split('T')[0] : '';
  
  // Load inventory data from API
  React.useEffect(() => {
    const loadInventoryData = async () => {
      if (!date) return;
      
      const dString = date.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/stock?date=${dString}`);
        const record: DailyRecord | null = response.ok ? await response.json() : null;
        
        // --- Full Inventory ---
        if (record?.inventoryFull) {
          setDailyInventory(prev => ({ ...prev, [dString]: record.inventoryFull! }));
        } else if (!dailyInventory[dString]) {
          // Calculate from previous day
          const prevDate = new Date(date);
          prevDate.setDate(date.getDate() - 1);
          const prevDateString = prevDate.toISOString().split('T')[0];
          
          // Try to load previous day from API
          const prevResponse = await fetch(`/api/stock?date=${prevDateString}`);
          const prevRecord: DailyRecord | null = prevResponse.ok ? await prevResponse.json() : null;
          const prevDateInventory = prevRecord?.inventoryFull || dailyInventory[prevDateString] || {};
          
          const newInventoryDataForDate: InventoryFullData = {};
          products.forEach(p => {
            const prevInventory = prevDateInventory[p.id] || { openingStock: 0, received: 0, refill: 0, nc: 0 };
            const prevTotalSales = prevInventory.refill + prevInventory.nc;
            const prevClosingBalance = prevInventory.openingStock + prevInventory.received - prevTotalSales;

            newInventoryDataForDate[p.id] = {
              openingStock: prevClosingBalance,
              received: 0,
              refill: 0,
              nc: 0,
            };
          });
          setDailyInventory(prev => ({ ...prev, [dString]: newInventoryDataForDate }));
        }

        // --- Empty Inventory ---
        if (record?.inventoryEmpty) {
          setDailyEmptyInventory(prev => ({ ...prev, [dString]: record.inventoryEmpty! }));
        } else if (!dailyEmptyInventory[dString]) {
          const prevDate = new Date(date);
          prevDate.setDate(date.getDate() - 1);
          const prevDateString = prevDate.toISOString().split('T')[0];
          
          const prevResponse = await fetch(`/api/stock?date=${prevDateString}`);
          const prevRecord: DailyRecord | null = prevResponse.ok ? await prevResponse.json() : null;
          const prevDateEmptyInventory = prevRecord?.inventoryEmpty || dailyEmptyInventory[prevDateString] || {};

          const newEmptyInventoryData: InventoryEmptyFullData = {};
          products.forEach(p => {
            const prevInventory = prevDateEmptyInventory[p.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0 };
            const prevClosingBalance = prevInventory.openingStock + prevInventory.received - prevInventory.transferOut - prevInventory.defective - prevInventory.plantDispatch;
            
            newEmptyInventoryData[p.id] = {
              openingStock: prevClosingBalance,
              received: 0,
              transferOut: 0,
              defective: 0,
              plantDispatch: 0,
            };
          });
          setDailyEmptyInventory(prev => ({ ...prev, [dString]: newEmptyInventoryData }));
        }
      } catch (error) {
        console.error("Error loading inventory data:", error);
      }
    };
    
    loadInventoryData();
  }, [date]);


  const handleInventoryFullChange = (productId: string, field: keyof InventoryData, value: string) => {
     setDailyInventory(prevDailyInventory => {
        const newDailyInventory = { ...prevDailyInventory };
        const currentInventoryForDate = newDailyInventory[dateString] ? { ...newDailyInventory[dateString] } : {};
        
        const productInventory = currentInventoryForDate[productId] ? { ...currentInventoryForDate[productId] } : { openingStock: 0, received: 0, refill: 0, nc: 0 };
        (productInventory as any)[field] = Number(value);

        currentInventoryForDate[productId] = productInventory;
        newDailyInventory[dateString] = currentInventoryForDate;
        return newDailyInventory;
    });
    setInventorySaving('saving');
  };
  
    const handleInventoryEmptyChange = (productId: string, field: keyof InventoryEmptyData, value: string) => {
     setDailyEmptyInventory(prevDailyInventory => {
        const newDailyInventory = { ...prevDailyInventory };
        const currentInventoryForDate = newDailyInventory[dateString] ? { ...newDailyInventory[dateString] } : {};
        
        const productInventory = currentInventoryForDate[productId] ? { ...currentInventoryForDate[productId] } : { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0 };
        (productInventory as any)[field] = Number(value);

        currentInventoryForDate[productId] = productInventory;
        newDailyInventory[dateString] = currentInventoryForDate;
        return newDailyInventory;
    });
    setInventorySaving('saving');
  };

  // Save inventory data (debounced)
  React.useEffect(() => {
    if (inventorySaving !== 'saving' || !dateString) return;

    const handler = setTimeout(async () => {
      try {
        // Get existing delivery data
        const response = await fetch(`/api/stock?date=${dateString}`);
        const existingRecord: DailyRecord | null = response.ok ? await response.json() : null;

        const recordToSave: DailyRecord = {
          date: dateString,
          entries: existingRecord?.entries || dailyData?.entries || [],
          inventoryFull: dailyInventory[dateString],
          inventoryEmpty: dailyEmptyInventory[dateString],
        };

        const saveResponse = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToSave),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save inventory');
        }

        console.log("Inventory data saved successfully to database");
        setInventorySaving('saved');
        setTimeout(() => setInventorySaving('idle'), 1500);
      } catch (error) {
        console.error("Error saving inventory:", error);
        setInventorySaving('idle');
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [inventorySaving, dateString, dailyInventory, dailyEmptyInventory, dailyData]);

  React.useEffect(() => {
    if (dailyData && dateString) {
      const salesData = dailyData.entries.reduce((acc, entry) => {
          Object.keys(entry.products).forEach(productId => {
              if (!acc[productId]) {
                  acc[productId] = { refill: 0, nc: 0 };
              }
              const productSales = entry.products[productId];
              // Ensure Refill is not negative
              const refillAmount = productSales.fullGiven - productSales.newConnection;
              acc[productId].refill += refillAmount > 0 ? refillAmount : 0;
              acc[productId].nc += productSales.newConnection;
          });
          return acc;
      }, {} as { [key: string]: { refill: number, nc: number } });

      setDailyInventory(prev => {
        const newInventory = { ...prev };
        const todayInventory = newInventory[dateString] ? JSON.parse(JSON.stringify(newInventory[dateString])) : {};
        
        products.forEach(p => {
            if (!todayInventory[p.id]) {
                todayInventory[p.id] = { openingStock: 0, received: 0, refill: 0, nc: 0 };
            }
            if (salesData[p.id]) {
                todayInventory[p.id].refill = salesData[p.id].refill;
                todayInventory[p.id].nc = salesData[p.id].nc;
            }
        });
        
        newInventory[dateString] = todayInventory;
        return newInventory;
      });
    }
  }, [dailyData, dateString]);


  if (!date) {
    return <div className="container mx-auto p-4 md:p-8">Loading...</div>;
  }
  
  const inventoryForDate = dailyInventory[dateString] || {};
  const emptyInventoryForDate = dailyEmptyInventory[dateString] || {};

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Daily Stock</h1>
        <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => date && setDate(subDays(date, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date && <span>{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => setDate(d || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => date && setDate(addDays(date, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Inventory: Full</CardTitle>
          <CardDescription>
            Daily inventory tracking for full cylinders. Closing balance is automatically carried over to the next day's opening stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px] border-r">Product</TableHead>
                            <TableHead className="text-center border-r">Opening Stock</TableHead>
                            <TableHead className="text-center">Stock Received</TableHead>
                            <TableHead colSpan={3} className="text-center border-l">Sales</TableHead>
                            <TableHead className="text-center border-l">Closing Balance</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="border-r"></TableHead>
                            <TableHead className="border-r"></TableHead>
                            <TableHead></TableHead>
                            <TableHead className="text-center border-l">Refill</TableHead>
                            <TableHead className="text-center">New Connection</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                             <TableHead className="border-l"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {products.map(p => {
                            const inventory = inventoryForDate[p.id] || { openingStock: 0, received: 0, refill: 0, nc: 0 };
                            const totalSales = inventory.refill + inventory.nc;
                            const closingBalance = inventory.openingStock + inventory.received - totalSales;

                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium border-r">{p.name}</TableCell>
                                    <TableCell className="text-center border-r">
                                        <Input
                                          type="number"
                                          readOnly
                                          value={inventory.openingStock}
                                          className="w-24 mx-auto text-center font-medium bg-muted/50"
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={inventory.received}
                                            onChange={(e) => handleInventoryFullChange(p.id, 'received', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="border-l">
                                         <Input 
                                            type="number"
                                            readOnly
                                            className="w-24 mx-auto text-center bg-muted/50"
                                            value={inventory.refill}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number"
                                            readOnly
                                            className="w-24 mx-auto text-center bg-muted/50"
                                            value={inventory.nc}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{totalSales}</TableCell>
                                    <TableCell className="text-center font-bold text-lg border-l">{closingBalance}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Inventory: Empty</CardTitle>
          <CardDescription>
            Daily inventory tracking for empty cylinders. Closing balance is automatically carried over to the next day's opening stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px] border-r">Product</TableHead>
                            <TableHead className="text-center border-r">Opening</TableHead>
                            <TableHead colSpan={4} className="text-center border-l">Stock</TableHead>
                            <TableHead className="text-center border-l">Plant Dispatch</TableHead>
                            <TableHead className="text-center border-l">Closing Balance</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="border-r"></TableHead>
                            <TableHead className="border-r"></TableHead>
                            <TableHead className="text-center border-l">Received</TableHead>
                            <TableHead className="text-center">Transfer Out/Surrender</TableHead>
                            <TableHead className="text-center">Defective</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="border-l"></TableHead>
                            <TableHead className="border-l"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {products.map(p => {
                            const inventory = emptyInventoryForDate[p.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0 };
                            const rockstarTotal = inventory.received + inventory.transferOut + inventory.defective;
                            const closingBalance = inventory.openingStock + inventory.received - inventory.transferOut - inventory.defective - inventory.plantDispatch;

                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium border-r">{p.name}</TableCell>
                                    <TableCell className="text-center border-r">
                                        <Input
                                          type="number"
                                          readOnly
                                          value={inventory.openingStock}
                                          className="w-24 mx-auto text-center font-medium bg-muted/50"
                                        />
                                    </TableCell>
                                    <TableCell className="border-l">
                                         <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={inventory.received}
                                            onChange={(e) => handleInventoryEmptyChange(p.id, 'received', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={inventory.transferOut}
                                            onChange={(e) => handleInventoryEmptyChange(p.id, 'transferOut', e.target.value)}
                                        />
                                    </TableCell>
                                     <TableCell>
                                        <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={inventory.defective}
                                            onChange={(e) => handleInventoryEmptyChange(p.id, 'defective', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{rockstarTotal}</TableCell>
                                    <TableCell className="border-l">
                                        <Input 
                                            type="number"
                                            className="w-24 mx-auto text-center"
                                            value={inventory.plantDispatch}
                                            onChange={(e) => handleInventoryEmptyChange(p.id, 'plantDispatch', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-lg border-l">{closingBalance}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>


      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Delivery</CardTitle>
            <CardDescription>
                Full: cylinders given to employees. Empty: cylinders returned by employees.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <StockTable onDataChange={setDailyData} selectedDate={date} />
        </CardContent>
      </Card>


      <DataImportSection />
    </div>
  );

    