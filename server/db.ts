import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Manager' | 'Receptionist' | 'Technician' | 'Customer';
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  pinCode: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface Device {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  imei?: string;
  serialNumber?: string;
  accessories?: string;
  password?: string; // Encrypted
  condition: string;
  issue: string;
  createdAt: string;
}

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  deviceId: string;
  assignedTechnicianId?: string;
  notes?: string;
  images: string[];
  costEstimate: number;
  status: 'Booked' | 'Inspected' | 'Estimate_Approved' | 'Estimate_Rejected' | 'In_Repair' | 'Quality_Check' | 'Ready_For_Pickup' | 'Delivered' | 'Cancelled';
  qrCode?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  ticketId: string;
  status: string;
  changedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  ticketId: string;
  invoiceNumber: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Partially_Paid' | 'Paid' | 'Refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  sku: string;
  location?: string;
  price: number;
  supplierId?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  address?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  currencySymbol: string;
  currencyCode: string;
  taxLabel: string;
  taxRate: number;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  roleTarget?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  employees: Employee[];
  customers: Customer[];
  devices: Device[];
  repairTickets: RepairTicket[];
  statusHistories: StatusHistory[];
  invoices: Invoice[];
  payments: Payment[];
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  expenses: Expense[];
  settings: Settings;
  notifications: AppNotification[];
}

const DB_PATH = path.resolve(process.cwd(), './data/db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      const defaultDb = getSeededData();
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
      return defaultDb;
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');
    if (!data.trim()) {
      const defaultDb = getSeededData();
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
      return defaultDb;
    }

    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Failed to load database. Returning seeded backup:', error);
    return getSeededData();
  }
}

export function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

