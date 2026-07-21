import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import {
  loadDatabase,
  saveDatabase,
  User,
  Employee,
  Customer,
  Device,
  RepairTicket,
  StatusHistory,
  Invoice,
  Payment,
  InventoryItem,
  StockMovement,
  Supplier,
  Expense,
  AppNotification
} from './db.ts';
import { encryptPassword, decryptPassword } from './crypto.ts';
import { MailService } from './mail.ts';

const router = express.Router();
const JWT_SECRET = 'repairhub-pro-super-secret-key-2026';

// -----------------------------------------------------------------------------
// Pure Crypto JWT Utility (Zero Dependencies, Fully Robust)
// -----------------------------------------------------------------------------
export function signToken(payload: any, expiresInSeconds: number = 86400): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');
    
  return `${b64Header}.${b64Payload}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [b64Header, b64Payload, signature] = token.split('.');
    if (!b64Header || !b64Payload || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Helper to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// -----------------------------------------------------------------------------
// Middlewares & Rate Limiting
// -----------------------------------------------------------------------------
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Receptionist' | 'Technician' | 'Customer';
    ticketId?: string; // For ticket-scoped login
    scoped?: boolean;
  };
}

// Authentication Middlewares
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No authentication token provided' } });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid or expired authentication token' } });
  }
  
  req.user = decoded;
  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (req.user.scoped) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Ticket-scoped session cannot perform this action' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Required role not met. Allowed roles: ${roles.join(', ')}` } });
    }
    next();
  };
}

// In-Memory Simple Rate Limiter to guard auth and booking endpoints
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const tracker = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - tracker.lastReset > windowMs) {
      tracker.count = 1;
      tracker.lastReset = now;
    } else {
      tracker.count++;
    }
    rateLimitMap.set(ip, tracker);

    if (tracker.count > limit) {
      return res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } });
    }
    next();
  };
}

const authRateLimit = rateLimiter(15, 60 * 1000); // 15 req/min
const publicBookingRateLimit = rateLimiter(10, 60 * 1000); // 10 req/min

// -----------------------------------------------------------------------------
// Auth Endpoints
// -----------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  rememberMe: z.boolean().optional()
});

router.post('/auth/login', authRateLimit, (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } });
  }

  const { email, password, rememberMe } = result.data;
  const db = loadDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  // Generate tokens
  const expiresIn = rememberMe ? 30 * 86400 : 86400; // 30 days vs 1 day
  const token = signToken({ id: user.id, email: user.email, role: user.role }, expiresIn);

  // Find employee or customer profile
  let name = user.email;
  let profileId = '';
  if (user.role === 'Customer') {
    const cust = db.customers.find(c => c.userId === user.id);
    if (cust) { name = cust.name; profileId = cust.id; }
  } else {
    const emp = db.employees.find(e => e.userId === user.id);
    if (emp) { name = emp.name; profileId = emp.id; }
  }

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name, profileId }
  });
});

// Ticket-scoped light login (Ticket + Mobile, no password)
const ticketLoginSchema = z.object({
  ticketNumber: z.string().min(3, 'Ticket number is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits')
});

router.post('/auth/ticket-login', authRateLimit, (req, res) => {
  const result = ticketLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } });
  }

  const { ticketNumber, mobile } = result.data;
  const db = loadDatabase();

  const ticket = db.repairTickets.find(t => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase());
  if (!ticket) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No ticket found with this number.' } });
  }

  const device = db.devices.find(d => d.id === ticket.deviceId);
  if (!device) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Device associated with ticket not found.' } });
  }

  const customer = db.customers.find(c => c.id === device.customerId);
  if (!customer || customer.mobile.replace(/\s+/g, '') !== mobile.replace(/\s+/g, '')) {
    return res.status(400).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Ticket number and Mobile number combination does not match our records.' } });
  }

  // Issue scoped short-lived token (1 hour)
  const token = signToken({
    id: `scoped-${ticket.id}`,
    email: customer.email,
    role: 'Customer',
    ticketId: ticket.id,
    scoped: true
  }, 3600);

  res.json({
    token,
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    customerName: customer.name
  });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) return res.sendStatus(401);
  const db = loadDatabase();
  
  if (req.user.scoped) {
    const ticket = db.repairTickets.find(t => t.id === req.user?.ticketId);
    return res.json({
      scoped: true,
      ticketId: req.user.ticketId,
      ticketNumber: ticket?.ticketNumber,
      role: 'Customer'
    });
  }

  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

  let name = user.email;
  let profileId = '';
  if (user.role === 'Customer') {
    const cust = db.customers.find(c => c.userId === user.id);
    if (cust) { name = cust.name; profileId = cust.id; }
  } else {
    const emp = db.employees.find(e => e.userId === user.id);
    if (emp) { name = emp.name; profileId = emp.id; }
  }

  res.json({
    user: { id: user.id, email: user.email, role: user.role, name, profileId }
  });
});

