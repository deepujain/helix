"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee } from "@/lib/definitions";
import { useRouter } from "next/navigation";

interface TopEmployeesTableProps {
    title: string;
    metricLabel: string;
    employees: (Employee & { metric: number })[];
    isLoading: boolean;
}

export function TopEmployeesTable({ title, metricLabel, employees, isLoading }: TopEmployeesTableProps) {
    const router = useRouter();

    const handleRowClick = (employeeId: string) => {
        router.push(`/employees/${employeeId}`);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/5" />
                                    <Skeleton className="h-3 w-2/5" />
                                </div>
                                <Skeleton className="h-5 w-1/6" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-right">{metricLabel}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map(employee => (
                            <TableRow key={employee.id} onClick={() => handleRowClick(employee.id)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people avatar" />
                                            <AvatarFallback>{employee.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{employee.name}</div>
                                            <div className="text-sm text-muted-foreground">{employee.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">{employee.metric}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