function getSeededData(): DatabaseSchema {
  const users: User[] = [
    { id: 'u-admin-1', email: 'admin@repairhubpro.com', passwordHash: hashPassword('admin123'), role: 'Admin', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u-mgr-1', email: 'manager@repairhubpro.com', passwordHash: hashPassword('manager123'), role: 'Manager', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u-rcp-1', email: 'receptionist@repairhubpro.com', passwordHash: hashPassword('receptionist123'), role: 'Receptionist', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u-tech-1', email: 'tech1@repairhubpro.com', passwordHash: hashPassword('tech123'), role: 'Technician', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u-tech-2', email: 'tech2@repairhubpro.com', passwordHash: hashPassword('tech123'), role: 'Technician', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u-cust-1', email: 'customer@test.com', passwordHash: hashPassword('customer123'), role: 'Customer', createdAt: '2026-01-10T00:00:00Z' }
  ];

  const employees: Employee[] = [
    { id: 'emp-1', userId: 'u-admin-1', name: 'John Doe', mobile: '9876543210', pinCode: '1122', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'emp-2', userId: 'u-mgr-1', name: 'Alice Smith', mobile: '9876543211', pinCode: '2233', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'emp-3', userId: 'u-rcp-1', name: 'Bob Johnson', mobile: '9876543212', pinCode: '3344', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'emp-4', userId: 'u-tech-1', name: 'Devin Larson (Mobiles)', mobile: '9876543213', pinCode: '4455', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'emp-5', userId: 'u-tech-2', name: 'Gary Vance (Laptops)', mobile: '9876543214', pinCode: '5566', createdAt: '2026-01-01T00:00:00Z' }
  ];

  const customers: Customer[] = [
    { id: 'cust-1', userId: 'u-cust-1', name: 'Amit Kumar', email: 'customer@test.com', mobile: '9876500001', createdAt: '2026-01-10T12:00:00Z' },
    { id: 'cust-2', name: 'Priya Sharma', email: 'priya@gmail.com', mobile: '9876500002', createdAt: '2026-02-12T14:30:00Z' },
    { id: 'cust-3', name: 'Sanjay Patel', email: 'sanjay@outlook.com', mobile: '9876500003', createdAt: '2026-03-05T09:15:00Z' }
  ];

  const devices: Device[] = [
    { id: 'dev-1', customerId: 'cust-1', brand: 'Apple', model: 'iPhone 14 Pro', imei: '357291048201947', serialNumber: 'DNXG8201KL', accessories: 'Case, Box', password: '1111:9b1a82f09919f8b4491763a8a83fc30e', condition: 'Slight scratches on screen rim, no visual glass damage', issue: 'Battery drains rapidly and heats up during calls', createdAt: '2026-01-10T12:15:00Z' },
    { id: 'dev-2', customerId: 'cust-2', brand: 'MacBook', model: 'Air M2 13"', serialNumber: 'C02H201GLM', accessories: 'Apple original charger', password: '1111:0028e23fcbd453ffbd2ea61bda00a12c', condition: 'Perfect exterior', issue: 'Liquid damage from spilling water on the keyboard. Won\'t power on.', createdAt: '2026-02-12T14:40:00Z' },
    { id: 'dev-3', customerId: 'cust-3', brand: 'Samsung', model: 'Galaxy S23 Ultra', imei: '358291038101827', accessories: 'S-Pen inside', password: '1111:a25fb18128f72e9a8f278d3810a08e1a', condition: 'Cracked front display screen', issue: 'Screen replacement requested due to drop', createdAt: '2026-03-05T09:30:00Z' }
  ];

  const repairTickets: RepairTicket[] = [
    {
      id: 'tkt-1',
      ticketNumber: 'RHP-2026-1001',
      deviceId: 'dev-1',
      assignedTechnicianId: 'emp-4',
      notes: 'Inspected battery health. Health is at 74%. Needs full battery module replacement.',
      images: [],
      costEstimate: 4500,
      status: 'Ready_For_Pickup',
      qrCode: 'REPAIR_QR_1001',
      barcode: 'REPAIR_BAR_1001',
      createdAt: '2026-01-10T12:30:00Z',
      updatedAt: '2026-01-12T16:00:00Z'
    },
    {
      id: 'tkt-2',
      ticketNumber: 'RHP-2026-1002',
      deviceId: 'dev-2',
      assignedTechnicianId: 'emp-5',
      notes: 'Inspected board. Significant oxidation around the PMIC and RAM controller. Motherboard service needed.',
      images: [],
      costEstimate: 14500,
      status: 'In_Repair',
      qrCode: 'REPAIR_QR_1002',
      barcode: 'REPAIR_BAR_1002',
      createdAt: '2026-02-12T15:00:00Z',
      updatedAt: '2026-02-13T10:00:00Z'
    },
    {
      id: 'tkt-3',
      ticketNumber: 'RHP-2026-1003',
      deviceId: 'dev-3',
      assignedTechnicianId: 'emp-4',
      notes: 'Replaced screen with original AMOLED assembly. Tested touch and biometric response, both fully functional.',
      images: [],
      costEstimate: 18000,
      status: 'Delivered',
      qrCode: 'REPAIR_QR_1003',
      barcode: 'REPAIR_BAR_1003',
      createdAt: '2026-03-05T09:45:00Z',
      updatedAt: '2026-03-06T14:00:00Z'
    }
  ];

  const statusHistories: StatusHistory[] = [
    { id: 'sh-1', ticketId: 'tkt-1', status: 'Booked', changedBy: 'Receptionist: Bob Johnson', notes: 'Initial intake completed.', createdAt: '2026-01-10T12:30:00Z' },
    { id: 'sh-2', ticketId: 'tkt-1', status: 'Inspected', changedBy: 'Technician: Devin Larson', notes: 'Inspected battery health. Needs replacement.', createdAt: '2026-01-10T15:00:00Z' },
    { id: 'sh-3', ticketId: 'tkt-1', status: 'Estimate_Approved', changedBy: 'Customer (Portal)', notes: 'Customer approved estimate of ₹4500 via customer portal.', createdAt: '2026-01-11T10:00:00Z' },
    { id: 'sh-4', ticketId: 'tkt-1', status: 'In_Repair', changedBy: 'Technician: Devin Larson', notes: 'Battery replacement is underway.', createdAt: '2026-01-12T09:00:00Z' },
    { id: 'sh-5', ticketId: 'tkt-1', status: 'Ready_For_Pickup', changedBy: 'Technician: Devin Larson', notes: 'Replacement finished. Touch ID/Biometrics check normal.', createdAt: '2026-01-12T16:00:00Z' },

    { id: 'sh-6', ticketId: 'tkt-2', status: 'Booked', changedBy: 'Receptionist: Bob Johnson', notes: 'Water damage intake.', createdAt: '2026-02-12T15:00:00Z' },
    { id: 'sh-7', ticketId: 'tkt-2', status: 'Inspected', changedBy: 'Technician: Gary Vance', notes: 'Oxidation on RAM area. Estimate submitted.', createdAt: '2026-02-13T10:00:00Z' },

    { id: 'sh-8', ticketId: 'tkt-3', status: 'Booked', changedBy: 'Receptionist: Bob Johnson', notes: 'Display drop intake.', createdAt: '2026-03-05T09:45:00Z' },
    { id: 'sh-9', ticketId: 'tkt-3', status: 'Inspected', changedBy: 'Technician: Devin Larson', notes: 'Original OLED assembly replacement selected.', createdAt: '2026-03-05T11:00:00Z' },
    { id: 'sh-10', ticketId: 'tkt-3', status: 'In_Repair', changedBy: 'Technician: Devin Larson', notes: 'Active repair.', createdAt: '2026-03-05T14:00:00Z' },
    { id: 'sh-11', ticketId: 'tkt-3', status: 'Ready_For_Pickup', changedBy: 'Technician: Devin Larson', notes: 'Quality checks complete.', createdAt: '2026-03-06T10:00:00Z' },
    { id: 'sh-12', ticketId: 'tkt-3', status: 'Delivered', changedBy: 'Manager: Alice Smith', notes: 'Handed over to Sanjay Patel. Paid via Card.', createdAt: '2026-03-06T14:00:00Z' }
  ];

  const invoices: Invoice[] = [
    { id: 'inv-1', ticketId: 'tkt-1', invoiceNumber: 'INV-2026-1001', amount: 3813.56, taxRate: 18, taxAmount: 686.44, discount: 0, total: 4500, status: 'Pending', createdAt: '2026-01-12T16:00:00Z' },
    { id: 'inv-2', ticketId: 'tkt-2', invoiceNumber: 'INV-2026-1002', amount: 12288.14, taxRate: 18, taxAmount: 2211.86, discount: 0, total: 14500, status: 'Pending', createdAt: '2026-02-13T10:00:00Z' },
    { id: 'inv-3', ticketId: 'tkt-3', invoiceNumber: 'INV-2026-1003', amount: 15254.24, taxRate: 18, taxAmount: 2745.76, discount: 0, total: 18000, status: 'Paid', paymentMethod: 'Card', transactionId: 'TXN-93820183', createdAt: '2026-03-06T14:00:00Z' }
  ];

  const payments: Payment[] = [
    { id: 'pmt-1', invoiceId: 'inv-3', amount: 18000, paymentMethod: 'Card', transactionId: 'TXN-93820183', status: 'Success', createdAt: '2026-03-06T14:00:00Z' }
  ];

  const suppliers: Supplier[] = [
    { id: 'spl-1', name: 'Global Tech Spares Ltd.', contactPerson: 'Arun Mehta', email: 'arun@globaltechspares.in', mobile: '9182736450', address: 'Nehru Place, New Delhi, Delhi - 110019', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'spl-2', name: 'Original Parts Distributor', contactPerson: 'Sarah Lin', email: 'sarah@originalparts.com', mobile: '8877665544', address: 'Shenzhen Tech Road, China', createdAt: '2026-01-01T00:00:00Z' }
  ];

  const inventoryItems: InventoryItem[] = [
    { id: 'item-1', name: 'iPhone 14 Pro Original Battery Module', category: 'Batteries', quantity: 12, minQuantity: 5, sku: 'BATT-IPH14P', location: 'Drawer A-4', price: 2500, supplierId: 'spl-1', createdAt: '2026-01-02T10:00:00Z' },
    { id: 'item-2', name: 'Samsung Galaxy S23 Ultra Super AMOLED Assembly', category: 'Screens', quantity: 3, minQuantity: 5, sku: 'DISP-GALS23U', location: 'Shelf B-2', price: 9500, supplierId: 'spl-2', createdAt: '2026-01-02T10:00:00Z' },
    { id: 'item-3', name: 'MacBook Air M2 Keyboard Assembly (Black)', category: 'Input Devices', quantity: 2, minQuantity: 3, sku: 'KYBD-MBA-M2', location: 'Drawer C-1', price: 4200, supplierId: 'spl-1', createdAt: '2026-01-02T10:00:00Z' },
    { id: 'item-4', name: 'Universal USB-C Charging Port Board (Type-C)', category: 'Ports', quantity: 25, minQuantity: 10, sku: 'PORT-USBC-UNIV', location: 'Drawer A-12', price: 350, supplierId: 'spl-1', createdAt: '2026-01-02T10:00:00Z' }
  ];

  const stockMovements: StockMovement[] = [
    { id: 'mov-1', itemId: 'item-1', quantity: 20, type: 'IN', reason: 'Initial batch purchase', createdAt: '2026-01-02T10:30:00Z' },
    { id: 'mov-2', itemId: 'item-1', quantity: 1, type: 'OUT', reason: 'Used in Ticket RHP-2026-1001', createdAt: '2026-01-12T10:00:00Z' },
    { id: 'mov-3', itemId: 'item-2', quantity: 4, type: 'IN', reason: 'Initial purchase', createdAt: '2026-01-02T10:30:00Z' },
    { id: 'mov-4', itemId: 'item-2', quantity: 1, type: 'OUT', reason: 'Used in Ticket RHP-2026-1003', createdAt: '2026-03-05T14:30:00Z' }
  ];

  const expenses: Expense[] = [
    { id: 'exp-1', category: 'Utility', amount: 4200, description: 'Electricity bill - January 2026', date: '2026-02-01T10:00:00Z', createdBy: 'manager@repairhubpro.com', createdAt: '2026-02-01T10:00:00Z' },
    { id: 'exp-2', category: 'Rent', amount: 35000, description: 'Workshop shop space monthly rent', date: '2026-02-01T10:00:00Z', createdBy: 'admin@repairhubpro.com', createdAt: '2026-02-01T10:00:00Z' },
    { id: 'exp-3', category: 'Tools', amount: 8500, description: 'Micro-soldering heat gun and ESD tweezers set', date: '2026-02-15T15:00:00Z', createdBy: 'tech1@repairhubpro.com', createdAt: '2026-02-15T15:00:00Z' }
  ];

  const settings: Settings = {
    id: '1',
    businessName: 'RepairHub Pro',
    businessEmail: 'support@repairhubpro.com',
    businessPhone: '+91 98765 43210',
    businessAddress: '123 Tech Boulevard, Phase II, Electronic City, Bangalore, KA - 560100',
    currencySymbol: '₹',
    currencyCode: 'INR',
    taxLabel: 'GST',
    taxRate: 18,
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const notifications: AppNotification[] = [
    { id: 'n-1', title: 'Low Stock Alert', message: 'Samsung Galaxy S23 Ultra Super AMOLED Assembly quantity is below minimum stock level.', read: false, roleTarget: 'Manager', createdAt: '2026-03-05T14:31:00Z' },
    { id: 'n-2', title: 'New Booking Request', message: 'A new MacBook Air M2 booking request has been submitted by Priya Sharma.', read: true, roleTarget: 'Receptionist', createdAt: '2026-02-12T14:40:00Z' }
  ];

  return {
    users,
    employees,
    customers,
    devices,
    repairTickets,
    statusHistories,
    invoices,
    payments,
    inventoryItems,
    stockMovements,
    suppliers,
    expenses,
    settings,
    notifications
  };
}