// -----------------------------------------------------------------------------
// Public Booking & Tracking
// -----------------------------------------------------------------------------
const bookingSchema = z.object({
  deviceType: z.string(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  imei: z.string().optional(),
  serialNumber: z.string().optional(),
  accessories: z.string().optional(),
  condition: z.string().min(3, 'Device condition is required'),
  issue: z.string().min(5, 'Issue details are required'),
  password: z.string().optional(),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Invalid email'),
  customerMobile: z.string().min(10, 'Mobile must be at least 10 digits')
});

router.post('/public/book-repair', publicBookingRateLimit, (req, res) => {
  const result = bookingSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } });
  }

  const data = result.data;
  const db = loadDatabase();

  // Find or create customer
  let customer = db.customers.find(c => c.mobile.replace(/\s+/g, '') === data.customerMobile.replace(/\s+/g, ''));
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: data.customerName,
      email: data.customerEmail.toLowerCase(),
      mobile: data.customerMobile,
      createdAt: new Date().toISOString()
    };
    db.customers.push(customer);
  }

  // Encrypt device password
  const encryptedPassword = data.password ? encryptPassword(data.password) : undefined;

  // Create device
  const device: Device = {
    id: `dev-${Date.now()}`,
    customerId: customer.id,
    brand: data.brand,
    model: data.model,
    imei: data.imei,
    serialNumber: data.serialNumber,
    accessories: data.accessories,
    password: encryptedPassword,
    condition: data.condition,
    issue: data.issue,
    createdAt: new Date().toISOString()
  };
  db.devices.push(device);

  // Generate working unique Ticket ID (RHP-2026-XXXX)
  const ticketIdNum = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `RHP-2026-${ticketIdNum}`;

  // Create ticket
  const ticket: RepairTicket = {
    id: `tkt-${Date.now()}`,
    ticketNumber,
    deviceId: device.id,
    images: [],
    costEstimate: 0,
    status: 'Booked',
    qrCode: `REPAIR_QR_${ticketIdNum}`,
    barcode: `REPAIR_BAR_${ticketIdNum}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.repairTickets.push(ticket);

  // Create timeline history
  const statusHistory: StatusHistory = {
    id: `sh-${Date.now()}`,
    ticketId: ticket.id,
    status: 'Booked',
    changedBy: 'Customer (Online Booking)',
    notes: `Initial booking submitted online. Device: ${data.brand} ${data.model}`,
    createdAt: new Date().toISOString()
  };
  db.statusHistories.push(statusHistory);

  // Pre-generate pending invoice
  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    ticketId: ticket.id,
    invoiceNumber: `INV-2026-${ticketIdNum}`,
    amount: 0,
    taxRate: db.settings.taxRate,
    taxAmount: 0,
    discount: 0,
    total: 0,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  db.invoices.push(invoice);

  // Send app alert for staff
  const staffNotification: AppNotification = {
    id: `n-${Date.now()}`,
    title: 'New Online Booking',
    message: `New booking ${ticketNumber} registered by ${customer.name} (${device.brand} ${device.model}).`,
    read: false,
    roleTarget: 'Receptionist',
    createdAt: new Date().toISOString()
  };
  db.notifications.push(staffNotification);

  saveDatabase(db);

  // Email Notification
  MailService.sendMail({
    to: customer.email,
    subject: `Repair Booking Received - Ticket ${ticketNumber}`,
    text: `Hello ${customer.name},\n\nWe have received your booking request! Your Appointment/Ticket ID is ${ticketNumber}.\n\nYou can track your repair progress anytime on our portal using this Ticket Number and your mobile number.\n\nThank you,\nRepairHub Pro`
  }).catch(err => console.error('Booking mail failed:', err));

  res.json({
    ticketId: ticket.id,
    ticketNumber,
    message: 'Booking completed successfully'
  });
});

// Track repair status (Public)
router.get('/public/track-repair', (req, res) => {
  const { query } = req.query; // Ticket Number OR Mobile Number
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Tracking query is required' } });
  }

  const db = loadDatabase();
  const qStr = query.trim().toUpperCase();

  let ticket: RepairTicket | undefined;

  // Check if ticket number matches
  ticket = db.repairTickets.find(t => t.ticketNumber.toUpperCase() === qStr);

  if (!ticket) {
    // If not ticket, look up customer mobile
    const customer = db.customers.find(c => c.mobile.replace(/\s+/g, '') === qStr.replace(/\s+/g, ''));
    if (customer) {
      // Get latest ticket for this customer
      const custDevices = db.devices.filter(d => d.customerId === customer.id);
      const devIds = custDevices.map(d => d.id);
      const custTickets = db.repairTickets.filter(t => devIds.includes(t.deviceId));
      // Sort latest first
      custTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      ticket = custTickets[0];
    }
  }

  if (!ticket) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No repairs found for the provided Ticket Number or Mobile Number.' } });
  }

  const device = db.devices.find(d => d.id === ticket.deviceId);
  const customer = device ? db.customers.find(c => c.id === device.customerId) : null;
  const history = db.statusHistories.filter(h => h.ticketId === ticket!.id)
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const invoice = db.invoices.find(i => i.ticketId === ticket!.id);

  let techName = 'Assigning Tech...';
  if (ticket.assignedTechnicianId) {
    const tech = db.employees.find(e => e.id === ticket!.assignedTechnicianId);
    if (tech) techName = tech.name;
  }

  res.json({
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      costEstimate: ticket.costEstimate,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      assignedTechnicianName: techName,
      qrCode: ticket.qrCode,
      barcode: ticket.barcode
    },
    device: device ? { brand: device.brand, model: device.model, condition: device.condition, issue: device.issue } : null,
    customer: customer ? { name: customer.name } : null,
    timeline: history,
    invoice: invoice ? { status: invoice.status, total: invoice.total } : null
  });
});

// -----------------------------------------------------------------------------
// Ticket Details (Scoped or Authenticated)
// -----------------------------------------------------------------------------
router.get('/tickets/:ticketId', authenticateToken, (req: AuthRequest, res) => {
  const { ticketId } = req.params;
  const db = loadDatabase();

  // If scoped session, restrict to their specific ticket ID
  if (req.user?.scoped && req.user.ticketId !== ticketId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized ticket access' } });
  }

  const ticket = db.repairTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const device = db.devices.find(d => d.id === ticket.deviceId);
  if (!device) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Device not found' } });
  }

  const customer = db.customers.find(c => c.id === device.customerId);
  const timeline = db.statusHistories.filter(s => s.ticketId === ticket.id)
                     .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const invoice = db.invoices.find(i => i.ticketId === ticket.id);

  // Decrypt password only for Staff roles, keep hidden or masked for Customer roles!
  const isStaff = ['Admin', 'Manager', 'Receptionist', 'Technician'].includes(req.user?.role || '');
  let passwordPlain = '';
  if (isStaff && device.password) {
    passwordPlain = decryptPassword(device.password);
  } else if (device.password) {
    passwordPlain = '••••••••';
  }

  res.json({
    ticket,
    device: {
      ...device,
      passwordPlain
    },
    customer,
    timeline,
    invoice
  });
});

// -----------------------------------------------------------------------------
// Customer Portal (Customer Authenticated Only)
// -----------------------------------------------------------------------------
router.get('/customer/tickets', authenticateToken, requireRole(['Customer']), (req: AuthRequest, res) => {
  const db = loadDatabase();
  const customer = db.customers.find(c => c.userId === req.user?.id);
  if (!customer) {
    return res.json([]);
  }

  const custDevices = db.devices.filter(d => d.customerId === customer.id);
  const devIds = custDevices.map(d => d.id);
  const tickets = db.repairTickets.filter(t => devIds.includes(t.deviceId))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const result = tickets.map(t => {
    const dev = custDevices.find(d => d.id === t.deviceId);
    const inv = db.invoices.find(i => i.ticketId === t.id);
    return {
      ticket: t,
      device: dev,
      invoice: inv
    };
  });

  res.json(result);
});

// Customer approves/rejects estimate online
router.post('/tickets/:ticketId/estimate-action', authenticateToken, requireRole(['Customer']), (req: AuthRequest, res) => {
  const { ticketId } = req.params;
  const { action, notes } = req.body; // 'Approve' or 'Reject'
  
  if (!['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Action must be Approve or Reject' } });
  }

  const db = loadDatabase();
  const ticket = db.repairTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  // Ensure this customer owns the device
  const device = db.devices.find(d => d.id === ticket.deviceId);
  const customer = device ? db.customers.find(c => c.id === device.customerId) : null;
  if (!customer || customer.userId !== req.user?.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this device' } });
  }

  const newStatus = action === 'Approve' ? 'Estimate_Approved' : 'Estimate_Rejected';
  ticket.status = newStatus;
  ticket.updatedAt = new Date().toISOString();

  // Create status history
  const statusHistory: StatusHistory = {
    id: `sh-${Date.now()}`,
    ticketId: ticket.id,
    status: newStatus,
    changedBy: `Customer: ${customer.name}`,
    notes: notes || `Customer responded to estimate: ${action}d.`,
    createdAt: new Date().toISOString()
  };
  db.statusHistories.push(statusHistory);

  // Send app alert for technicians
  const staffNotification: AppNotification = {
    id: `n-${Date.now()}`,
    title: `Estimate ${action}d`,
    message: `Customer ${customer.name} ${action}d the estimate of ₹${ticket.costEstimate} for ticket ${ticket.ticketNumber}.`,
    read: false,
    roleTarget: 'Manager',
    createdAt: new Date().toISOString()
  };
  db.notifications.push(staffNotification);

  saveDatabase(db);
  res.json({ success: true, status: newStatus });
});

// -----------------------------------------------------------------------------
// Admin / Staff Dashboard & Core Modules
// -----------------------------------------------------------------------------

// Dashboard KPI Stats & Charts
router.get('/staff/dashboard-stats', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Technician']), (req, res) => {
  const db = loadDatabase();

  // Basic Card Metrics
  const totalRepairs = db.repairTickets.length;
  const pendingRepairs = db.repairTickets.filter(t => !['Delivered', 'Cancelled'].includes(t.status)).length;
  const completedRepairs = db.repairTickets.filter(t => t.status === 'Ready_For_Pickup' || t.status === 'Delivered').length;
  const totalCustomers = db.customers.length;
  
  // Total Revenue calculation from Invoices (Total of PAID invoices)
  const totalRevenue = db.invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  // Total Expenses calculation
  const totalExpenses = db.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Device type breakdown
  const deviceTypes: Record<string, number> = {};
  db.devices.forEach(d => {
    const brand = d.brand || 'Other';
    deviceTypes[brand] = (deviceTypes[brand] || 0) + 1;
  });
  const deviceTypeData = Object.entries(deviceTypes).map(([name, value]) => ({ name, value }));

  // Status breakdown
  const statusMap: Record<string, number> = {};
  db.repairTickets.forEach(t => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Monthly Revenue breakdown for charts (last 6 months)
  // Group by format YYYY-MM
  const revenueByMonth: Record<string, number> = {};
  db.invoices.filter(i => i.status === 'Paid').forEach(i => {
    const month = i.createdAt.substring(0, 7); // e.g., '2026-03'
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(i.total);
  });
  const monthlyRevenueData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  res.json({
    metrics: {
      totalRevenue,
      totalExpenses,
      totalRepairs,
      pendingRepairs,
      completedRepairs,
      totalCustomers
    },
    charts: {
      deviceTypeData,
      statusData,
      monthlyRevenueData
    }
  });
});

// Notifications API
router.get('/notifications', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Technician']), (req: AuthRequest, res) => {
  const db = loadDatabase();
  const userRole = req.user?.role;
  // Filter notifications for user role
  const alerts = db.notifications
    .filter(n => !n.roleTarget || n.roleTarget === userRole)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(alerts);
});

router.post('/notifications/:id/read', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Technician']), (req, res) => {
  const db = loadDatabase();
  const notification = db.notifications.find(n => n.id === req.params.id);
  if (notification) {
    notification.read = true;
    saveDatabase(db);
  }
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Module 1: Customer Management
// -----------------------------------------------------------------------------
router.get('/customers', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist']), (req, res) => {
  const db = loadDatabase();
  res.json(db.customers);
});

router.post('/customers', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist']), (req, res) => {
  const schema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    mobile: z.string().min(10, 'Mobile is required')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
  }

  const db = loadDatabase();
  // Check unique mobile
  if (db.customers.some(c => c.mobile.replace(/\s+/g, '') === parsed.data.mobile.replace(/\s+/g, ''))) {
    return res.status(400).json({ error: { code: 'DUPLICATE', message: 'A customer with this mobile number already exists.' } });
  }

  const customer: Customer = {
    id: `cust-${Date.now()}`,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    mobile: parsed.data.mobile,
    createdAt: new Date().toISOString()
  };

  db.customers.push(customer);
  saveDatabase(db);
  res.status(211).json(customer);
});

router.put('/customers/:id', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist']), (req, res) => {
  const schema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    mobile: z.string().min(10, 'Mobile is required')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
  }

  const db = loadDatabase();
  const customer = db.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } });

  customer.name = parsed.data.name;
  customer.email = parsed.data.email;
  customer.mobile = parsed.data.mobile;

  saveDatabase(db);
  res.json(customer);
});

// -----------------------------------------------------------------------------
// Module 2: Repair Tickets (Intake, Status update, assignment)
// -----------------------------------------------------------------------------
router.get('/tickets', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Technician']), (req: AuthRequest, res) => {
  const db = loadDatabase();
  
  // If Technician, filter only assigned tickets
  let tickets = db.repairTickets;
  if (req.user?.role === 'Technician') {
    const employee = db.employees.find(e => e.userId === req.user?.id);
    if (employee) {
      tickets = db.repairTickets.filter(t => t.assignedTechnicianId === employee.id);
    }
  }

  const result = tickets.map(t => {
    const dev = db.devices.find(d => d.id === t.deviceId);
    const cust = dev ? db.customers.find(c => c.id === dev.customerId) : null;
    const inv = db.invoices.find(i => i.ticketId === t.id);
    let techName = '';
    if (t.assignedTechnicianId) {
      const tech = db.employees.find(e => e.id === t.assignedTechnicianId);
      if (tech) techName = tech.name;
    }
    return {
      ticket: t,
      device: dev,
      customer: cust,
      invoice: inv,
      technicianName: techName
    };
  });

  res.json(result);
});

// Update repair ticket status (with security encryption, log, mail alerts)
const ticketUpdateSchema = z.object({
  status: z.enum(['Booked', 'Inspected', 'Estimate_Approved', 'Estimate_Rejected', 'In_Repair', 'Quality_Check', 'Ready_For_Pickup', 'Delivered', 'Cancelled']),
  assignedTechnicianId: z.string().optional(),
  costEstimate: z.number().nonnegative().optional(),
  notes: z.string().optional()
});

router.put('/tickets/:id', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Technician']), (req: AuthRequest, res) => {
  const parsed = ticketUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
  }

  const { status, assignedTechnicianId, costEstimate, notes } = parsed.data;
  const db = loadDatabase();

  const ticket = db.repairTickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });

  const device = db.devices.find(d => d.id === ticket.deviceId);
  const customer = device ? db.customers.find(c => c.id === device.customerId) : null;

  const oldStatus = ticket.status;
  const statusChanged = oldStatus !== status;

  // Apply updates
  if (status) ticket.status = status;
  if (assignedTechnicianId !== undefined) ticket.assignedTechnicianId = assignedTechnicianId;
  if (costEstimate !== undefined) {
    ticket.costEstimate = costEstimate;
    // Update invoice base and totals
    const invoice = db.invoices.find(i => i.ticketId === ticket.id);
    if (invoice) {
      const taxRate = invoice.taxRate;
      // total = estimate
      invoice.total = costEstimate;
      // work backwards to find tax amount
      invoice.amount = Number((costEstimate / (1 + taxRate / 100)).toFixed(2));
      invoice.taxAmount = Number((costEstimate - invoice.amount).toFixed(2));
    }
  }
  if (notes) ticket.notes = notes;
  ticket.updatedAt = new Date().toISOString();

  // Create StatusHistory log entry
  const staffName = db.employees.find(e => e.userId === req.user?.id)?.name || req.user?.email || 'Staff';
  const history: StatusHistory = {
    id: `sh-${Date.now()}`,
    ticketId: ticket.id,
    status: status,
    changedBy: `Staff: ${staffName}`,
    notes: notes || `Status updated from ${oldStatus} to ${status}.`,
    createdAt: new Date().toISOString()
  };
  db.statusHistories.push(history);

  // Trigger outbound email alert on status change
  if (statusChanged && customer) {
    MailService.sendStatusUpdate(
      customer.email,
      customer.name,
      ticket.ticketNumber,
      status,
      notes
    ).catch(err => console.error('Status mail failed:', err));
  }

  saveDatabase(db);
  res.json(ticket);
});

// -----------------------------------------------------------------------------
// Module 3: Inventory Management
// -----------------------------------------------------------------------------
router.get('/inventory', authenticateToken, requireRole(['Admin', 'Manager', 'Technician']), (req, res) => {
  const db = loadDatabase();
  const items = db.inventoryItems.map(item => {
    const supplier = db.suppliers.find(s => s.id === item.supplierId);
    return {
      ...item,
      supplierName: supplier ? supplier.name : 'Unknown Supplier'
    };
  });
  res.json(items);
});

router.post('/inventory', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().int().nonnegative(),
    minQuantity: z.number().int().nonnegative(),
    price: z.number().nonnegative(),
    location: z.string().optional(),
    supplierId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  if (db.inventoryItems.some(i => i.sku.toUpperCase() === parsed.data.sku.toUpperCase())) {
    return res.status(400).json({ error: { code: 'DUPLICATE', message: 'An item with this SKU already exists.' } });
  }

  const item: InventoryItem = {
    id: `item-${Date.now()}`,
    ...parsed.data,
    createdAt: new Date().toISOString()
  };
  db.inventoryItems.push(item);

  // Stock movement log
  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    itemId: item.id,
    quantity: item.quantity,
    type: 'IN',
    reason: 'Initial stock intake',
    createdAt: new Date().toISOString()
  };
  db.stockMovements.push(movement);

  saveDatabase(db);
  res.json(item);
});

// Record parts used or restocked
router.post('/inventory/:id/movement', authenticateToken, requireRole(['Admin', 'Manager', 'Technician']), (req, res) => {
  const schema = z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
    type: z.enum(['IN', 'OUT']),
    reason: z.string().min(3, 'Reason details are required')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  const item = db.inventoryItems.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });

  const { quantity, type, reason } = parsed.data;

  if (type === 'OUT' && item.quantity < quantity) {
    return res.status(400).json({ error: { code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock available' } });
  }

  // Apply movement
  if (type === 'IN') {
    item.quantity += quantity;
  } else {
    item.quantity -= quantity;
  }

  // Log stock movement
  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    itemId: item.id,
    quantity,
    type,
    reason,
    createdAt: new Date().toISOString()
  };
  db.stockMovements.push(movement);

  // Trigger Low Stock notification if goes below limit
  if (item.quantity <= item.minQuantity) {
    const alert: AppNotification = {
      id: `n-${Date.now()}`,
      title: 'Low Stock Alert',
      message: `Low stock alert for SKU: ${item.sku}. Currently at ${item.quantity} (Min: ${item.minQuantity})`,
      read: false,
      roleTarget: 'Manager',
      createdAt: new Date().toISOString()
    };
    db.notifications.push(alert);
  }

  saveDatabase(db);
  res.json(item);
});

// -----------------------------------------------------------------------------
// Module 4: Suppliers
// -----------------------------------------------------------------------------
router.get('/suppliers', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const db = loadDatabase();
  res.json(db.suppliers);
});

router.post('/suppliers', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    mobile: z.string().optional(),
    address: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  const supplier: Supplier = {
    id: `spl-${Date.now()}`,
    name: parsed.data.name,
    contactPerson: parsed.data.contactPerson,
    email: parsed.data.email || undefined,
    mobile: parsed.data.mobile,
    address: parsed.data.address,
    createdAt: new Date().toISOString()
  };

  db.suppliers.push(supplier);
  saveDatabase(db);
  res.json(supplier);
});

// -----------------------------------------------------------------------------
// Module 5: Expenses
// -----------------------------------------------------------------------------
router.get('/expenses', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const db = loadDatabase();
  res.json(db.expenses);
});

router.post('/expenses', authenticateToken, requireRole(['Admin', 'Manager']), (req: AuthRequest, res) => {
  const schema = z.object({
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().optional(),
    date: z.string().min(1, 'Date is required')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  const expense: Expense = {
    id: `exp-${Date.now()}`,
    category: parsed.data.category,
    amount: parsed.data.amount,
    description: parsed.data.description,
    date: parsed.data.date,
    createdBy: req.user?.email || 'admin@repairhubpro.com',
    createdAt: new Date().toISOString()
  };

  db.expenses.push(expense);
  saveDatabase(db);
  res.json(expense);
});

// -----------------------------------------------------------------------------
// Module 6: Billing & Invoices (SIMULATED DUMMY PAYMENT ONLY)
// -----------------------------------------------------------------------------
router.get('/invoices', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist']), (req, res) => {
  const db = loadDatabase();
  const result = db.invoices.map(inv => {
    const ticket = db.repairTickets.find(t => t.id === inv.ticketId);
    const device = ticket ? db.devices.find(d => d.id === ticket.deviceId) : null;
    const cust = device ? db.customers.find(c => c.id === device.customerId) : null;
    return {
      invoice: inv,
      ticket,
      customer: cust
    };
  });
  res.json(result);
});

// Isolate payment and transaction simulator
router.post('/invoices/:id/simulate-payment', authenticateToken, requireRole(['Admin', 'Manager', 'Receptionist', 'Customer']), (req, res) => {
  const { paymentMethod, discount } = req.body; // e.g. Cash, Card, UPI
  if (!paymentMethod) {
    return res.status(400).json({ error: { code: 'INVALID_PAYMENT', message: 'Payment method label is required' } });
  }

  const db = loadDatabase();
  const invoice = db.invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });

  if (discount !== undefined && typeof discount === 'number') {
    invoice.discount = discount;
    invoice.total = Math.max(0, invoice.total - discount);
    // Recalculate base and tax
    const taxRate = invoice.taxRate;
    invoice.amount = Number((invoice.total / (1 + taxRate / 100)).toFixed(2));
    invoice.taxAmount = Number((invoice.total - invoice.amount).toFixed(2));
  }

  const transactionId = `DEMO-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Record simulated payment
  const payment: Payment = {
    id: `pmt-${Date.now()}`,
    invoiceId: invoice.id,
    amount: invoice.total,
    paymentMethod,
    transactionId,
    status: 'Success',
    createdAt: new Date().toISOString()
  };
  db.payments.push(payment);

  // Update invoice status
  invoice.status = 'Paid';
  invoice.paymentMethod = paymentMethod;
  invoice.transactionId = transactionId;

  // Also update parent ticket status to ready/delivered if applicable
  const ticket = db.repairTickets.find(t => t.id === invoice.ticketId);
  if (ticket && ticket.status === 'Ready_For_Pickup') {
    ticket.status = 'Delivered';
    ticket.updatedAt = new Date().toISOString();

    const history: StatusHistory = {
      id: `sh-${Date.now()}`,
      ticketId: ticket.id,
      status: 'Delivered',
      changedBy: 'System (Billing Success)',
      notes: `Invoice paid in full via ${paymentMethod}. Handover complete.`,
      createdAt: new Date().toISOString()
    };
    db.statusHistories.push(history);
  }

  saveDatabase(db);
  res.json({
    success: true,
    invoice,
    payment,
    transactionId
  });
});

