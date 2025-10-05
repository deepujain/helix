import { EmployeesList } from "@/components/employees/employees-list";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <div className="flex items-center space-x-2">
          {/* This button will be wired up in a future step */}
          {/* <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Employee
          </Button> */}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <EmployeesList />
    </div>
  );
}
