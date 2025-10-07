
import type { Product, Employee, DailyRecord, DueInfo, EmployeeDue, SalesRecord } from './definitions';

export const products: Product[] = [
  { id: 'prod_14kg', name: '14.2kg', unitCost: 855.50 },
  { id: 'prod_10kg', name: '10kg', unitCost: 611.50 },
  { id: 'prod_19kg', name: '19kg', unitCost: 1704.00 },
  { id: 'prod_5kg', name: '5kg', unitCost: 538.00 },
  { id: 'prod_47_5kg', name: '47.5kg', unitCost: 4700.00 },
];

export const employees: Employee[] = [
  { id: 'emp_01', name: 'John Doe', phone: '9876543210', status: 'active', joinDate: '2022-01-15', avatarUrl: 'https://picsum.photos/seed/1/40/40', birthday: '1990-05-20' },
  { id: 'emp_02', name: 'Jane Smith', phone: '9876543211', status: 'active', joinDate: '2022-03-22', avatarUrl: 'https://picsum.photos/seed/2/40/40', birthday: '1992-08-12' },
  { id: 'emp_03', name: 'Peter Jones', phone: '9876543212', status: 'inactive', joinDate: '2021-11-30', avatarUrl: 'https://picsum.photos/seed/3/40/40', birthday: '1988-11-25' },
  { id: 'emp_04', name: 'Mary Johnson', phone: '9876543213', status: 'active', joinDate: '2023-02-10', avatarUrl: 'https://picsum.photos/seed/4/40/40', birthday: '1995-02-18' },
  { id: 'emp_05', name: 'David Williams', phone: '9876543214', status: 'active', joinDate: '2023-05-19', avatarUrl: 'https://picsum.photos/seed/5/40/40', birthday: '1993-07-30' },
  { id: 'emp_06', name: 'Sarah Brown', phone: '9876543215', status: 'active', joinDate: '2023-06-01', avatarUrl: 'https://picsum.photos/seed/6/40/40', birthday: '1991-09-05' },
  { id: 'emp_07', name: 'Michael Davis', phone: '9876543216', status: 'inactive', joinDate: '2022-08-14', avatarUrl: 'https://picsum.photos/seed/7/40/40', birthday: '1989-12-15' },
  { id: 'emp_08', name: 'Emily Wilson', phone: '9876543217', status: 'active', joinDate: '2023-09-20', avatarUrl: 'https://picsum.photos/seed/8/40/40', birthday: '1996-04-22' },
];

export const officeEmployee: Employee = { id: 'office', name: 'Office', phone: '', status: 'active', joinDate: '', avatarUrl: 'https://picsum.photos/seed/office/40/40' };

export const dailyRecords: DailyRecord[] = [
  {
    date: new Date().toISOString().split('T')[0],
    deliveries: [
      { employeeId: 'emp_01', products: { 'prod_5kg': { fullGiven: 10, emptyCollected: 8, newConnection: 1, due: 1 }, 'prod_10kg': { fullGiven: 5, emptyCollected: 5, newConnection: 0, due: 0 } } },
      { employeeId: 'emp_02', products: { 'prod_5kg': { fullGiven: 8, emptyCollected: 8, newConnection: 0, due: 0 }, 'prod_14kg': { fullGiven: 6, emptyCollected: 4, newConnection: 0, due: 2 } } },
      { employeeId: 'emp_04', products: { 'prod_19kg': { fullGiven: 12, emptyCollected: 12, newConnection: 0, due: 0 } } },
      { employeeId: 'emp_05', products: { 'prod_10kg': { fullGiven: 7, emptyCollected: 6, newConnection: 1, due: 0 }, 'prod_19kg': { fullGiven: 3, emptyCollected: 3, newConnection: 0, due: 0 } } },
    ],
  },
];

export const topDueEmployees: DueInfo[] = [
    { employeeId: 'emp_02', employeeName: 'Jane Smith', employeeAvatar: 'https://picsum.photos/seed/2/40/40', full: 320, empty: 280, due: 40 },
    { employeeId: 'emp_01', employeeName: 'John Doe', employeeAvatar: 'https://picsum.photos/seed/1/40/40', full: 450, empty: 420, due: 30 },
    { employeeId: 'emp_05', employeeName: 'David Williams', employeeAvatar: 'https://picsum.photos/seed/5/40/40', full: 200, empty: 180, due: 20 },
    { employeeId: 'emp_06', employeeName: 'Sarah Brown', employeeAvatar: 'https://picsum.photos/seed/6/40/40', full: 150, empty: 140, due: 10 },
    { employeeId: 'emp_08', employeeName: 'Emily Wilson', employeeAvatar: 'https://picsum.photos/seed/8/40/40', full: 100, empty: 95, due: 5 },
].sort((a, b) => b.due - a.due);


export const netCylinderFlowData = products.map(product => {
  const given = Math.floor(Math.random() * 500) + 200;
  const received = Math.floor(Math.random() * given * 0.8) + (given * 0.1);
  const due = given - received;
  return {
    product: product.name,
    full: Math.round(given),
    empty: Math.round(received),
    due: Math.round(due),
  }
});

// Generate mock chart data for the last 30 days
const today = new Date();
export const netFlowChartData = products.map(product => ({
  product: product.name,
  data: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      netFlow: Math.floor(Math.random() * 20) - 10, // Random net flow between -10 and 10
    };
  }).reverse(),
}));

export const shrinkageTrendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      shrinkage: Math.floor(Math.random() * 3), // Random shrinkage between 0 and 2
    };
}).reverse();

export const employeeDues: EmployeeDue[] = [
  { 
    employeeId: 'emp_01', 
    employeeName: 'John Doe', 
    employeeAvatar: 'https://picsum.photos/seed/1/40/40', 
    dues: { 'prod_5kg': 5, 'prod_14kg': 2 } 
  },
  { 
    employeeId: 'emp_02', 
    employeeName: 'Jane Smith', 
    employeeAvatar: 'https://picsum.photos/seed/2/40/40', 
    dues: { 'prod_10kg': 10, 'prod_19kg': 1 } 
  },
  { 
    employeeId: 'emp_04', 
    employeeName: 'Mary Johnson', 
    employeeAvatar: 'https://picsum.photos/seed/4/40/40', 
    dues: { 'prod_47_5kg': 1 } 
  },
  { 
    employeeId: 'emp_05', 
    employeeName: 'David Williams', 
    employeeAvatar: 'https://picsum.photos/seed/5/40/40', 
    dues: { 'prod_5kg': 3, 'prod_10kg': 4, 'prod_19kg': 2 }
  },
  { 
    employeeId: 'emp_06', 
    employeeName: 'Sarah Brown', 
    employeeAvatar: 'https://picsum.photos/seed/6/40/40', 
    dues: { } 
  },
  { 
    employeeId: 'emp_08', 
    employeeName: 'Emily Wilson', 
    employeeAvatar: 'https://picsum.photos/seed/8/40/40', 
    dues: { 'prod_14kg': 6 } 
  },
];

export const initialSalesRecords: SalesRecord[] = [];
    

    
