import type { Expense } from '../definitions';
import { format, subDays } from 'date-fns';

export const expenseTypes: string[] = [
  'Tea',
  'Load',
  'Loader',
  'Diesel/Petrol',
  'Office Expenses',
  'Water',
  'Stationary',
  'Bills',
  'Porter',
  'Computer Maintenance',
  'Celebration',
  'Vehicle Maintenance',
  'Salary',
  'Cleaning',
  'Reimbursement',
  'Transportation',
];

export const dailyExpenses: Expense[] = [
    {
        id: 'exp_1',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Diesel/Petrol',
        description: 'Generator refill',
        amount: 1200,
        enteredBy: 'Admin'
    },
    {
        id: 'exp_2',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Tea',
        description: 'For workers',
        amount: 100,
        enteredBy: 'Manager'
    },
    {
        id: 'exp_3',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Salary',
        description: 'Advance to John',
        amount: 2000,
        enteredBy: 'Admin'
    },
    {
        id: 'exp_4',
        date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        type: 'Vehicle Maintenance',
        description: 'Truck tire repair',
        amount: 3500,
        enteredBy: 'Admin'
    },
    {
        id: 'exp_5',
        date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        type: 'Load',
        description: 'Unloading charges',
        amount: 500,
        enteredBy: 'Manager'
    },
     {
        id: 'exp_6',
        date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
        type: 'Bills',
        description: 'Electricity Bill',
        amount: 4500,
        enteredBy: 'Admin'
    },
];
