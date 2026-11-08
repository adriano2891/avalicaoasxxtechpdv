import React, { useState, useEffect } from 'react';
import { CompanyInfo, User, CashShift } from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { NavigationTabs, NavTab } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { SalesView } from './components/SalesView';
import { InvoicesView } from './components/InvoicesView';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { CashRegisterView } from './components/CashRegisterView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { RefreshCw, MapPin } from 'lucide-react';
import { APP_CONFIG } from './lib/config';
import { PosDraftOrder } from './types';
import { getPosDraft } from './lib/draftStorage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [posDraft, setPosDraft] = useState<PosDraftOrder | null>(() => getPosDraft());

  useEffect(() => {
    const handleDraftChange = () => {
      setPosDraft(getPosDraft());
    };
    window.addEventListener('pos_draft_updated', handleDraftChange);
    return () => window.removeEventListener('pos_draft_updated', handleDraftChange);
  }, []);

  const draftItemsCount = posDraft?.cartItems?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || 0;

  const loadInitialData = async () => {
    try {
      const [comp, uList, curShift, dashReport] = await Promise.all([
        api.getCompany(),
        api.getUsers(),
        api.getCurrentShift(),
        api.getDashboardReport(),
      ]);

      if (comp) setCompany(comp);
      if (uList && uList.length > 0) {
        setUsers(uList);
        if (!currentUser) {
          setCurrentUser(uList[0]);
        }
      }
      setActiveShift(curShift);
      if (dashReport) {
        setPendingInvoicesCount(dashReport.pendingCount || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    } finally {
      // Garantia de segurança contra travamentos em qualquer hospedagem (Netlify, Vercel, offline):
      setCompany((prev) => prev || {
        name: APP_CONFIG.appName,
        legalName: APP_CONFIG.company.legalName,
        nif: APP_CONFIG.company.cnpj,
        cae: '5611-2 - Restaurantes e Serviços de Alimentação e Bebidas',
        address: APP_CONFIG.demoAddress.formatted,
        postalCode: APP_CONFIG.demoAddress.postalCode,
        city: APP_CONFIG.demoAddress.city,
        country: 'Brasil',
        phone: APP_CONFIG.company.phone,
        email: APP_CONFIG.company.email,
        website: 'https://assxtech.com.br',
        shareCapital: 'R$ 50.000,00',
        commercialRegistry: 'JUCESP nº 35.214.892.310',
        logoUrl: '/assets/logos/official_logo.png',
      });
      setUsers((prev) => (prev.length > 0 ? prev : [{
        id: 'usr-1',
        name: 'Gregory',
        email: 'Gregory@assxtech.com.br',
        role: 'admin',
        pin: '1234',
        active: true,
      }]));
      setCurrentUser((prev) => prev || {
        id: 'usr-1',
        name: 'Gregory',
        email: 'Gregory@assxtech.com.br',
        role: 'admin',
        pin: '1234',
        active: true,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshShiftAndMetrics = async () => {
    try {
      const [curShift, dashReport] = await Promise.all([
        api.getCurrentShift(),
        api.getDashboardReport(),
      ]);
      setActiveShift(curShift);
      if (dashReport) {
        setPendingInvoicesCount(dashReport.pendingCount || 0);
      }
    } catch (err) {
      console.error('Erro ao atualizar métricas:', err);
    }
  };

  if (loading || !company || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-900 text-stone-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl shadow-lg">
            ASSX
          </div>
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-stone-400">
            Iniciando sistema {APP_CONFIG.appName}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${currentTab === 'pos' ? 'bg-[#0a1017] lg:bg-stone-100 h-screen h-[100dvh] supports-[height:100svh]:h-[100svh] lg:h-auto overflow-hidden lg:overflow-visible' : 'bg-stone-100'} text-stone-900 font-sans`}>
      {/* Barra de Topo */}
      <div className={`print:hidden ${currentTab === 'pos' ? 'hidden lg:block' : 'block'}`}>
        <Navbar
          currentUser={currentUser}
          users={users}
          onSelectUser={(u) => setCurrentUser(u)}
          activeShift={activeShift}
          onNavigateToPOS={() => setCurrentTab('pos')}
          onNavigateToShift={() => setCurrentTab('cash')}
          pendingInvoicesCount={pendingInvoicesCount}
          onNavigateToInvoices={() => setCurrentTab('invoices')}
          company={company}
          posDraftCount={draftItemsCount}
        />

        {/* Navegação por Separadores */}
        <NavigationTabs
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          pendingInvoicesCount={pendingInvoicesCount}
          posDraftCount={draftItemsCount}
        />
      </div>

      {/* Área de Conteúdo Principal */}
      <main className={
        currentTab === 'pos'
          ? 'flex-1 min-h-0 flex flex-col w-full mx-auto p-0 lg:p-3 max-w-none lg:max-w-[1800px] overflow-hidden lg:overflow-visible print:p-0'
          : 'flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none'
      }>
        {currentTab === 'dashboard' && (
          <DashboardView
            company={company}
            currentUser={currentUser.name}
            onStartSale={() => setCurrentTab('pos')}
            onOpenCash={() => setCurrentTab('cash')}
            onViewPendingInvoices={() => setCurrentTab('invoices')}
          />
        )}

        {currentTab === 'pos' && (
          <PosView
            company={company}
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
            onSaleCompleted={() => {
              refreshShiftAndMetrics();
              setPosDraft(getPosDraft());
            }}
            onBackToMainMenu={() => {
              setPosDraft(getPosDraft());
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'sales' && (
          <SalesView
            company={company}
            currentUser={currentUser.name}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoicesView
            company={company}
            currentUser={currentUser.name}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
            onProductSaved={refreshShiftAndMetrics}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
          />
        )}

        {currentTab === 'cash' && (
          <CashRegisterView
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
            onShiftStatusChanged={refreshShiftAndMetrics}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            company={company}
            currentUser={currentUser.name}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
            onCompanyUpdated={(c) => setCompany(c)}
          />
        )}
      </main>

      {/* Rodapé Institucional com Endereço Demonstrativo de São Paulo */}
      <footer className={`bg-white border-t border-stone-200 py-3 text-stone-500 text-[11px] print:hidden ${currentTab === 'pos' ? 'hidden lg:block' : 'block'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            &copy; 2026 <strong>{APP_CONFIG.appName}</strong> &bull; {APP_CONFIG.company.legalName} &bull; {APP_CONFIG.demoAddress.formatted} <span className="text-[10px] text-stone-400">({APP_CONFIG.demoAddress.notice})</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium text-stone-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Sistema Operacional de Vendas &amp; PDV</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