// -----------------------------------------------------------------------------
// Module 7: Employee / Auth Records Management (Admin/Manager Role)
// -----------------------------------------------------------------------------
router.get('/employees', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const db = loadDatabase();
  const staff = db.employees.map(emp => {
    const user = db.users.find(u => u.id === emp.userId);
    return {
      id: emp.id,
      name: emp.name,
      mobile: emp.mobile,
      email: user ? user.email : '',
      role: user ? user.role : 'Technician',
      pinCode: emp.pinCode
    };
  });
  res.json(staff);
});

router.post('/employees', authenticateToken, requireRole(['Admin']), (req, res) => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().min(10, 'Mobile is required'),
    role: z.enum(['Admin', 'Manager', 'Receptionist', 'Technician']),
    password: z.string().min(5, 'Password must be at least 5 characters'),
    pinCode: z.string().min(4, 'PIN code must be at least 4 digits')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  // Unique email
  if (db.users.some(u => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return res.status(400).json({ error: { code: 'DUPLICATE', message: 'Employee with this email already exists.' } });
  }

  // Create auth User
  const user: User = {
    id: `u-emp-${Date.now()}`,
    email: parsed.data.email.toLowerCase(),
    passwordHash: hashPassword(parsed.data.password),
    role: parsed.data.role,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);

  // Create Employee
  const employee: Employee = {
    id: `emp-${Date.now()}`,
    userId: user.id,
    name: parsed.data.name,
    mobile: parsed.data.mobile,
    pinCode: parsed.data.pinCode,
    createdAt: new Date().toISOString()
  };
  db.employees.push(employee);

  saveDatabase(db);
  res.json({ id: employee.id, name: employee.name, email: user.email, role: user.role });
});

