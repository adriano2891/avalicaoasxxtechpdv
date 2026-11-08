import initialData from '../../data/database.json';
import {
  Product,
  Category,
  Customer,
  Sale,
  FiscalDocument,
  CashShift,
  CashMovement,
  IntegrationLog,
  AuditLog,
  CompanyInfo,
  CertifiedBillingConfig,
  User,
} from '../types';

const STORAGE_KEY = 'assx_tech_pdv_database_v1';

export interface LocalDatabaseSchema {
  company: CompanyInfo;
  certifiedBilling: CertifiedBillingConfig;
  users: User[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  fiscalDocuments: FiscalDocument[];
  shifts: CashShift[];
  integrationLogs: IntegrationLog[];
  auditLogs: AuditLog[];
}

export const getLocalDb = (): LocalDatabaseSchema => {
  if (typeof window === 'undefined') {
    return initialData as unknown as LocalDatabaseSchema;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const cloned = JSON.parse(JSON.stringify(initialData));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloned));
      return cloned;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler localStorage, utilizando semente padrão:', e);
    return JSON.parse(JSON.stringify(initialData));
  }
};

export const saveLocalDb = (data: LocalDatabaseSchema): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
};

export const mockDb = {
  getCompany: async (): Promise<CompanyInfo> => {
    const db = getLocalDb();
    return db.company;
  },

  updateCompany: async (data: Partial<CompanyInfo> & { operatorName?: string }): Promise<{ success: boolean; company: CompanyInfo }> => {
    const db = getLocalDb();
    db.company = { ...db.company, ...data };
    saveLocalDb(db);
    return { success: true, company: db.company };
  },

  getCertifiedBilling: async (): Promise<CertifiedBillingConfig> => {
    const db = getLocalDb();
    return db.certifiedBilling;
  },

  updateCertifiedBilling: async (data: Partial<CertifiedBillingConfig> & { operatorName?: string }) => {
    const db = getLocalDb();
    db.certifiedBilling = { ...db.certifiedBilling, ...data };
    saveLocalDb(db);
    return { success: true, config: db.certifiedBilling };
  },

  testCertifiedBilling: async (operatorName: string = 'Gregory') => {
    const db = getLocalDb();
    db.certifiedBilling.lastTestStatus = 'success';
    db.certifiedBilling.lastTestDate = new Date().toISOString();
    db.certifiedBilling.lastTestMessage = 'Comunicação validada com o módulo fiscal integrado.';
    saveLocalDb(db);
    return { success: true, message: db.certifiedBilling.lastTestMessage };
  },

  getUsers: async (): Promise<User[]> => {
    const db = getLocalDb();
    return db.users;
  },

  getCategories: async (): Promise<Category[]> => {
    const db = getLocalDb();
    return db.categories;
  },

  getProducts: async (): Promise<Product[]> => {
    const db = getLocalDb();
    return db.products;
  },

  createProduct: async (data: Partial<Product> & { operatorName?: string }) => {
    const db = getLocalDb();
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: data.name || 'Novo Produto',
      description: data.description || '',
      categoryId: data.categoryId || (db.categories[0]?.id || 'cat-diversos'),
      price: data.price !== undefined ? data.price : 10,
      ivaRate: (data.ivaRate !== undefined ? data.ivaRate : 13) as 6 | 13 | 23,
      ivaCode: data.ivaRate === 6 ? 'RED' : data.ivaRate === 23 ? 'NOR' : 'INT',
      isAccountantValidated: data.isAccountantValidated ?? true,
      accountantValidationDate: new Date().toISOString().split('T')[0],
      available: data.available ?? true,
      internalCode: data.internalCode || String(Date.now()).slice(-4),
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
      isFavorite: data.isFavorite ?? false,
      priceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.products.push(newProd);
    saveLocalDb(db);
    return { success: true, product: newProd };
  },

  updateProduct: async (id: string, data: Partial<Product> & { operatorName?: string; priceChangeReason?: string }) => {
    const db = getLocalDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');

    const old = db.products[idx];
    const priceChanged = data.price !== undefined && data.price !== old.price;
    const history = [...(old.priceHistory || [])];

    if (priceChanged && data.price !== undefined) {
      history.push({
        id: `ph-${Date.now()}`,
        oldPrice: old.price,
        newPrice: data.price,
        changedAt: new Date().toISOString(),
        changedBy: data.operatorName || 'Administrador',
        reason: data.priceChangeReason || 'Atualização manual no PDV',
      });
    }

    const updated: Product = {
      ...old,
      ...data,
      priceHistory: history,
      updatedAt: new Date().toISOString(),
    };

    db.products[idx] = updated;
    saveLocalDb(db);
    return { success: true, product: updated };
  },

  validateAccountant: async (id: string, accountantName: string) => {
    const db = getLocalDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');
    db.products[idx].isAccountantValidated = true;
    db.products[idx].accountantValidationDate = new Date().toISOString().split('T')[0];
    saveLocalDb(db);
    return { success: true, product: db.products[idx] };
  },

  getCustomers: async (): Promise<Customer[]> => {
    const db = getLocalDb();
    return db.customers;
  },

  createCustomer: async (data: Partial<Customer>) => {
    const db = getLocalDb();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name || 'Novo Cliente',
      nif: data.nif || '999999990',
      phone: data.phone,
      email: data.email,
      address: data.address,
      postalCode: data.postalCode || '04101-000',
      city: data.city || 'São Paulo',
      country: data.country || 'Brasil',
      rgpdConsent: true,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.customers.push(newCust);
    saveLocalDb(db);
    return { success: true, customer: newCust };
  },

  updateCustomer: async (id: string, data: Partial<Customer>) => {
    const db = getLocalDb();
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cliente não encontrado');
    db.customers[idx] = { ...db.customers[idx], ...data };
    saveLocalDb(db);
    return { success: true, customer: db.customers[idx] };
  },

  getCurrentShift: async (): Promise<CashShift | null> => {
    const db = getLocalDb();
    return db.shifts.find((s) => s.status === 'aberta') || null;
  },

  openShift: async (openingAmount: number, operatorName: string = 'Gregory'): Promise<CashShift> => {
    const db = getLocalDb();
    const existing = db.shifts.find((s) => s.status === 'aberta');
    if (existing) return existing;

    const shiftNumber = db.shifts.length + 1;
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      shiftNumber,
      openedAt: new Date().toISOString(),
      openedBy: operatorName,
      openingAmount,
      expectedCashAmount: openingAmount,
      status: 'aberta',
      movements: [],
      totals: {
        totalRevenue: 0,
        dinheiro: 0,
        cartao: 0,
        mbway: 0,
        outro: 0,
        cashIn: 0,
        cashOut: 0,
        salesCount: 0,
      },
    };
    db.shifts.unshift(newShift);
    saveLocalDb(db);
    return newShift;
  },

  addShiftMovement: async (type: 'entrada' | 'saida' | 'sangria', amount: number, reason: string, operatorName: string = 'Gregory'): Promise<CashShift> => {
    const db = getLocalDb();
    const shift = db.shifts.find((s) => s.status === 'aberta');
    if (!shift) throw new Error('Nenhuma sessão de caixa aberta');

    const mov: CashMovement = {
      id: `mov-${Date.now()}`,
      shiftId: shift.id,
      type,
      amount,
      reason,
      operatorName,
      timestamp: new Date().toISOString(),
    };

    shift.movements.push(mov);

    if (type === 'entrada') {
      shift.expectedCashAmount += amount;
      shift.totals.cashIn += amount;
    } else {
      shift.expectedCashAmount -= amount;
      shift.totals.cashOut += amount;
    }

    saveLocalDb(db);
    return shift;
  },

  closeShift: async (closingCountedAmount: number, closingNotes?: string, operatorName: string = 'Gregory'): Promise<CashShift> => {
    const db = getLocalDb();
    const shift = db.shifts.find((s) => s.status === 'aberta');
    if (!shift) throw new Error('Nenhuma sessão de caixa aberta');

    shift.closedAt = new Date().toISOString();
    shift.closedBy = operatorName;
    shift.closingCountedAmount = closingCountedAmount;
    shift.difference = closingCountedAmount - shift.expectedCashAmount;
    shift.closingNotes = closingNotes;
    shift.status = 'fechada';

    saveLocalDb(db);
    return shift;
  },

  getShiftsHistory: async (): Promise<CashShift[]> => {
    const db = getLocalDb();
    return db.shifts;
  },

  getSales: async (filters?: { search?: string; fiscalStatus?: string; saleType?: string; paymentMethod?: string }): Promise<Sale[]> => {
    const db = getLocalDb();
    let sales = [...db.sales];

    if (filters?.fiscalStatus && filters.fiscalStatus !== 'all') {
      sales = sales.filter((s) => s.fiscalStatus === filters.fiscalStatus);
    }
    if (filters?.saleType && filters.saleType !== 'all') {
      sales = sales.filter((s) => s.saleType === filters.saleType);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      sales = sales.filter((s) => s.payments.some((p) => p.method === filters.paymentMethod));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      sales = sales.filter(
        (s) =>
          s.receiptNumber.toLowerCase().includes(q) ||
          (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
          (s.customer?.nif && s.customer.nif.includes(q))
      );
    }

    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getSaleById: async (id: string): Promise<Sale | null> => {
    const db = getLocalDb();
    return db.sales.find((s) => s.id === id) || null;
  },

  processSale: async (saleData: any) => {
    const db = getLocalDb();

    // Auto-open shift if needed
    let shift = db.shifts.find((s) => s.status === 'aberta');
    if (!shift) {
      shift = await mockDb.openShift(100, saleData.operatorName || 'Gregory');
    }

    const saleId = `sale-${Date.now()}`;
    const seq = db.sales.length + 1;
    const receiptNumber = `PED-2026-${String(seq).padStart(4, '0')}`;
    const docNumber = `FS 2026/${seq}`;

    // Create Fiscal Document
    const fiscalDoc: FiscalDocument = {
      id: `doc-${Date.now()}`,
      saleId,
      documentType: 'FS',
      documentNumber: docNumber,
      series: 'FS2026',
      number: seq,
      atcud: `CS89J2-FS2026-${seq}`,
      qrCodeData: `A:${db.company.nif}*B:999999990*C:PT*D:FS*E:N*F:20260101*G:FS2026/${seq}*H:CS89J2-${seq}*I1:PT*I7:${saleData.totals.finalTotal.toFixed(2)}*I8:${saleData.totals.taxTotal.toFixed(2)}*N:${saleData.totals.taxTotal.toFixed(2)}*O:${saleData.totals.finalTotal.toFixed(2)}*Q:ABCD*R:${seq}`,
      signatureHash: 'Mh9q-Simulado-ASSX',
      certifiedSoftwareNumber: '2230/AT',
      certifiedSoftwareName: 'ASSX Fiscal Engine',
      issuedAt: new Date().toISOString(),
      customerName: saleData.customer?.name || 'Consumidor Final',
      customerNif: saleData.customer?.nif || '999999990',
      customerAddress: saleData.customer?.address,
      customerEmail: saleData.customer?.email,
      customerPhone: saleData.customer?.phone,
      operatorName: saleData.operatorName || 'Gregory',
      items: saleData.items,
      totals: saleData.totals,
      payments: saleData.payments,
      status: 'emitido',
      printCount: 0,
    };

    // Create Sale
    const newSale: Sale = {
      id: saleId,
      receiptNumber,
      createdAt: new Date().toISOString(),
      shiftId: shift.id,
      operatorId: 'usr-1',
      operatorName: saleData.operatorName || 'Gregory',
      customer: saleData.customer || { name: 'Consumidor Final', nif: '999999990' },
      saleType: saleData.saleType || 'dine_in',
      tableNumber: saleData.tableNumber,
      items: saleData.items,
      totals: saleData.totals,
      paymentStatus: 'pago',
      payments: saleData.payments,
      fiscalStatus: 'emitido',
      fiscalDocumentId: fiscalDoc.id,
      fiscalDocumentNumber: docNumber,
      notes: saleData.notes,
      orderReference: saleData.orderReference,
    };

    // Update Shift Totals
    shift.totals.totalRevenue += saleData.totals.finalTotal;
    shift.totals.salesCount += 1;
    for (const p of saleData.payments) {
      if (p.method === 'dinheiro') {
        shift.totals.dinheiro += p.amount;
        shift.expectedCashAmount += p.amount;
      } else if (p.method === 'cartao') {
        shift.totals.cartao += p.amount;
      } else if (p.method === 'mbway') {
        shift.totals.mbway += p.amount;
      } else {
        shift.totals.outro += p.amount;
      }
    }

    db.sales.unshift(newSale);
    db.fiscalDocuments.unshift(fiscalDoc);
    saveLocalDb(db);

    return {
      success: true,
      sale: newSale,
      fiscalDocument: fiscalDoc,
      document: fiscalDoc,
      fiscalStatus: 'emitido',
    };
  },

  retryFiscalEmission: async (saleId: string, operatorName: string = 'Gregory') => {
    const db = getLocalDb();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venda não encontrada');

    sale.fiscalStatus = 'emitido';
    const seq = db.fiscalDocuments.length + 1;
    const docNumber = `FS 2026/${seq}`;
    sale.fiscalDocumentNumber = docNumber;

    const fiscalDoc: FiscalDocument = {
      id: `doc-${Date.now()}`,
      saleId,
      documentType: 'FS',
      documentNumber: docNumber,
      series: 'FS2026',
      number: seq,
      atcud: `CS89J2-FS2026-${seq}`,
      qrCodeData: `A:${db.company.nif}*B:999999990*C:PT*D:FS*E:N*F:20260101*G:FS2026/${seq}*H:CS89J2-${seq}*I1:PT*I7:${sale.totals.finalTotal.toFixed(2)}*I8:${sale.totals.taxTotal.toFixed(2)}*N:${sale.totals.taxTotal.toFixed(2)}*O:${sale.totals.finalTotal.toFixed(2)}*Q:ABCD*R:${seq}`,
      signatureHash: 'Mh9q-Simulado-ASSX',
      certifiedSoftwareNumber: '2230/AT',
      certifiedSoftwareName: 'ASSX Fiscal Engine',
      issuedAt: new Date().toISOString(),
      customerName: sale.customer?.name || 'Consumidor Final',
      customerNif: sale.customer?.nif || '999999990',
      customerAddress: sale.customer?.address,
      customerEmail: sale.customer?.email,
      customerPhone: sale.customer?.phone,
      operatorName,
      items: sale.items,
      totals: sale.totals,
      payments: sale.payments,
      status: 'emitido',
      printCount: 0,
    };

    sale.fiscalDocumentId = fiscalDoc.id;
    db.fiscalDocuments.unshift(fiscalDoc);
    saveLocalDb(db);

    return {
      success: true,
      sale,
      fiscalDocument: fiscalDoc,
      document: fiscalDoc,
    };
  },

  getFiscalDocuments: async (): Promise<FiscalDocument[]> => {
    const db = getLocalDb();
    return db.fiscalDocuments.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  },

  getFiscalDocumentById: async (id: string): Promise<FiscalDocument | null> => {
    const db = getLocalDb();
    return db.fiscalDocuments.find((d) => d.id === id) || null;
  },

  emitCreditNote: async (documentId: string, reason: string, operatorName: string = 'Gregory') => {
    const db = getLocalDb();
    const doc = db.fiscalDocuments.find((d) => d.id === documentId);
    if (!doc) throw new Error('Documento fiscal não encontrado');
    if (doc.status === 'anulado') throw new Error('Documento já retificado anteriormente');

    const seq = db.fiscalDocuments.filter((d) => d.documentType === 'NC').length + 1;
    const ncNumber = `NC 2026/${seq}`;

    const creditNote: FiscalDocument = {
      ...doc,
      id: `doc-nc-${Date.now()}`,
      documentType: 'NC',
      documentNumber: ncNumber,
      series: 'NC2026',
      number: seq,
      atcud: `CS89J2-NC2026-${seq}`,
      issuedAt: new Date().toISOString(),
      operatorName,
      status: 'emitido',
      rectifiedByNC: undefined,
    };

    doc.status = 'anulado';
    doc.rectifiedByNC = ncNumber;

    const sale = db.sales.find((s) => s.id === doc.saleId);
    if (sale) {
      sale.fiscalStatus = 'anulado';
    }

    db.fiscalDocuments.unshift(creditNote);
    saveLocalDb(db);

    return {
      success: true,
      creditNote,
      rectifiedDocument: doc,
    };
  },

  getDashboardReport: async () => {
    const db = getLocalDb();
    const today = new Date().toISOString().split('T')[0];
    const todaySales = db.sales.filter((s) => s.createdAt.startsWith(today));
    const pendingSales = db.sales.filter((s) => s.fiscalStatus === 'pendente');

    const totalRevenue = todaySales.reduce((acc, s) => acc + s.totals.finalTotal, 0);
    const count = todaySales.length;

    let dinheiro = 0;
    let cartao = 0;
    let mbway = 0;

    for (const s of todaySales) {
      for (const p of s.payments) {
        if (p.method === 'dinheiro') dinheiro += p.amount;
        else if (p.method === 'cartao') cartao += p.amount;
        else if (p.method === 'mbway') mbway += p.amount;
      }
    }

    return {
      todayRevenue: totalRevenue,
      todaySalesCount: count,
      averageTicket: count > 0 ? totalRevenue / count : 0,
      paymentsBreakdown: { dinheiro, cartao, mbway },
      pendingCount: pendingSales.length,
      currentShift: db.shifts.find((s) => s.status === 'aberta') || null,
      certifiedBillingActive: db.certifiedBilling.isActive,
    };
  },

  getDetailedReport: async (period: 'today' | 'week' | 'month') => {
    const db = getLocalDb();
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const filtered = db.sales.filter((s) => new Date(s.createdAt) >= startDate);
    const grandTotal = filtered.reduce((acc, s) => acc + s.totals.finalTotal, 0);
    const salesCount = filtered.length;

    const taxBreakdown = {
      int13: { base: 0, amount: 0 },
      red6: { base: 0, amount: 0 },
      nor23: { base: 0, amount: 0 },
    };

    const productMap = new Map<string, { name: string; quantity: number; total: number }>();
    const serviceStats = { dine_in: 0, takeaway: 0, delivery: 0 };
    const operatorMap = new Map<string, { count: number; total: number }>();

    for (const s of filtered) {
      if (s.totals.ivaBreakdown) {
        for (const b of s.totals.ivaBreakdown) {
          if (b.rate === 13) {
            taxBreakdown.int13.base += b.base;
            taxBreakdown.int13.amount += b.amount;
          } else if (b.rate === 6) {
            taxBreakdown.red6.base += b.base;
            taxBreakdown.red6.amount += b.amount;
          } else if (b.rate === 23) {
            taxBreakdown.nor23.base += b.base;
            taxBreakdown.nor23.amount += b.amount;
          }
        }
      }

      const st = s.saleType || 'dine_in';
      if (st in serviceStats) {
        serviceStats[st as keyof typeof serviceStats] += s.totals.finalTotal;
      }

      const op = s.operatorName || 'Gregory';
      const curOp = operatorMap.get(op) || { count: 0, total: 0 };
      curOp.count += 1;
      curOp.total += s.totals.finalTotal;
      operatorMap.set(op, curOp);

      for (const item of s.items) {
        const cur = productMap.get(item.productName) || { name: item.productName, quantity: 0, total: 0 };
        cur.quantity += item.quantity;
        cur.total += item.total;
        productMap.set(item.productName, cur);
      }
    }

    return {
      grandTotal,
      salesCount,
      taxBreakdown,
      productBreakdown: Array.from(productMap.values()).sort((a, b) => b.total - a.total),
      serviceStats,
      operatorBreakdown: Array.from(operatorMap.entries()).map(([name, stat]) => ({
        name,
        count: stat.count,
        total: stat.total,
      })),
    };
  },

  getIntegrationLogs: async (): Promise<IntegrationLog[]> => {
    const db = getLocalDb();
    return db.integrationLogs;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const db = getLocalDb();
    return db.auditLogs;
  },
};
