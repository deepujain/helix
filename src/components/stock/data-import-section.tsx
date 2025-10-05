import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FileUp, GitBranch } from "lucide-react";

export function DataImportSection() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Import historical data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import-csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import-csv">
              <FileUp className="mr-2 h-4 w-4" />
              Import CSV
            </TabsTrigger>
            <TabsTrigger value="import-gsheets">
              <GitBranch className="mr-2 h-4 w-4" />
              Import Google Sheet
            </TabsTrigger>
          </TabsList>
          <TabsContent value="import-csv" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file to import historical stock data. Ensure the
                file has headers for employee ID and product columns.
              </p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" />
              </div>
              <Button>
                <FileUp className="mr-2 h-4 w-4" /> Upload and Process
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="import-gsheets" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a Google Sheet ID to import data. You may need to grant
                access.
              </p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="gsheet-id">Google Sheet ID</Label>
                <Input id="gsheet-id" type="text" placeholder="Enter sheet ID" />
              </div>
              <Button>
                <GitBranch className="mr-2 h-4 w-4" /> Connect and Import
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
