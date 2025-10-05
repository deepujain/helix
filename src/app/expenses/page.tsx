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
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { expenseTypes, dailyExpenses as initialDailyExpenses } from '@/lib/data/expenses';
import type { Expense } from '@/lib/definitions';
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard/kpi-cards';

export default function ExpensesPage() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [newExpense, setNewExpense] = React.useState<Omit<Expense, 'id' | 'enteredBy'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: '',
    description: '',
    amount: 0,
  });
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoading, setIsLoading] = React.useState(true);
  
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
        } else {
          setExpenses([]);
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
        setExpenses([]);
      }
    };
    
    loadExpenses();
    setNewExpense(prev => ({...prev, date: dateString}));
    
    // Simulate loading for MTD cards
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [date]);

  const handleInputChange = async (
    id: string,
    field: keyof Expense,
    value: string | number
  ) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
    setSavingStatus('saving');
    
    // Save the updated expense
    try {
      const updatedExpense = expenses.find(e => e.id === id);
      if (updatedExpense) {
        const response = await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, [field]: value }),
        });
        
        if (response.ok) {
          console.log('Expense updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleNewExpenseChange = (field: keyof typeof newExpense, value: string | number | Date) => {
    let formattedValue = value;
    if (value instanceof Date) {
        formattedValue = format(value, 'yyyy-MM-dd');
    }
    setNewExpense(prev => ({...prev, [field]: formattedValue}));
  }

  const handleAddExpense = async () => {
    if (!newExpense.type || newExpense.amount <= 0) {
        toast({
            title: 'Missing Information',
            description: 'Please select an expense type and enter an amount.',
            variant: 'destructive',
        });
        return;
    }

    const newEntry: Expense = {
        ...newExpense,
        id: `exp_${Date.now()}`,
        enteredBy: 'Admin', // This would be dynamic in a real app
    };
    
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry),
        });

        if (!response.ok) {
            throw new Error('Failed to add expense');
        }

        console.log('Expense added successfully to database');
        
        // Check if the new expense is for the currently selected date
        if (newEntry.date === format(date, 'yyyy-MM-dd')) {
            setExpenses(prev => [newEntry, ...prev]);
        } else {
            // If not, just show a toast, as the table won't reflect the change immediately
            toast({
                title: 'Expense Added',
                description: `Expense for ${format(new Date(newEntry.date), 'PPP')} has been recorded.`,
            });
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        toast({
            title: 'Error',
            description: 'Failed to add expense. Please try again.',
            variant: 'destructive',
        });
        return;
    }

    // Reset form
    setNewExpense({
        date: format(date, 'yyyy-MM-dd'),
        type: '',
        description: '',
        amount: 0,
    });
  };

  React.useEffect(() => {
    if (savingStatus !== 'saving') return;
    const handler = setTimeout(() => {
      console.log('Saving expenses:', expenses);
      setSavingStatus('saved');
      toast({
        title: 'Auto-saved!',
        description: 'Your changes have been successfully saved.',
      });
      setTimeout(() => setSavingStatus('idle'), 2000);
    }, 1500);
    return () => clearTimeout(handler);
  }, [expenses, savingStatus, toast]);

  const dailyTotal = expenses.reduce((acc, exp) => acc + exp.amount, 0);

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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
            <CardTitle>Add Daily Expense</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !newExpense.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpense.date ? format(new Date(newExpense.date), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(newExpense.date)}
                    onSelect={(d) => handleNewExpenseChange('date', d || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-type">Expense Type</Label>
              <Select value={newExpense.type} onValueChange={(val) => handleNewExpenseChange('type', val)}>
                <SelectTrigger id="expense-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="e.g., Generator refill" value={newExpense.description} onChange={e => handleNewExpenseChange('description', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" placeholder="e.g., 1200" value={newExpense.amount} onChange={e => handleNewExpenseChange('amount', e.target.valueAsNumber || 0)} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleAddExpense}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Daily Expense Log</CardTitle>
                    <CardDescription>
                        Expenses for {format(date, 'PPP')}. Click a field to edit.
                    </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                    {savingStatus === 'saving' && 'Saving...'}
                    {savingStatus === 'saved' && 'Saved!'}
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead>Expense Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead>Entered By</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                        <TableCell className="font-medium">{format(new Date(exp.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                            <Select value={exp.type} onValueChange={(val) => handleInputChange(exp.id, 'type', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                        {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Input value={exp.description} onChange={(e) => handleInputChange(exp.id, 'description', e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right">
                            <Input type="number" value={exp.amount} onChange={(e) => handleInputChange(exp.id, 'amount', e.target.valueAsNumber || 0)} className="text-right" />
                        </TableCell>
                        <TableCell>{exp.enteredBy}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                <ShadcnTableFooter>
                    <TableRow>
                    <TableCell colSpan={3} className="font-bold">
                        Total for {format(date, 'PPP')}
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
