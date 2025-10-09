'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as ShadcnTableFooter,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon,
  PlusCircle,
  TrendingUp,
  BarChart,
  DollarSign,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, startOfMonth, addDays, subDays, startOfQuarter, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { expenseTypes, dailyExpenses as initialDailyExpenses } from '@/lib/data/expenses';
import type { Expense } from '@/lib/definitions';
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard/kpi-cards';

export default function ExpensesPage() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [tableData, setTableData] = React.useState<Record<string, {description: string; amount: number; id?: string}>>({});
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
  const { toast } = useToast();

  React.useEffect(() => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Load expenses from API
    const loadExpenses = async () => {
      try {
        const response = await fetch(`/api/expenses?date=${dateString}`);
        if (response.ok) {
          const data = await response.json();
          setExpenses(data);
          
          // Build table data from loaded expenses
          const newTableData: Record<string, {description: string; amount: number; id?: string}> = {};
          expenseTypes.forEach(type => {
            const expense = data.find((e: Expense) => e.type === type);
            newTableData[type] = expense 
              ? { description: expense.description, amount: expense.amount, id: expense.id }
              : { description: '', amount: 0 };
          });
          setTableData(newTableData);
        } else {
          setExpenses([]);
          // Initialize empty table data
          const emptyTableData: Record<string, {description: string; amount: number; id?: string}> = {};
          expenseTypes.forEach(type => {
            emptyTableData[type] = { description: '', amount: 0 };
          });
          setTableData(emptyTableData);
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
        setExpenses([]);
      }
    };
    
    loadExpenses();
    
    // Simulate loading for MTD cards
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [date]);

  const handleTableChange = async (
    expenseType: string,
    field: 'description' | 'amount',
    value: string | number
  ) => {
    // Update local state immediately
    setTableData(prev => ({
      ...prev,
      [expenseType]: {
        ...prev[expenseType],
        [field]: value
      }
    }));
    
    // Debounced save will handle persistence
    setSavingStatus('saving');
  };
  
  const handleDeleteExpense = async (expenseType: string) => {
    const rowData = tableData[expenseType];
    if (!rowData.id) return;
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rowData.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      console.log('Expense deleted successfully');
      
      // Clear the row
      setTableData(prev => ({
        ...prev,
        [expenseType]: { description: '', amount: 0 }
      }));
      
      toast({
        title: 'Expense Deleted',
        description: 'The expense has been removed.',
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const exportToCSV = (type: 'mtd' | 'qtd' | 'ytd') => {
    const today = new Date();
    let startDate: Date;
    let label: string;
    
    switch (type) {
      case 'mtd':
        startDate = startOfMonth(today);
        label = 'Month to Date';
        break;
      case 'qtd':
        startDate = startOfQuarter(today);
        label = 'Quarter to Date';
        break;
      case 'ytd':
        startDate = startOfYear(today);
        label = 'Year to Date';
        break;
    }
    
    // Filter expenses based on date range
    const filteredExpenses = allExpenses.filter(exp => {
      const expDate = new Date(exp.date + 'T00:00:00');
      return expDate >= startDate && expDate <= today;
    });
    
    // Sort by date
    filteredExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Create CSV content
    const csvRows: string[] = [];
    
    // Title
    csvRows.push(`Expense Report - ${label}`);
    csvRows.push(`Period: ${format(startDate, 'dd/MM/yyyy')} to ${format(today, 'dd/MM/yyyy')}`);
    csvRows.push('');
    
    // Headers
    csvRows.push('Date,Expense Type,Description,Amount,Entered By');
    
    // Data rows
    filteredExpenses.forEach(exp => {
      const row = [
        format(new Date(exp.date + 'T00:00:00'), 'dd/MM/yyyy'),
        exp.type,
        `"${exp.description}"`, // Wrap in quotes to handle commas
        exp.amount,
        exp.enteredBy
      ];
      csvRows.push(row.join(','));
    });
    
    // Summary
    csvRows.push('');
    csvRows.push('SUMMARY');
    csvRows.push('');
    
    // Group by expense type
    const expensesByType = filteredExpenses.reduce((acc, exp) => {
      if (!acc[exp.type]) {
        acc[exp.type] = 0;
      }
      acc[exp.type] += exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    csvRows.push('Expense Type,Total Amount');
    Object.entries(expensesByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, total]) => {
        csvRows.push(`${type},${total}`);
      });
    
    csvRows.push('');
    csvRows.push(`Grand Total,${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)}`);
    
    // Create and download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `expenses_${type}_${format(today, 'yyyy-MM-dd')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Export Successful',
      description: `${label} expenses exported to CSV.`,
    });
  };

  // Debounced save effect
  React.useEffect(() => {
    if (savingStatus !== 'saving') return;
    
    const handler = setTimeout(async () => {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Save all non-empty rows
      for (const [expenseType, data] of Object.entries(tableData)) {
        if (data.amount > 0 || data.description) {
          try {
            if (data.id) {
              // Update existing expense
              await fetch('/api/expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: data.id,
                  description: data.description,
                  amount: data.amount,
                }),
              });
            } else if (data.amount > 0) {
              // Create new expense only if amount is greater than 0
              const newExpense: Expense = {
                id: `exp_${Date.now()}_${expenseType}`,
                date: dateString,
                type: expenseType,
                description: data.description,
                amount: data.amount,
                enteredBy: 'Admin',
              };
              
              const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense),
              });
              
              if (response.ok) {
                // Update table data with the new ID
                setTableData(prev => ({
                  ...prev,
                  [expenseType]: { ...data, id: newExpense.id }
                }));
              }
            }
          } catch (error) {
            console.error(`Error saving expense for ${expenseType}:`, error);
          }
        }
      }
      
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    }, 1500);
    
    return () => clearTimeout(handler);
  }, [tableData, savingStatus, date]);

  const dailyTotal = Object.values(tableData).reduce((acc, data) => acc + (data.amount || 0), 0);

  const [allExpenses, setAllExpenses] = React.useState<Expense[]>([]);
  
  // Load all expenses for MTD calculations
  React.useEffect(() => {
    const loadAllExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (response.ok) {
          const data = await response.json();
          setAllExpenses(data);
        }
      } catch (error) {
        console.error("Error loading all expenses:", error);
      }
    };
    loadAllExpenses();
  }, [expenses]); // Reload when expenses change

  const mtdTotal = allExpenses
    .filter(e => new Date(e.date) >= startOfMonth(new Date()))
    .reduce((acc, exp) => acc + exp.amount, 0);
    
  const topCategories = React.useMemo(() => {
    const categoryTotals = allExpenses
        .filter(e => new Date(e.date) >= startOfMonth(new Date()))
        .reduce((acc, exp) => {
            acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, total]) => ({name, total}));
  }, [allExpenses]);
  
  const dailyAverage = mtdTotal / (new Date().getDate());

  const mtdKpis = [
      { title: "Total MTD Expense", value: `₹${mtdTotal.toLocaleString()}`, Icon: TrendingUp, description: "Sum of all expenses this month" },
      { title: "Top Expense Categories", value: topCategories.map(c => `${c.name}: ₹${c.total.toLocaleString()}`).join(' | '), Icon: BarChart, description: "Top 3 spending categories this month"},
      { title: "Daily Average Spend", value: `₹${dailyAverage.toLocaleString('en-IN', {maximumFractionDigits: 0})}`, Icon: DollarSign, description: "Average daily expense this month"}
  ]

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToCSV('mtd')}>
                Month to Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('qtd')}>
                Quarter to Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('ytd')}>
                Year to Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Month-To-Date Insights</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? Array.from({length: 3}).map((_, i) => <KpiCardSkeleton key={i} />) : mtdKpis.map(kpi => 
                    <Card key={kpi.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                            <kpi.Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={kpi.title === 'Top Expense Categories' ? "text-xs" : "text-2xl font-bold"}>
                                {kpi.title === 'Top Expense Categories' ? (
                                    <div className="flex space-x-2">
                                        {topCategories.map(c => <div key={c.name}><span className="font-semibold">{c.name}</span>: ₹{c.total.toLocaleString()}</div>)}
                                    </div>
                                ) : kpi.value}
                            </div>
                            <p className="text-xs text-muted-foreground">{kpi.description}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Expenses for {format(date, 'PPP')}</CardTitle>
                    <CardDescription>
                        Fill in amounts and descriptions for expenses incurred on this date.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground mr-4">
                        {savingStatus === 'saving' && 'Saving...'}
                        {savingStatus === 'saved' && 'Saved!'}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setDate(subDays(date, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[180px] justify-start text-left font-normal'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(date, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => {
                            if (d) {
                              setDate(d);
                              setIsCalendarOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setDate(addDays(date, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Expense Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[150px]">Amount (₹)</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenseTypes.map((expenseType) => {
                      const rowData = tableData[expenseType] || { description: '', amount: 0 };
                      return (
                        <TableRow key={expenseType}>
                            <TableCell className="font-medium">{expenseType}</TableCell>
                            <TableCell>
                                <Input 
                                  value={rowData.description} 
                                  onChange={(e) => handleTableChange(expenseType, 'description', e.target.value)}
                                  placeholder="Enter description..."
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <Input 
                                  type="number" 
                                  value={rowData.amount || ''} 
                                  onChange={(e) => handleTableChange(expenseType, 'amount', e.target.valueAsNumber || 0)}
                                  className="text-right"
                                  placeholder="0"
                                />
                            </TableCell>
                            <TableCell>
                              {rowData.id && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteExpense(expenseType)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
                <ShadcnTableFooter>
                    <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                        Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                        ₹{dailyTotal.toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                    </TableRow>
                </ShadcnTableFooter>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
