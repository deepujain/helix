export type Product = {
  id: string;
  name: string; // e.g., '5kg', '10kg'
  unitCost: number;
};

export type Employee = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
  joinDate: string; // YYYY-MM-DD
  birthday?: string; // YYYY-MM-DD
  notes?: string;
  avatarUrl: string;
  profilePicture?: string; // Path to uploaded profile picture
  aadharCard?: string; // Path to uploaded aadhar card
  designation?: string;
  gender?: string;
  address?: string;
  trackAttendance?: boolean;
  employmentType?: string;
  dailyPayRate?: number;
};

export type StockEntry = {
  fullGiven: number;
  emptyCollected: number;
  newConnection: number;
  due: number;
};

export type DailyStockEntry = {
  employeeId: string;
  products: {
    [productId: string]: StockEntry;
  };
  notes?: string;
};

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  deliveries: DailyStockEntry[];
  inventory?: {
    full?: {
      [productId: string]: {
        openingStock: number;
        received: number;
        refill: number;
        nc: number;
        surrender: number;
      };
    };
    empty?: {
      [productId: string]: {
        openingStock: number;
        received: number;
        transferOut: number;
        defective: number;
        plantDispatch: number;
        surrender: number;
      };
    };
  };
};

export type Kpi = {
    title: string;
    value: string;
    description: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    Icon: React.ElementType;
}

export type DueInfo = {
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  full: number;
  empty: number;
  due: number;
}

export type EmployeeDue = {
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  dues: {
    [productId: string]: number;
  };
};

export type Expense = {
    id: string;
    date: string; // YYYY-MM-DD
    type: string;
    description: string;
    amount: number;
    enteredBy: string;
};


export type PaymentEntry = {
    nos: number;
    amount: number;
};

export type SalesEntry = {
    cash: PaymentEntry;
    digital: PaymentEntry;
    prepaid: PaymentEntry;
};

export type EmployeeSales = {
    employeeId: string;
    products: {
        [productId: string]: SalesEntry;
    };
};

export type SalesRecord = {
    date: string; // YYYY-MM-DD
    sales: EmployeeSales[];
};
