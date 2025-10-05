"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/definitions";
import * as React from "react";

interface SalesByTypeProps {
    products: Product[];
    isLoading: boolean;
}

export function SalesByType({ products, isLoading }: SalesByTypeProps) {
    const [salesData, setSalesData] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
        if (!isLoading) {
            const data: Record<string, number> = {};
            products.forEach(p => {
                data[p.id] = Math.floor(Math.random() * 50) + 5;
            });
            setSalesData(data);
        }
    }, [isLoading, products]);


    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Sales by Type</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                    {products.map(p => (
                        <div key={p.id} className="p-2 border rounded-lg">
                            <Skeleton className="h-5 w-1/2 mx-auto mb-2" />
                            <Skeleton className="h-6 w-1/3 mx-auto" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales by Type</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                {products.map(p => (
                    <div key={p.id} className="p-2 border rounded-lg bg-muted/20">
                        <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
                        <div className="text-xl font-bold">{salesData[p.id] || 0}</div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