// -----------------------------------------------------------------------------
// Module 8: Settings Config File (Currency, GST rate)
// -----------------------------------------------------------------------------
router.get('/settings', (req, res) => {
  const db = loadDatabase();
  res.json(db.settings);
});

router.put('/settings', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const schema = z.object({
    businessName: z.string().min(1),
    businessEmail: z.string().email(),
    businessPhone: z.string().min(1),
    businessAddress: z.string().min(1),
    currencySymbol: z.string().min(1),
    currencyCode: z.string().min(1),
    taxLabel: z.string().min(1),
    taxRate: z.number().nonnegative()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });

  const db = loadDatabase();
  db.settings = {
    ...db.settings,
    ...parsed.data,
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db);
  res.json(db.settings);
});

// -----------------------------------------------------------------------------
// Reports Generator (JSON breakdown)
// -----------------------------------------------------------------------------
router.get('/reports', authenticateToken, requireRole(['Admin', 'Manager']), (req, res) => {
  const { start, end } = req.query; // YYYY-MM-DD
  const db = loadDatabase();

  const startDate = start ? new Date(start as string) : new Date('2026-01-01');
  const endDate = end ? new Date(end as string) : new Date();

  // Filter invoices paid in date range
  const paidInvoices = db.invoices.filter(i => {
    if (i.status !== 'Paid') return false;
    const invDate = new Date(i.createdAt);
    return invDate >= startDate && invDate <= endDate;
  });

  // Filter expenses in range
  const rangeExpenses = db.expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate >= startDate && expDate <= endDate;
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalTaxCollected = paidInvoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
  const totalExpenses = rangeExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Breakdown by brand
  const brandMetrics: Record<string, { count: number; revenue: number }> = {};
  paidInvoices.forEach(inv => {
    const ticket = db.repairTickets.find(t => t.id === inv.ticketId);
    const device = ticket ? db.devices.find(d => d.id === ticket.deviceId) : null;
    if (device) {
      const brand = device.brand || 'Other';
      if (!brandMetrics[brand]) brandMetrics[brand] = { count: 0, revenue: 0 };
      brandMetrics[brand].count++;
      brandMetrics[brand].revenue += Number(inv.total);
    }
  });

  res.json({
    summary: {
      totalRevenue,
      totalTaxCollected,
      totalExpenses,
      netProfit,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    },
    revenueInvoices: paidInvoices,
    expenseBreakdown: rangeExpenses,
    brandMetrics: Object.entries(brandMetrics).map(([brand, data]) => ({ brand, ...data }))
  });
});

export default router;
