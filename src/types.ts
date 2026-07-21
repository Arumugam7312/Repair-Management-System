export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Receptionist' | 'Technician' | 'Customer';
  name?: string;
  profileId?: string;
}

export interface Device {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  imei?: string;
  serialNumber?: string;
  accessories?: string;
  passwordPlain?: string;
  condition: string;
  issue: string;
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
  supplierName?: string;
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
