import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, getExpensesByDate, addExpense, updateExpense, deleteExpense } from '@/lib/db';
import type { Expense } from '@/lib/definitions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (date) {
      const expenses = await getExpensesByDate(date);
      return NextResponse.json(expenses);
    }
    
    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const expense: Expense = await request.json();
    const newExpense = await addExpense(expense);
    return NextResponse.json(newExpense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const updated = await updateExpense(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
