"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { employeeDues, products } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { useRouter } from "next/navigation";

export function DueEmployeesTable() {
  const router = useRouter();

  const handleRowClick = (employeeId: string) => {
    router.push(`/employees/${employeeId}?section=net-flow`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">Employee Dues</h2>
        </CardTitle>
        <CardDescription>
          Outstanding cylinder dues by employee and type.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Employee</TableHead>
              {products.map(product => (
                <TableHead key={product.id} className="text-right">{product.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeDues.map((employee) => (
              <TableRow key={employee.employeeId} onClick={() => handleRowClick(employee.employeeId)} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.employeeAvatar} alt="Avatar" data-ai-hint="people avatar"/>
                      <AvatarFallback>{employee.employeeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{employee.employeeName}</div>
                  </div>
                </TableCell>
                {products.map(product => (
                    <TableCell key={product.id} className="text-right font-medium text-destructive">
                        {employee.dues[product.id] || 0}
                    </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
