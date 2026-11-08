import { PosDraftOrder } from '../types';

export const POS_DRAFT_KEY = 'assx_pos_draft_order';

export function getPosDraft(): PosDraftOrder | null {
  try {
    const raw = localStorage.getItem(POS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.cartItems) && parsed.cartItems.length > 0) {
      return parsed as PosDraftOrder;
    }
  } catch (err) {
    console.warn('Erro ao ler rascunho do PDV:', err);
  }
  return null;
}

export function savePosDraft(draft: PosDraftOrder): void {
  try {
    if (!draft || !draft.cartItems || draft.cartItems.length === 0) {
      clearPosDraft();
      return;
    }
    localStorage.setItem(POS_DRAFT_KEY, JSON.stringify(draft));
    window.dispatchEvent(new CustomEvent('pos_draft_updated', { detail: draft }));
  } catch (err) {
    console.warn('Erro ao salvar rascunho do PDV:', err);
  }
}

export function clearPosDraft(): void {
  try {
    localStorage.removeItem(POS_DRAFT_KEY);
    window.dispatchEvent(new CustomEvent('pos_draft_updated', { detail: null }));
  } catch (err) {
    console.warn('Erro ao limpar rascunho do PDV:', err);
  }
}
