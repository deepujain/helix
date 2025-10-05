"use client";

import * as React from "react"
import Image from "next/image";
import { notFound, useSearchParams } from 'next/navigation';
import { employees, products } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Replace, Upload, CalendarIcon, Package, Undo2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DayContentProps, Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addMonths, subMonths, format, parseISO } from "date-fns";
import { Line, LineChart, CartesianGrid, XAxis, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


type CalendarDayData = {
  isPresent: boolean;
  isAbsent: boolean;
  dueCylinders: number;
};

const generateThirtyDayData = () => {
  const data: { date: string, full: number, empty: number, due: number }[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const full = Math.floor(Math.random() * 15);
    const empty = Math.floor(Math.random() * full);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      full,
      empty,
      due: full - empty,
    });
  }
  return data;
};

const initialEmployeeData = employees.reduce((acc, emp) => {
    acc[emp.id] = { ...emp, birthday: emp.birthday || '', designation: '' };
    return acc;
}, {} as any);


export default function EmployeeDetailPage({ params: promiseParams }: { params: { id: string } }) {
  const params = React.use(promiseParams);
  const { toast } = useToast();
  
  const [employeeData, setEmployeeData] = React.useState(initialEmployeeData[params.id]);

  // Load employee data from API
  React.useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const allEmployees = await response.json();
          const emp = allEmployees.find((e: any) => e.id === params.id);
          if (emp) {
            setEmployeeData({ ...emp, designation: emp.designation || '', birthday: emp.birthday || '' });
          }
        }
      } catch (error) {
        console.error("Error loading employee:", error);
      }
    };
    loadEmployee();
  }, [params.id]);

  const employee = employeeData;

  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());
  const [calendarData, setCalendarData] = React.useState<Map<string, CalendarDayData>>(new Map());
  const [activeTab, setActiveTab] = React.useState(products[0].id)
  const [mainTab, setMainTab] = React.useState('profile');
  const netCylinderFlowRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [chartData, setChartData] = React.useState<Record<string, ReturnType<typeof generateThirtyDayData>>>({});
  const [uploading, setUploading] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get('section') === 'net-flow' && netCylinderFlowRef.current) {
        netCylinderFlowRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  React.useEffect(() => {
    const employeeChartData: Record<string, ReturnType<typeof generateThirtyDayData>> = {};
    products.forEach(p => {
        employeeChartData[p.id] = generateThirtyDayData();
    });
    setChartData(employeeChartData);

    const data = new Map<string, CalendarDayData>();
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month + 1}-${day}`;
        const d = new Date(year, month, day);
        const isPresent = d.getDate() % 5 !== 0 && d.getDay() !== 0;
        const isAbsent = !isPresent && d.getDate() % 2 === 0  && d.getDay() !== 0;
        const dueCylinders = isPresent ? Math.floor(Math.random() * 3) : 0;
        data.set(dateKey, { isPresent, isAbsent, dueCylinders });
    }
    setCalendarData(data);
  }, [displayMonth]);

  if (!employee) {
    notFound();
  }
  
  const handleInputChange = (field: keyof typeof employeeData, value: string | boolean | Date) => {
    const formattedValue = value instanceof Date ? format(value, 'yyyy-MM-dd') : value;
    setEmployeeData((prev: any) => ({ ...prev, [field]: formattedValue }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, ...employeeData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save employee');
      }

      console.log("PUT /api/employees - Employee updated successfully");
      toast({
        title: "Employee Saved",
        description: `${employeeData.name}'s information has been updated.`,
      });
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Error",
        description: "Failed to save employee changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File, documentType: 'profile' | 'aadhar') => {
    setUploading(documentType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employeeId', params.id);
      formData.append('documentType', documentType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update employee data with new image URL
      const fieldName = documentType === 'profile' ? 'profilePicture' : 'aadharCard';
      if (documentType === 'profile') {
        setEmployeeData((prev: any) => ({ ...prev, profilePicture: data.url, avatarUrl: data.url }));
      } else {
        setEmployeeData((prev: any) => ({ ...prev, aadharCard: data.url }));
      }

      // Save to database
      await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, [fieldName]: data.url }),
      });

      toast({
        title: "Upload Successful",
        description: `${documentType === 'profile' ? 'Profile picture' : 'Aadhar card'} has been uploaded.`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const workDays = 26;
  const presentDays = 22;
  const absentDays = 4;
  const sundays = 4;
  const dailyPayRate = 500;
  const netPayableDays = presentDays + sundays - absentDays;
  const grossPay = netPayableDays * dailyPayRate;

  const thirtyDayTotals = React.useMemo(() => {
    const data = chartData[activeTab];
    if (!data) {
        return { full: 0, empty: 0, due: 0 };
    }
    return data.reduce(
        (acc, day) => {
            acc.full += day.full;
            acc.empty += day.empty;
            acc.due += day.due;
            return acc;
        },
        { full: 0, empty: 0, due: 0 }
    );
  }, [activeTab, chartData]);
  
  const DayContent = (props: DayContentProps) => {
    const { date } = props;
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const dayData = calendarData.get(dateKey);

    const isOutside = props.displayMonth.getMonth() !== date.getMonth();

    if (!dayData || isOutside) {
        return <div className="p-2 box-border"><div className="h-full w-full rounded-md" /></div>;
    }

    const { isPresent, isAbsent, dueCylinders } = dayData;

    const cellClasses = cn(
        "h-full w-full rounded-md flex flex-col justify-between p-1",
        {
            "bg-green-100 dark:bg-green-900/30": isPresent,
            "bg-red-100 dark:bg-red-900/30": isAbsent,
            "bg-muted/50": !isPresent && !isAbsent,
        }
    );

    return (
        <div className="p-1 box-border h-full">
            <div className={cellClasses}>
                <div className="text-xs text-left p-1">{date.getDate()}</div>
                <div className="w-full text-xs p-1">
                {isPresent && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-full justify-center text-[10px] p-0.5">Present</Badge>
                )}
                {isAbsent && (
                    <Badge variant="destructive" className="w-full justify-center text-[10px] p-0.5">Absent</Badge>
                )}
                {dueCylinders > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                    Due: {dueCylinders}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
  };
  
    const chartConfig = {
      full: {
        label: "Full Delivered",
        color: "hsl(var(--chart-2))",
      },
      empty: {
        label: "Empty Returned",
        color: "hsl(var(--chart-1))",
      },
      due: {
        label: "Due",
        color: "hsl(var(--destructive))",
      },
    }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" className="mr-4" asChild>
              <Link href="/employees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Employee Details</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-1 space-y-8 flex flex-col">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people avatar"/>
                    <AvatarFallback>{employee.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-muted-foreground">{employee.phone}</p>
                 <p className="text-sm text-muted-foreground">Joined: {format(parseISO(employee.joinDate), 'dd/MM/yyyy')}</p>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Tabs value={mainTab} onValueChange={setMainTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <Card>
                        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={employee.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input id="designation" value={employee.designation} onChange={(e) => handleInputChange('designation', e.target.value)} placeholder="e.g. Driver" />
                            </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select>
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="birthday">Birthday</Label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !employee.birthday && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {employee.birthday ? format(parseISO(employee.birthday), "dd/MM/yyyy") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={employee.birthday ? parseISO(employee.birthday) : undefined}
                                            onSelect={(date) => handleInputChange('birthday', date || '')}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                           </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleSave}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="contact">
                     <Card>
                        <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={employee.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="9999988888" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Main St, Anytown" />
                            </div>
                        </CardContent>
                         <CardFooter className="justify-end">
                            <Button onClick={handleSave}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="employment">
                     <Card>
                        <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center space-x-2">
                                    <Switch id="employment-status" checked={employee.status === 'active'} onCheckedChange={(checked) => handleInputChange('status', checked ? 'active' : 'inactive')} />
                                    <Label htmlFor="employment-status">Employment Status</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="track-attendance" />
                                    <Label htmlFor="track-attendance">Track Attendance</Label>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="employment-type">Employment Type</Label>
                                    <Select>
                                        <SelectTrigger id="employment-type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full-time</SelectItem>
                                            <SelectItem value="part-time">Part-time</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="joining-date">Joining Date</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !employee.joinDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {employee.joinDate ? format(parseISO(employee.joinDate), "dd/MM/yyyy") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={employee.joinDate ? parseISO(employee.joinDate) : undefined}
                                                onSelect={(date) => handleInputChange('joinDate', date || '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="pay-rate">Daily Pay Rate (INR)</Label>
                                <Input id="pay-rate" type="number" placeholder="e.g. 500" />
                            </div>
                        </CardContent>
                         <CardFooter className="justify-end">
                            <Button onClick={handleSave}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="documents">
                    <Card>
                        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Profile Picture</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={!employee.profilePicture && !employee.avatarUrl}>
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Profile Picture</DialogTitle>
                                                    </DialogHeader>
                                                    {(employee.profilePicture || employee.avatarUrl) && (
                                                        <Image 
                                                            src={employee.profilePicture || employee.avatarUrl} 
                                                            alt="Profile Picture" 
                                                            width={400} 
                                                            height={400} 
                                                            className="rounded-md" 
                                                        />
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={uploading === 'profile'}>
                                                        <Upload className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Upload Profile Picture</DialogTitle>
                                                        <DialogDescription>Select a new image to upload (JPEG, PNG, WebP - Max 5MB).</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="picture-file">Image File</Label>
                                                            <Input 
                                                                id="picture-file" 
                                                                type="file" 
                                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        handleImageUpload(file, 'profile');
                                                                    }
                                                                }}
                                                                disabled={uploading === 'profile'}
                                                            />
                                                        </div>
                                                        {uploading === 'profile' && (
                                                            <p className="text-sm text-muted-foreground">Uploading...</p>
                                                        )}
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="secondary">Close</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Aadhar Card</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={!employee.aadharCard}>
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Aadhar Card</DialogTitle>
                                                    </DialogHeader>
                                                    {employee.aadharCard && (
                                                        <Image 
                                                            src={employee.aadharCard} 
                                                            alt="Aadhar Card" 
                                                            width={400} 
                                                            height={250} 
                                                            className="rounded-md" 
                                                        />
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={uploading === 'aadhar'}>
                                                        <Upload className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Upload Aadhar Card</DialogTitle>
                                                        <DialogDescription>Select a new image to upload (JPEG, PNG, WebP - Max 5MB).</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="aadhar-file">Image File</Label>
                                                            <Input 
                                                                id="aadhar-file" 
                                                                type="file" 
                                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        handleImageUpload(file, 'aadhar');
                                                                    }
                                                                }}
                                                                disabled={uploading === 'aadhar'}
                                                            />
                                                        </div>
                                                        {uploading === 'aadhar' && (
                                                            <p className="text-sm text-muted-foreground">Uploading...</p>
                                                        )}
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="secondary">Close</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deliveries (30 Days)</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{thirtyDayTotals.full}</div>
                    <p className="text-xs text-muted-foreground">Total Full cylinders given in the last 30 days.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Returns (30 Days)</CardTitle>
                    <Undo2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{thirtyDayTotals.empty}</div>
                    <p className="text-xs text-muted-foreground">Total Empty cylinders returned in the last 30 days.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dues (Current)</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", thirtyDayTotals.due > 10 ? "text-destructive" : "")}>
                        {thirtyDayTotals.due}
                    </div>
                    <p className="text-xs text-muted-foreground">Cylinders still not returned.</p>
                </CardContent>
            </Card>
        </div>

      <div ref={netCylinderFlowRef} className="grid gap-8 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Performance Insights Chart</CardTitle>
                <CardDescription>Cylinders delivered to and returned by {employee.name} over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                        {products.map((product) => (
                            <TabsTrigger key={product.id} value={product.id}>{product.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="grid grid-cols-3 gap-4 text-center my-4">
                        <div>
                            <p className="text-2xl font-bold">{thirtyDayTotals.full}</p>
                            <p className="text-sm text-muted-foreground">Total Full Delivered</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{thirtyDayTotals.empty}</p>
                            <p className="text-sm text-muted-foreground">Total Empty Returned</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-destructive">{thirtyDayTotals.due}</p>
                            <p className="text-sm text-muted-foreground">Total Due</p>
                        </div>
                    </div>
                    {products.map((product) => (
                         <TabsContent key={product.id} value={product.id}>
                            {chartData[product.id] ? (
                                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                    <LineChart
                                        accessibilityLayer
                                        data={chartData[product.id]}
                                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                    >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tickFormatter={(value) => value}
                                            interval={4}
                                        />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="full" stroke="var(--color-full)" strokeWidth={2} dot={false} name="Full Delivered" />
                                        <Line type="monotone" dataKey="empty" stroke="var(--color-empty)" strokeWidth={2} dot={false} name="Empty Returned" />
                                        <Line type="monotone" dataKey="due" stroke="var(--color-due)" strokeWidth={2} dot={false} name="Due" />
                                    </LineChart>
                                </ChartContainer>
                            ) : <div>Loading Chart...</div>}
                         </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span>Work Days</span>
                    <span>{workDays}</span>
                </div>
                <div className="flex justify-between">
                    <span>Present</span>
                    <span className="text-green-600">{presentDays}</span>
                </div>
                <div className="flex justify-between">
                    <span>Absent</span>
                    <span className="text-destructive">{absentDays}</span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Gross Pay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Total Present Days</span><span>{presentDays}</span></div>
                <div className="flex justify-between"><span>Total Sundays</span><span>{sundays}</span></div>
                <div className="flex justify-between"><span>Total Absent Days</span><span>{absentDays}</span></div>
                <div className="flex justify-between font-medium"><span>Net Payable Days</span><span>{netPayableDays}</span></div>
                <div className="flex justify-between"><span>Daily Pay Rate</span><span>₹{dailyPayRate}</span></div>
                <div className="flex justify-between text-lg font-bold"><span>Gross Pay</span><span>₹{grossPay.toLocaleString()}</span></div>
            </CardContent>
        </Card>
      </div>

       <Card className="w-full mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Attendance Calendar</CardTitle>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-32 text-center">
                      {displayMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
            </div>
          </CardHeader>
          <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              className="p-0"
              classNames={{
                root: "w-full border-separate border-spacing-1",
                months: "w-full",
                month: "w-full space-y-1.5",
                table: "w-full",
                head_row: "flex w-full",
                head_cell: "w-full text-muted-foreground rounded-md font-normal text-[0.8rem] justify-center flex p-1",
                row: "flex w-full mt-1.5",
                cell: "h-24 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-full w-full p-0 font-normal",
                day_selected: "rounded-md",
                day_today: "",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                caption: "hidden",
                nav: "hidden",
              }}
              components={{ DayContent }}
          />
      </Card>
      
    </div>
  );
}

    