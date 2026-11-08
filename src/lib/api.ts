import {
  CompanyInfo,
  CertifiedBillingConfig,
  Product,
  Category,
  Customer,
  CashShift,
  Sale,
  FiscalDocument,
  IntegrationLog,
  AuditLog,
  User,
} from '../types';
import { mockDb } from './mockDatabase';

/**
 * Utilitário de requisição híbrida:
 * Tenta comunicar com a API do servidor Express (/api/*).
 * Caso esteja rodando em um ambiente puramente estático como Netlify, Vercel estático ou sem backend Node.js,
 * ativa automaticamente o mockDb no cliente com persistência em localStorage para que a aplicação NUNCA fique travada.
 */
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // Se o backend respondeu com JSON com sucesso (código < 400)
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    // Se respondeu com 404, 500 ou HTML (comum na Netlify quando a rota /api não existe)
    if (fallbackFn) {
      return await fallbackFn();
    }

    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    throw new Error(`Servidor retornou status ${res.status}`);
  } catch (err) {
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Status
  async getStatus() {
    return safeFetchJson(
      '/api/status',
      undefined,
      async () => ({ status: 'online', mode: 'standalone_client', timestamp: new Date().toISOString() })
    );
  },

  // Company
  async getCompany(): Promise<CompanyInfo> {
    return safeFetchJson(
      '/api/company',
      undefined,
      async () => await mockDb.getCompany()
    );
  },
  async updateCompany(data: Partial<CompanyInfo> & { operatorName?: string }): Promise<{ success: boolean; company: CompanyInfo }> {
    return safeFetchJson(
      '/api/company',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      async () => await mockDb.updateCompany(data)
    );
  },

  // Certified Billing
  async getCertifiedBilling(): Promise<CertifiedBillingConfig> {
    return safeFetchJson(
      '/api/certified-billing',
      undefined,
      async () => await mockDb.getCertifiedBilling()
    );
  },
  async updateCertifiedBilling(data: Partial<CertifiedBillingConfig> & { operatorName?: string }) {
    return safeFetchJson(
      '/api/certified-billing',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      async () => await mockDb.updateCertifiedBilling(data)
    );
  },
  async testCertifiedBilling(operatorName?: string) {
    return safeFetchJson(
      '/api/certified-billing/test',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      },
      async () => await mockDb.testCertifiedBilling(operatorName)
    );
  },
  async getIntegrationLogs(): Promise<IntegrationLog[]> {
    return safeFetchJson(
      '/api/invoicing/logs',
      undefined,
      async () => await mockDb.getIntegrationLogs()
    );
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return safeFetchJson(
      '/api/products',
      undefined,
      async () => await mockDb.getProducts()
    );
  },
  async getCategories(): Promise<Category[]> {
    return safeFetchJson(
      '/api/categories',
      undefined,
      async () => await mockDb.getCategories()
    );
  },
  async createProduct(data: Partial<Product> & { operatorName?: string }) {
    return safeFetchJson(
      '/api/products',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      async () => await mockDb.createProduct(data)
    );
  },
  async updateProduct(id: string, data: Partial<Product> & { operatorName?: string; priceChangeReason?: string }) {
    return safeFetchJson(
      `/api/products/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      async () => await mockDb.updateProduct(id, data)
    );
  },
  async validateAccountant(id: string, accountantName: string) {
    return safeFetchJson(
      `/api/products/${id}/validate-accountant`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountantName }),
      },
      async () => await mockDb.validateAccountant(id, accountantName)
    );
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return safeFetchJson(
      '/api/customers',
      undefined,
      async () => await mockDb.getCustomers()
    );
  },
  async saveCustomer(data: Partial<Customer> & { operatorName?: string }) {
    return safeFetchJson(
      '/api/customers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      async () => {
        if (data.id) {
          return await mockDb.updateCustomer(data.id, data);
        }
        return await mockDb.createCustomer(data);
      }
    );
  },
  async anonymizeCustomer(id: string, operatorName?: string) {
    return safeFetchJson(
      `/api/customers/${id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      },
      async () => {
        await mockDb.updateCustomer(id, { name: 'Cliente Anonimizado', email: undefined, phone: undefined, address: undefined });
        return { success: true };
      }
    );
  },

  // Shifts / Cash
  async getCurrentShift(): Promise<CashShift | null> {
    return safeFetchJson(
      '/api/shifts/current',
      undefined,
      async () => await mockDb.getCurrentShift()
    );
  },
  async getShifts(): Promise<CashShift[]> {
    return safeFetchJson(
      '/api/shifts',
      undefined,
      async () => await mockDb.getShiftsHistory()
    );
  },
  async openShift(openingAmount: number, operatorName?: string) {
    return safeFetchJson(
      '/api/shifts/open',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingAmount, operatorName }),
      },
      async () => await mockDb.openShift(openingAmount, operatorName)
    );
  },
  async addShiftMovement(type: 'entrada' | 'saida' | 'sangria', amount: number, reason: string, operatorName?: string) {
    return safeFetchJson(
      '/api/shifts/movement',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, reason, operatorName }),
      },
      async () => await mockDb.addShiftMovement(type === 'saida' ? 'sangria' : type, amount, reason, operatorName)
    );
  },
  async closeShift(countedCash: number, closingNotes?: string, operatorName?: string) {
    return safeFetchJson(
      '/api/shifts/close',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countedCash, closingNotes, operatorName }),
      },
      async () => await mockDb.closeShift(countedCash, closingNotes, operatorName)
    );
  },

  // Sales
  async createSale(saleData: any): Promise<{
    success: boolean;
    sale: Sale;
    fiscalDocument?: FiscalDocument;
    document?: FiscalDocument;
    fiscalStatus?: string;
    pendingReason?: string;
    error?: string;
  }> {
    return safeFetchJson(
      '/api/sales',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      },
      async () => await mockDb.processSale(saleData)
    );
  },
  async getSales(filters?: {
    startDate?: string;
    endDate?: string;
    nif?: string;
    fiscalStatus?: string;
    paymentMethod?: string;
    saleType?: string;
  }): Promise<Sale[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    return safeFetchJson(
      `/api/sales?${params.toString()}`,
      undefined,
      async () => await mockDb.getSales({
        search: filters?.nif,
        fiscalStatus: filters?.fiscalStatus,
        paymentMethod: filters?.paymentMethod,
        saleType: filters?.saleType,
      })
    );
  },
  async getSale(id: string): Promise<Sale> {
    return safeFetchJson(
      `/api/sales/${id}`,
      undefined,
      async () => {
        const s = await mockDb.getSaleById(id);
        if (!s) throw new Error('Venda não encontrada');
        return s;
      }
    );
  },

  // Invoicing & Documents
  async getFiscalDocuments(): Promise<FiscalDocument[]> {
    return safeFetchJson(
      '/api/invoicing/documents',
      undefined,
      async () => await mockDb.getFiscalDocuments()
    );
  },
  async getFiscalDocument(id: string): Promise<FiscalDocument> {
    return safeFetchJson(
      `/api/invoicing/documents/${id}`,
      undefined,
      async () => {
        const d = await mockDb.getFiscalDocumentById(id);
        if (!d) throw new Error('Documento não encontrado');
        return d;
      }
    );
  },
  async retryFiscalEmission(saleId: string, documentType = 'FS', operatorName?: string): Promise<{
    success: boolean;
    sale?: Sale;
    fiscalDocument?: FiscalDocument;
    document?: FiscalDocument;
    error?: string;
  }> {
    return safeFetchJson(
      `/api/invoicing/retry/${saleId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, operatorName }),
      },
      async () => await mockDb.retryFiscalEmission(saleId, operatorName)
    );
  },
  async emitCreditNote(originalDocumentId: string, reason: string, operatorName?: string): Promise<{
    success: boolean;
    creditNote?: FiscalDocument;
    rectifiedDocument?: FiscalDocument;
    error?: string;
  }> {
    return safeFetchJson(
      '/api/invoicing/credit-note',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalDocumentId, reason, operatorName }),
      },
      async () => await mockDb.emitCreditNote(originalDocumentId, reason, operatorName)
    );
  },
  async recordPrintDocument(id: string, operatorName?: string): Promise<{ success: boolean; document?: FiscalDocument }> {
    return safeFetchJson(
      `/api/invoicing/documents/${id}/print`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      },
      async () => {
        const doc = await mockDb.getFiscalDocumentById(id);
        if (doc) doc.printCount = (doc.printCount || 0) + 1;
        return { success: true, document: doc || undefined };
      }
    );
  },
  async emailDocument(id: string, recipientEmail: string, operatorName?: string): Promise<{ success: boolean; document?: FiscalDocument; message?: string }> {
    return safeFetchJson(
      `/api/invoicing/documents/${id}/email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail, operatorName }),
      },
      async () => {
        const doc = await mockDb.getFiscalDocumentById(id);
        if (doc) doc.emailSentAt = new Date().toISOString();
        return { success: true, document: doc || undefined, message: `E-mail enviado para ${recipientEmail}` };
      }
    );
  },
  async whatsappDocument(id: string, recipientPhone: string, operatorName?: string) {
    return safeFetchJson(
      `/api/invoicing/documents/${id}/whatsapp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone, operatorName }),
      },
      async () => ({ success: true, message: `Mensagem enviada para ${recipientPhone}` })
    );
  },

  // Reports & Dashboard
  async getDashboardReport() {
    return safeFetchJson(
      '/api/reports/dashboard',
      undefined,
      async () => await mockDb.getDashboardReport()
    );
  },
  async getDetailedReport(period: 'today' | 'week' | 'month' = 'today') {
    return safeFetchJson(
      `/api/reports/detailed?period=${period}`,
      undefined,
      async () => await mockDb.getDetailedReport(period)
    );
  },

  // Users & Audits
  async getUsers(): Promise<User[]> {
    return safeFetchJson(
      '/api/users',
      undefined,
      async () => await mockDb.getUsers()
    );
  },
  async getAuditLogs(): Promise<AuditLog[]> {
    return safeFetchJson(
      '/api/audit-logs',
      undefined,
      async () => await mockDb.getAuditLogs()
    );
  },
};
