import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import type { 
  Product, 
  Employee, 
  DailyRecord, 
  SalesRecord, 
  Expense 
} from './definitions';

export type Database = {
  products: Product[];
  employees: Employee[];
  dailyRecords: DailyRecord[];
  salesRecords: SalesRecord[];
  expenses: Expense[];
};

// Default data
const defaultData: Database = {
  products: [
    { id: 'prod_14kg', name: '14.2kg', unitCost: 855.50 },
    { id: 'prod_10kg', name: '10kg', unitCost: 611.50 },
    { id: 'prod_19kg', name: '19kg', unitCost: 1704.00 },
    { id: 'prod_5kg', name: '5kg', unitCost: 538.00 },
    { id: 'prod_47_5kg', name: '47.5kg', unitCost: 4700.00 },
  ],
  employees: [
    { id: 'emp_01', name: 'John Doe', phone: '9876543210', status: 'active', joinDate: '2022-01-15', avatarUrl: 'https://picsum.photos/seed/1/40/40', birthday: '1990-05-20' },
    { id: 'emp_02', name: 'Jane Smith', phone: '9876543211', status: 'active', joinDate: '2022-03-22', avatarUrl: 'https://picsum.photos/seed/2/40/40', birthday: '1992-08-12' },
    { id: 'emp_03', name: 'Peter Jones', phone: '9876543212', status: 'inactive', joinDate: '2021-11-30', avatarUrl: 'https://picsum.photos/seed/3/40/40', birthday: '1988-11-25' },
    { id: 'emp_04', name: 'Mary Johnson', phone: '9876543213', status: 'active', joinDate: '2023-02-10', avatarUrl: 'https://picsum.photos/seed/4/40/40', birthday: '1995-02-18' },
    { id: 'emp_05', name: 'David Williams', phone: '9876543214', status: 'active', joinDate: '2023-05-19', avatarUrl: 'https://picsum.photos/seed/5/40/40', birthday: '1993-07-30' },
    { id: 'emp_06', name: 'Sarah Brown', phone: '9876543215', status: 'active', joinDate: '2023-06-01', avatarUrl: 'https://picsum.photos/seed/6/40/40', birthday: '1991-09-05' },
    { id: 'emp_07', name: 'Michael Davis', phone: '9876543216', status: 'inactive', joinDate: '2022-08-14', avatarUrl: 'https://picsum.photos/seed/7/40/40', birthday: '1989-12-15' },
    { id: 'emp_08', name: 'Emily Wilson', phone: '9876543217', status: 'active', joinDate: '2023-09-20', avatarUrl: 'https://picsum.photos/seed/8/40/40', birthday: '1996-04-22' },
  ],
  dailyRecords: [
    {
      date: new Date().toISOString().split('T')[0],
      deliveries: [
        { employeeId: 'emp_01', products: { 'prod_5kg': { fullGiven: 10, emptyCollected: 8, newConnection: 1, due: 1 }, 'prod_10kg': { fullGiven: 5, emptyCollected: 5, newConnection: 0, due: 0 } } },
        { employeeId: 'emp_02', products: { 'prod_5kg': { fullGiven: 8, emptyCollected: 8, newConnection: 0, due: 0 }, 'prod_14kg': { fullGiven: 6, emptyCollected: 4, newConnection: 0, due: 2 } } },
        { employeeId: 'emp_04', products: { 'prod_19kg': { fullGiven: 12, emptyCollected: 12, newConnection: 0, due: 0 } } },
        { employeeId: 'emp_05', products: { 'prod_10kg': { fullGiven: 7, emptyCollected: 6, newConnection: 1, due: 0 }, 'prod_19kg': { fullGiven: 3, emptyCollected: 3, newConnection: 0, due: 0 } } },
      ],
    },
  ],
  salesRecords: [],
  expenses: [],
};

// Database file path - store in project root
const dbPath = path.join(process.cwd(), 'helix-db.json');

let db: Low<Database> | null = null;

