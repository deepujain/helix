# Helix - Gas Cylinder Distribution Management System

A comprehensive local management system for gas cylinder distribution businesses. 

## 🚀 Features

### 📊 Dashboard
- **Real-time KPIs**: Track key metrics including total cylinders delivered, new connections, dues, and shrinkage
- **Overview Charts**: Visualize net cylinder flow and shrinkage trends over time
- **Top Performers**: Monitor top-performing employees and those with pending dues
- **Sales Analytics**: View sales distribution by payment type (Cash, Digital, Prepaid)

### 👥 Employee Management
- Add, edit, and manage employee information
- Track employee status (Active/Inactive)
- Store contact details, join dates, and birthdays
- Employee performance tracking
- Avatar support for easy identification
- **Document Upload**: Upload and store profile pictures and Aadhar cards
- Images saved locally in `public/images/employees/`

### 📦 Stock Management
- **Inventory Tracking**: Separate tracking for full and empty cylinders
- **Daily Stock Records**: Record opening stock, stock received, and sales
- **Delivery Management**: Track cylinders given to employees and returned cylinders
- **Automatic Calculations**: Closing balance automatically carries over to next day's opening stock
- **Product Management**: Support for multiple cylinder types (5kg, 10kg, 14.2kg, 19kg, 47.5kg)
- **Data Import**: Import stock data from external sources
- **Export functionality**: Export stock data to CSV

### 💰 Sales Recording
- Daily cylinder sales tracking by employee
- Payment type breakdown (Cash, Digital, Prepaid)
- Track number of cylinders and amounts
- Sales by product type
- Date-wise sales reports
- Export sales data to CSV

### 💵 Expense Management
- **Daily Expense Logging**: Record and categorize daily expenses
- **Expense Categories**: 
  - Tea, Load, Loader, Diesel/Petrol
  - Office Expenses, Water, Stationary
  - Bills, Porter, Computer Maintenance
  - Celebration, Vehicle Maintenance
  - Salary, Cleaning, Reimbursement, Transportation
- **Month-to-Date Insights**: View total expenses, top categories, and daily averages
- **Inline Editing**: Edit expenses directly in the table
- **Auto-save**: Changes are automatically saved
- **Export functionality**: Export expense data to CSV

### 🗂️ Data Persistence
- **Local Storage**: All data is stored locally using lowdb (JSON-based database)
- **No Cloud Dependencies**: Runs completely offline on your local machine
- **Database Location**: `helix-db.json` in project root directory
- **Image Storage**: Employee documents stored in `public/images/employees/`
- **Cross-platform**: Works on macOS and Windows

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.3 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI (Accessible, customizable components)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Database**: lowdb (Local JSON database)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or pnpm

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the application
npm run dev

# 3. Open browser at http://localhost:9002
```

The app will automatically create a `/data` directory and initialize the database with sample data on first run.

### Building for Production

```bash
npm run build    # Build the application
npm start        # Run production server
```

## 📁 Project Structure

```
Helix/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/              # API routes
│   │   │   ├── employees/    # Employee CRUD operations
│   │   │   ├── expenses/     # Expense CRUD operations
│   │   │   ├── products/     # Product operations
│   │   │   ├── sales/        # Sales CRUD operations
│   │   │   ├── stock/        # Stock CRUD operations
│   │   │   └── upload/       # Image upload handler
│   │   ├── employees/        # Employee management pages
│   │   ├── expenses/         # Expense tracking pages
│   │   ├── sales/            # Sales recording pages
│   │   ├── stock/            # Stock management pages
│   │   └── page.tsx          # Dashboard (home page)
│   ├── components/           # React components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── employees/        # Employee components
│   │   ├── sales/            # Sales components
│   │   ├── stock/            # Stock components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utilities and helpers
│   │   ├── db.ts             # Database setup and helpers
│   │   ├── data.ts           # Mock/seed data
│   │   ├── definitions.ts    # TypeScript type definitions
│   │   └── utils.ts          # Utility functions
│   └── hooks/                # Custom React hooks
├── public/
│   └── images/
│       └── employees/        # Employee document uploads
├── helix-db.json            # Local database (auto-generated)
```

## 🔧 Available Scripts

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 💾 Database

Helix uses lowdb, a simple local JSON database that stores all data in the `helix-db.json` file in the project root. The database includes:

- **Products**: Cylinder types and pricing
- **Employees**: Employee information and status
- **Daily Records**: Daily stock tracking
- **Sales Records**: Daily sales by employee
- **Expenses**: Daily expense logs

The database is automatically initialized with seed data on first run.

## 🎨 UI Components

Built with a custom design system using:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Custom components in `/src/components/ui`
- Responsive design for mobile and desktop

## 🔒 Data Privacy & Security

- **100% Local**: All data stored in `helix-db.json` on your machine
- **No Cloud**: Zero external API calls or cloud dependencies
- **No Internet Required**: Works completely offline
- **Simple Backups**: Just copy `helix-db.json` and `public/images/` folder

### Backup Recommendations

```bash
# Manual backup - Database
cp helix-db.json helix-db.backup.$(date +%Y%m%d).json

# Manual backup - Images
cp -r public/images/employees backups/images-$(date +%Y%m%d)

# On Windows
copy helix-db.json helix-db.backup.%date%.json
xcopy public\images\employees backups\images-%date% /E /I
```

## 🛠️ Troubleshooting

### Port Already in Use
Edit `package.json` and change the port in the dev script:
```json
"dev": "next dev --turbopack -p 9003"
```

### Database Not Initializing
1. Check file permissions on the project directory
2. Manually create `/data` directory if needed
3. Delete `/data/db.json` and restart to recreate

### Module Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Migration Notes

This application was migrated from Firebase to local storage:
- **Removed**: Firebase, Genkit AI, all cloud dependencies
- **Added**: lowdb for local JSON storage
- **Benefits**: Offline operation, no costs, complete data privacy
- **Data Location**: All entities stored in `/data/db.json`

## 📝 License

This project is private and proprietary.