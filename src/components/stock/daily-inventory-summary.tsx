"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { products } from "@/lib/data";

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
};

interface DailyInventorySummaryProps {
  inventoryFull: InventoryFullData;
  inventoryEmpty: InventoryEmptyFullData;
  onFullChange: (productId: string, field: keyof InventoryData, value: string) => void;
  onEmptyChange: (productId: string, field: keyof InventoryEmptyData, value: string) => void;
}

export function DailyInventorySummary({
  inventoryFull,
  inventoryEmpty,
  onFullChange,
  onEmptyChange,
}: DailyInventorySummaryProps) {
  
  // Category rows configuration
  const categories = [
    { 
      label: "Opening Stock", 
      fullField: "openingStock" as keyof InventoryData,
      emptyField: "openingStock" as keyof InventoryEmptyData,
      fullEditable: false,
      emptyEditable: false,
    },
    { 
      label: "Stock Received", 
      fullField: "received" as keyof InventoryData,
      emptyField: "received" as keyof InventoryEmptyData,
      fullEditable: true,
      emptyEditable: true,
    },
    { 
      label: "Sales / Transfer Out", 
      fullField: "refill" as keyof InventoryData,
      emptyField: "transferOut" as keyof InventoryEmptyData,
      fullEditable: false,
      emptyEditable: true,
    },
    { 
      label: "New Connection", 
      fullField: "nc" as keyof InventoryData,
      emptyField: null,
      fullEditable: false,
      emptyEditable: false,
    },
    { 
      label: "Plant Dispatch", 
      fullField: null,
      emptyField: "plantDispatch" as keyof InventoryEmptyData,
      fullEditable: false,
      emptyEditable: true,
    },
    { 
      label: "Defective", 
      fullField: null,
      emptyField: "defective" as keyof InventoryEmptyData,
      fullEditable: false,
      emptyEditable: true,
    },
  ];

  const getClosingBalance = (productId: string, type: 'full' | 'empty'): number => {
    if (type === 'full') {
      const inventory = inventoryFull[productId] || { openingStock: 0, received: 0, refill: 0, nc: 0 };
      const totalSales = inventory.refill + inventory.nc;
      return inventory.openingStock + inventory.received - totalSales;
    } else {
      const inventory = inventoryEmpty[productId] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0 };
      return inventory.openingStock + inventory.received - inventory.transferOut - inventory.defective - inventory.plantDispatch;
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] border-r sticky left-0 bg-muted/50 z-10">Category</TableHead>
            {products.map((product) => (
              <TableHead key={product.id} colSpan={2} className="text-center border-r bg-muted/50">
                {product.name}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="border-r sticky left-0 bg-muted/30 z-10"></TableHead>
            {products.map((product) => (
              <React.Fragment key={`${product.id}-sub`}>
                <TableHead className="text-center text-xs bg-muted/30">Full</TableHead>
                <TableHead className="text-center text-xs border-r bg-muted/30">Empty</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-medium border-r sticky left-0 bg-background z-10">
                {category.label}
              </TableCell>
              {products.map((product) => {
                const fullInventory = inventoryFull[product.id] || { openingStock: 0, received: 0, refill: 0, nc: 0 };
                const emptyInventory = inventoryEmpty[product.id] || { openingStock: 0, received: 0, transferOut: 0, defective: 0, plantDispatch: 0 };
                
                const fullValue = category.fullField ? fullInventory[category.fullField] : null;
                const emptyValue = category.emptyField ? emptyInventory[category.emptyField] : null;

                return (
                  <React.Fragment key={product.id}>
                    {/* Full Column */}
                    <TableCell className="text-center">
                      {fullValue !== null ? (
                        category.fullEditable ? (
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center"
                            value={fullValue}
                            onChange={(e) => onFullChange(product.id, category.fullField!, e.target.value)}
                          />
                        ) : (
                          <Input
                            type="number"
                            readOnly
                            className="w-20 mx-auto text-center bg-muted/50"
                            value={fullValue}
                          />
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    {/* Empty Column */}
                    <TableCell className="text-center border-r">
                      {emptyValue !== null ? (
                        category.emptyEditable ? (
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center"
                            value={emptyValue}
                            onChange={(e) => onEmptyChange(product.id, category.emptyField!, e.target.value)}
                          />
                        ) : (
                          <Input
                            type="number"
                            readOnly
                            className="w-20 mx-auto text-center bg-muted/50"
                            value={emptyValue}
                          />
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          ))}
          
          {/* Closing Balance Row */}
          <TableRow className="bg-muted/20 font-bold">
            <TableCell className="font-bold border-r sticky left-0 bg-muted/20 z-10">
              Closing Balance
            </TableCell>
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <TableCell className="text-center">
                  <span className="text-lg font-bold">{getClosingBalance(product.id, 'full')}</span>
                </TableCell>
                <TableCell className="text-center border-r">
                  <span className="text-lg font-bold">{getClosingBalance(product.id, 'empty')}</span>
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
