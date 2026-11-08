import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  FileText,
  Utensils,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'invoices'
  | 'products'
  | 'customers'
  | 'cash'
  | 'reports'
  | 'settings';

interface NavigationTabsProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingInvoicesCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentTab,
  onTabChange,
  pendingInvoicesCount,
}) => {
  // Controle de expansão/colapso no mobile (inicia aberto para que todas as abas fiquem visíveis)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: LayoutDashboard },
    { id: 'pos', label: 'Nova Venda (PDV)', shortLabel: 'PDV', icon: ShoppingCart },
    { id: 'sales', label: 'Vendas', shortLabel: 'Vendas', icon: Receipt },
    {
      id: 'invoices',
      label: 'Notas Fiscais',
      shortLabel: 'Notas',
      icon: FileText,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
    },
    { id: 'products', label: 'Produtos', shortLabel: 'Produtos', icon: Utensils },
    { id: 'customers', label: 'Clientes', shortLabel: 'Clientes', icon: Users },
    { id: 'cash', label: 'Caixa', shortLabel: 'Caixa', icon: Wallet },
    { id: 'reports', label: 'Relatórios', shortLabel: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', shortLabel: 'Ajustes', icon: Settings },
  ];

  const currentTabObj = tabs.find((t) => t.id === currentTab) || tabs[0];
  const CurrentIcon = currentTabObj.icon;

  return (
    <nav className="bg-white border-b border-stone-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* =========================================================================
            1. VERSÃO DESKTOP / TABLET HORIZONTAL (Visível a partir de md:)
            ========================================================================= */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-1.5 py-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as NavTab)}
                className={`relative flex items-center gap-1.5 lg:gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            2. VERSÃO MOBILE (Smartphones e telas pequenas < md:)
            Todas as 9 abas perfeitamente visíveis, sem cortes, sem rolagem escondida
            ========================================================================= */}
        <div className="md:hidden py-1.5">
          {/* Barra de Status com Aba Atual e Botão de Expandir/Recolher */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-stone-100/90 rounded-xl mb-1.5 border border-stone-200">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Aba Ativa:</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs truncate">
                <CurrentIcon className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                <span className="truncate">{currentTabObj.label}</span>
                {currentTabObj.badge && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-600 text-white">
                    {currentTabObj.badge}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-1 text-[11px] font-bold text-stone-700 hover:text-stone-950 px-2 py-1 rounded-lg bg-white border border-stone-300 shadow-2xs cursor-pointer shrink-0"
              title="Alternar visualização completa das abas"
            >
              <Menu className="w-3.5 h-3.5 text-amber-600" />
              <span>{isMobileMenuOpen ? 'Ocultar' : 'Ver Todas (9)'}</span>
              {isMobileMenuOpen ? (
                <ChevronUp className="w-3 h-3 text-stone-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-stone-500" />
              )}
            </button>
          </div>

          {/* Grade 3x3 Responsiva - Todas as 9 abas 100% visíveis e acessíveis em 1 toque */}
          {isMobileMenuOpen && (
            <div className="grid grid-cols-3 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id as NavTab);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-center transition-all cursor-pointer min-h-[48px] ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm ring-2 ring-amber-400'
                        : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 active:scale-95'
                    }`}
                  >
                    {tab.badge && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-600 text-white shadow-xs">
                        {tab.badge}
                      </span>
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} />
                    <span className="text-[11px] leading-tight truncate w-full px-0.5">
                      {tab.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
