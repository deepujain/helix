
"use client";

import * as React from "react";
import { StockTable } from "@/components/stock/stock-table";
import { DataImportSection } from "@/components/stock/data-import-section";
import { DailyInventorySummary } from "@/components/stock/daily-inventory-summary";
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
import type { DailyRecord, Employee } from "@/lib/definitions";

type InventoryData = {
  openingStock: number;
  received: number;
  refill: number;
  nc: number;
  surrender: number;
};

type InventoryEmptyData = {
  openingStock: number;
  received: number;
  transferOut: number;
  defective: number;
  plantDispatch: number;
  surrender: number;
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
  const [employees, setEmployees] = React.useState<Employee[]>([]);

  React.useEffect(() => {
    // Set initial date only on client side to avoid hydration error
    if (!date) {
      setDate(new Date());
    }
  }, [date]);

  // Load employees
  React.useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const allEmployees = await response.json();
          const active = allEmployees.filter((e: Employee) => e.status === 'active');
          setEmployees(active);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    };
    loadEmployees();
  }, []);

  const dateString = date ? date.toISOString().split('T')[0] : '';
  
  const exportToCSV = () => {
    if (!date) return;
    
    const csvRows: string[] = [];
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const inventoryForDate = dailyInventory[dateString] || {};
    const emptyInventoryForDate = dailyEmptyInventory[dateString] || {};
    
    // Title
    csvRows.push(`Daily Stock Report - ${formattedDate}`);
    csvRows.push('');
    
    // STOCK REPORT SECTION
    csvRows.push('STOCK REPORT');
    csvRows.push('');
    
    // Stock Report Headers
    const stockHeaders = ['Category'];
    products.forEach(p => {
      stockHeaders.push(`${p.name} (Full)`, `${p.name} (Empty)`);
    });
    csvRows.push(stockHeaders.join(','));
    
    // Stock Report Data
    const categories = [
      { label: 'Opening Stock', fullField: 'openingStock', emptyField: 'openingStock' },
      { label: 'Stock Received', fullField: 'received', emptyField: 'received' },
      { label: 'Surrender', fullField: 'surrender', emptyField: 'surrender' },
      { label: 'Sales', fullField: 'refill', emptyField: 'transferOut' },
      { label: 'Sent to Plant', fullField: null, emptyField: 'plantDispatch' },
      { label: 'NC/TV In', fullField: 'nc', emptyField: null },
      { label: 'Defective', fullField: null, emptyField: 'defective' },
    ];
    
    categories.forEach(category => {
      const row = [category.label];
      products.forEach(p => {
        const fullInv = inventoryForDate[p.id] || { openingStock: 0, received: 0, refill: 0, nc: 0, surrender: 0 };
        const emptyInv = emptyInventoryForDate[p.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0, surrender: 0 };
        
        const fullValue = category.fullField ? (fullInv as any)[category.fullField] ?? 0 : '';
        const emptyValue = category.emptyField ? (emptyInv as any)[category.emptyField] ?? 0 : '';
        
        row.push(fullValue.toString(), emptyValue.toString());
      });
      csvRows.push(row.join(','));
    });
    
    // Closing Balance
    const closingRow = ['Closing Balance'];
    products.forEach(p => {
      const fullInv = inventoryForDate[p.id] || { openingStock: 0, received: 0, refill: 0, nc: 0, surrender: 0 };
      const emptyInv = emptyInventoryForDate[p.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0, surrender: 0 };
      
      // Closing Balance = Opening Stock + Stock Received + Surrender - Sales - NC/TV In (for Full)
      const fullClosing = Number(fullInv.openingStock || 0) + Number(fullInv.received || 0) + Number(fullInv.surrender || 0) - Number(fullInv.refill || 0) - Number(fullInv.nc || 0);
      // Closing Balance = Opening Stock + Stock Received + Surrender - Sales - Sent to Plant + Defective (for Empty)
      const emptyClosing = Number(emptyInv.openingStock || 0) + Number(emptyInv.received || 0) + Number(emptyInv.surrender || 0) - Number(emptyInv.transferOut || 0) - Number(emptyInv.plantDispatch || 0) + Number(emptyInv.defective || 0);
      
      closingRow.push(fullClosing.toString(), emptyClosing.toString());
    });
    csvRows.push(closingRow.join(','));
    
    csvRows.push('');
    csvRows.push('');
    
    // DELIVERIES SECTION
    csvRows.push('DELIVERIES');
    csvRows.push('');
    
    // Deliveries Headers
    const deliveryHeaders = ['Employee'];
    products.forEach(p => {
      deliveryHeaders.push(`${p.name} (Full)`, `${p.name} (Empty)`, `${p.name} (New/TV In)`, `${p.name} (Due)`);
    });
    deliveryHeaders.push('Notes');
    csvRows.push(deliveryHeaders.join(','));
    
    // Deliveries Data
    employees.forEach(emp => {
      const deliveryEntry = dailyData?.deliveries?.find(d => d.employeeId === emp.id);
      const row = [emp.name];
      
      products.forEach(p => {
        const productData = deliveryEntry?.products[p.id] || { fullGiven: 0, emptyCollected: 0, newConnection: 0, due: 0 };
        row.push(
          productData.fullGiven.toString(),
          productData.emptyCollected.toString(),
          productData.newConnection.toString(),
          productData.due.toString()
        );
      });
      
      row.push(`"${deliveryEntry?.notes || ''}"`);
      csvRows.push(row.join(','));
    });
    
    // Create and download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_stock_${dateString}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Load inventory data from API
  React.useEffect(() => {
    const loadInventoryData = async () => {
      if (!date) return;
      
      const dString = date.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/stock?date=${dString}`);
        const record: DailyRecord | null = response.ok ? await response.json() : null;
        
        // Set dailyData if record exists
        if (record) {
          setDailyData(record);
        }
        
        // Calculate sales data and empty collected from deliveries if present
        let calculatedSales: { [key: string]: { refill: number, nc: number } } = {};
        let calculatedEmptyCollected: { [key: string]: number } = {};
        if (record?.deliveries) {
          calculatedSales = record.deliveries.reduce((acc, entry) => {
            Object.keys(entry.products).forEach(productId => {
              if (!acc[productId]) {
                acc[productId] = { refill: 0, nc: 0 };
              }
              const productSales = entry.products[productId];
              const refillAmount = productSales.fullGiven - productSales.newConnection;
              acc[productId].refill += refillAmount > 0 ? refillAmount : 0;
              acc[productId].nc += productSales.newConnection;
            });
            return acc;
          }, {} as { [key: string]: { refill: number, nc: number } });
          
          // Calculate total empty collected for each product
          calculatedEmptyCollected = record.deliveries.reduce((acc, entry) => {
            Object.keys(entry.products).forEach(productId => {
              if (!acc[productId]) {
                acc[productId] = 0;
              }
              acc[productId] += entry.products[productId].emptyCollected;
            });
            return acc;
          }, {} as { [key: string]: number });
        }
        
        // --- Full Inventory ---
        if (record?.inventory?.full) {
          // Update inventory with calculated sales values
          const updatedInventory = { ...record.inventory.full };
          products.forEach(p => {
            if (updatedInventory[p.id]) {
              // Ensure surrender field exists (for backward compatibility)
              if (updatedInventory[p.id].surrender === undefined) {
                updatedInventory[p.id].surrender = 0;
              }
              if (calculatedSales[p.id]) {
                updatedInventory[p.id].refill = calculatedSales[p.id].refill;
                updatedInventory[p.id].nc = calculatedSales[p.id].nc;
              }
            }
          });
          setDailyInventory(prev => ({ ...prev, [dString]: updatedInventory }));
        } else if (!dailyInventory[dString]) {
          // Calculate from previous day
          const prevDate = new Date(date);
          prevDate.setDate(date.getDate() - 1);
          const prevDateString = prevDate.toISOString().split('T')[0];
          
          // Try to load previous day from API
          const prevResponse = await fetch(`/api/stock?date=${prevDateString}`);
          const prevRecord: DailyRecord | null = prevResponse.ok ? await prevResponse.json() : null;
          const prevDateInventory = prevRecord?.inventory?.full || dailyInventory[prevDateString] || {};
          
          const newInventoryDataForDate: InventoryFullData = {};
          products.forEach(p => {
            const prevInventory = prevDateInventory[p.id] || { openingStock: 0, received: 0, refill: 0, nc: 0, surrender: 0 };
            // Closing Balance = Opening Stock + Stock Received + Surrender - Sales - NC/TV In
            const prevClosingBalance = prevInventory.openingStock + prevInventory.received + prevInventory.surrender - prevInventory.refill - prevInventory.nc;

            newInventoryDataForDate[p.id] = {
              openingStock: prevClosingBalance,
              received: 0,
              refill: calculatedSales[p.id]?.refill || 0,
              nc: calculatedSales[p.id]?.nc || 0,
              surrender: 0,
            };
          });
          setDailyInventory(prev => ({ ...prev, [dString]: newInventoryDataForDate }));
        }

        // --- Empty Inventory ---
        if (record?.inventory?.empty) {
          const updatedEmptyInventory = { ...record.inventory.empty };
          products.forEach(p => {
            if (updatedEmptyInventory[p.id]) {
              // Ensure surrender field exists (for backward compatibility)
              if (updatedEmptyInventory[p.id].surrender === undefined) {
                updatedEmptyInventory[p.id].surrender = 0;
              }
              // Auto-populate received from deliveries
              if (calculatedEmptyCollected[p.id] !== undefined) {
                updatedEmptyInventory[p.id].received = calculatedEmptyCollected[p.id];
              }
            }
          });
          setDailyEmptyInventory(prev => ({ ...prev, [dString]: updatedEmptyInventory }));
        } else if (!dailyEmptyInventory[dString]) {
          const prevDate = new Date(date);
          prevDate.setDate(date.getDate() - 1);
          const prevDateString = prevDate.toISOString().split('T')[0];
          
          const prevResponse = await fetch(`/api/stock?date=${prevDateString}`);
          const prevRecord: DailyRecord | null = prevResponse.ok ? await prevResponse.json() : null;
          const prevDateEmptyInventory = prevRecord?.inventory?.empty || dailyEmptyInventory[prevDateString] || {};

          const newEmptyInventoryData: InventoryEmptyFullData = {};
          products.forEach(p => {
            const prevInventory = prevDateEmptyInventory[p.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0, surrender: 0 };
            // Closing Balance = Opening Stock + Stock Received + Surrender - Sales - Sent to Plant + Defective
            const prevClosingBalance = prevInventory.openingStock + prevInventory.received + prevInventory.surrender - prevInventory.transferOut - prevInventory.plantDispatch + prevInventory.defective;
            
            newEmptyInventoryData[p.id] = {
              openingStock: prevClosingBalance,
              received: 0,
              transferOut: 0,
              defective: 0,
              plantDispatch: 0,
              surrender: 0,
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
        
        const productInventory = currentInventoryForDate[productId] ? { ...currentInventoryForDate[productId] } : { openingStock: 0, received: 0, refill: 0, nc: 0, surrender: 0 };
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
        
        const productInventory = currentInventoryForDate[productId] ? { ...currentInventoryForDate[productId] } : { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0, surrender: 0 };
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
          deliveries: existingRecord?.deliveries || dailyData?.deliveries || [],
          inventory: {
            full: dailyInventory[dateString],
            empty: dailyEmptyInventory[dateString],
          },
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
      const salesData = dailyData.deliveries.reduce((acc, entry) => {
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
      
      // Calculate total empty collected for each product
      const emptyCollectedData = dailyData.deliveries.reduce((acc, entry) => {
          Object.keys(entry.products).forEach(productId => {
              if (!acc[productId]) {
                  acc[productId] = 0;
              }
              acc[productId] += entry.products[productId].emptyCollected;
          });
          return acc;
      }, {} as { [key: string]: number });

      setDailyInventory(prev => {
        const newInventory = { ...prev };
        const todayInventory = newInventory[dateString] ? JSON.parse(JSON.stringify(newInventory[dateString])) : {};
        
        products.forEach(p => {
            if (!todayInventory[p.id]) {
                todayInventory[p.id] = { openingStock: 0, received: 0, refill: 0, nc: 0, surrender: 0 };
            }
            if (salesData[p.id]) {
                todayInventory[p.id].refill = salesData[p.id].refill;
                todayInventory[p.id].nc = salesData[p.id].nc;
            }
        });
        
        newInventory[dateString] = todayInventory;
        return newInventory;
      });
      
      // Update empty inventory with received from deliveries
      setDailyEmptyInventory(prev => {
        const newEmptyInventory = { ...prev };
        const todayEmptyInventory = newEmptyInventory[dateString] ? JSON.parse(JSON.stringify(newEmptyInventory[dateString])) : {};
        
        products.forEach(p => {
            if (!todayEmptyInventory[p.id]) {
                todayEmptyInventory[p.id] = { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0, surrender: 0 };
            }
            if (emptyCollectedData[p.id] !== undefined) {
                todayEmptyInventory[p.id].received = emptyCollectedData[p.id];
            }
        });
        
        newEmptyInventory[dateString] = todayEmptyInventory;
        return newEmptyInventory;
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
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Stock Report</CardTitle>
          <CardDescription>
            Record daily stock for full and empty cylinders. Closing balances automatically carry over to the next day's opening stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyInventorySummary
            inventoryFull={inventoryForDate}
            inventoryEmpty={emptyInventoryForDate}
            onFullChange={handleInventoryFullChange}
            onEmptyChange={handleInventoryEmptyChange}
          />
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

    