// Migrate old database structure to new structure
function migrateDailyRecords(records: any[]): DailyRecord[] {
  return records.map(record => {
    // Check if record uses old structure
    if (record.entries || record.inventoryFull || record.inventoryEmpty) {
      return {
        date: record.date,
        deliveries: record.entries || record.deliveries || [],
        inventory: {
          full: record.inventoryFull || record.inventory?.full,
          empty: record.inventoryEmpty || record.inventory?.empty,
        },
      };
    }
    // Already using new structure
    return record;
  });
}

// Initialize database
export async function initDB() {
  if (db) return db;

  const adapter = new JSONFile<Database>(dbPath);
  db = new Low<Database>(adapter, defaultData);
  
  await db.read();
  
  // Initialize with default data if the database is empty
  if (!db.data) {
    db.data = defaultData;
    await db.write();
  } else {
    // Migrate old structure to new structure
    const needsMigration = db.data.dailyRecords.some(
      (record: any) => record.entries || record.inventoryFull || record.inventoryEmpty
    );
    
    if (needsMigration) {
      console.log('Migrating database to new structure...');
      db.data.dailyRecords = migrateDailyRecords(db.data.dailyRecords);
      await db.write();
      console.log('Migration complete!');
    }
  }

  return db;
}

// Get database instance
export async function getDB() {
  if (!db) {
    await initDB();
  }
  return db!;
}

// Helper functions for CRUD operations

// Products
export async function getProducts() {
  const database = await getDB();
  return database.data.products;
}

export async function addProduct(product: Product) {
  const database = await getDB();
  database.data.products.push(product);
  await database.write();
  return product;
}

// Employees
export async function getEmployees() {
  const database = await getDB();
  return database.data.employees;
}

export async function addEmployee(employee: Employee) {
  const database = await getDB();
  database.data.employees.push(employee);
  await database.write();
  return employee;
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const database = await getDB();
  const index = database.data.employees.findIndex(e => e.id === id);
  if (index !== -1) {
    database.data.employees[index] = { ...database.data.employees[index], ...updates };
    await database.write();
    return database.data.employees[index];
  }
  return null;
}

export async function deleteEmployee(id: string) {
  const database = await getDB();
  const index = database.data.employees.findIndex(e => e.id === id);
  if (index !== -1) {
    database.data.employees.splice(index, 1);
    await database.write();
    return true;
  }
  return false;
}

// Daily Records (Stock)
export async function getDailyRecords() {
  const database = await getDB();
  return database.data.dailyRecords;
}

export async function getDailyRecordByDate(date: string) {
  const database = await getDB();
  return database.data.dailyRecords.find(r => r.date === date);
}

export async function saveDailyRecord(record: DailyRecord) {
  const database = await getDB();
  const index = database.data.dailyRecords.findIndex(r => r.date === record.date);
  if (index !== -1) {
    database.data.dailyRecords[index] = record;
  } else {
    database.data.dailyRecords.push(record);
  }
  await database.write();
  return record;
}

// Sales Records
export async function getSalesRecords() {
  const database = await getDB();
  return database.data.salesRecords;
}

export async function getSalesRecordByDate(date: string) {
  const database = await getDB();
  return database.data.salesRecords.find(r => r.date === date);
}

export async function saveSalesRecord(record: SalesRecord) {
  const database = await getDB();
  const index = database.data.salesRecords.findIndex(r => r.date === record.date);
  if (index !== -1) {
    database.data.salesRecords[index] = record;
  } else {
    database.data.salesRecords.push(record);
  }
  await database.write();
  return record;
}

// Expenses
export async function getExpenses() {
  const database = await getDB();
  return database.data.expenses;
}

export async function getExpensesByDate(date: string) {
  const database = await getDB();
  return database.data.expenses.filter(e => e.date === date);
}

export async function addExpense(expense: Expense) {
  const database = await getDB();
  database.data.expenses.push(expense);
  await database.write();
  return expense;
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const database = await getDB();
  const index = database.data.expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    database.data.expenses[index] = { ...database.data.expenses[index], ...updates };
    await database.write();
    return database.data.expenses[index];
  }
  return null;
}

export async function deleteExpense(id: string) {
  const database = await getDB();
  const index = database.data.expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    database.data.expenses.splice(index, 1);
    await database.write();
    return true;
  }
  return false;
}
