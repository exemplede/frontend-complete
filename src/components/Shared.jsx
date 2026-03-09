import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

/* ═══ TOAST SYSTEM ═══ */
const ToastCtx = createContext(null);
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const toast = { success: m => add(m, 'success'), error: m => add(m, 'error'), warning: m => add(m, 'warning'), info: m => add(m, 'info') };
  const icons = { success: <CheckCircle className="w-5 h-5 text-emerald-500"/>, error: <XCircle className="w-5 h-5 text-red-500"/>, warning: <AlertTriangle className="w-5 h-5 text-amber-500"/>, info: <Info className="w-5 h-5 text-blue-500"/> };
  const bg = { success: 'bg-emerald-50 border-emerald-200', error: 'bg-red-50 border-red-200', warning: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200' };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bg[t.type]}`} style={{ animation: 'slideIn .3s ease-out' }}>
            {icons[t.type]}
            <span className="text-sm text-gray-800 flex-1">{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}><X className="w-4 h-4 text-gray-400"/></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ═══ MODAL ═══ */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ═══ CONFIRM DIALOG ═══ */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirmer', danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`}/>
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6 ml-12">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Annuler</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ PAGINATION ═══ */
export function Pagination({ page, count, pageSize = 20, onPageChange }) {
  const total = Math.ceil((count || 0) / pageSize);
  if (total <= 1) return null;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">{count} résultat{count > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
        {pages.map((p, i) => p === '...' ? <span key={`d${i}`} className="px-2 text-gray-400">...</span> : (
          <button key={p} onClick={() => onPageChange(p)} className={`min-w-[36px] h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>{p}</button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= total} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
      </div>
    </div>
  );
}

/* ═══ STATUS BADGE ═══ */
const styles = {
  PREVUE:'bg-blue-50 text-blue-700 ring-blue-600/20', EN_COURS:'bg-amber-50 text-amber-700 ring-amber-600/20',
  TERMINEE:'bg-emerald-50 text-emerald-700 ring-emerald-600/20', ANNULEE:'bg-gray-50 text-gray-600 ring-gray-500/20',
  OUVERT:'bg-red-50 text-red-700 ring-red-600/20', RESOLU:'bg-emerald-50 text-emerald-700 ring-emerald-600/20', REJETE:'bg-gray-50 text-gray-600 ring-gray-500/20',
  BASSE:'bg-gray-50 text-gray-600 ring-gray-500/20', MOYENNE:'bg-blue-50 text-blue-700 ring-blue-600/20', HAUTE:'bg-orange-50 text-orange-700 ring-orange-600/20', URGENTE:'bg-red-50 text-red-700 ring-red-600/20',
  BON:'bg-emerald-50 text-emerald-700 ring-emerald-600/20', USE:'bg-amber-50 text-amber-700 ring-amber-600/20', CASSE:'bg-red-50 text-red-700 ring-red-600/20',
  DISPONIBLE:'bg-emerald-50 text-emerald-700 ring-emerald-600/20', EN_PANNE:'bg-red-50 text-red-700 ring-red-600/20', EN_REPARATION:'bg-amber-50 text-amber-700 ring-amber-600/20', HORS_SERVICE:'bg-gray-50 text-gray-600 ring-gray-500/20',
  ENTREE:'bg-emerald-50 text-emerald-700 ring-emerald-600/20', SORTIE:'bg-orange-50 text-orange-700 ring-orange-600/20',
};
const labels = {
  PREVUE:'Prévue',EN_COURS:'En cours',TERMINEE:'Terminée',ANNULEE:'Annulée',
  OUVERT:'Ouvert',RESOLU:'Résolu',REJETE:'Rejeté',
  BASSE:'Basse',MOYENNE:'Moyenne',HAUTE:'Haute',URGENTE:'Urgente',
  BON:'Bon',USE:'Usé',CASSE:'Cassé',
  DISPONIBLE:'Disponible',EN_PANNE:'En panne',EN_REPARATION:'En réparation',HORS_SERVICE:'Hors service',
  TONTE:'Tonte',ARROSAGE:'Arrosage',FEUILLES:'Feuilles',REPARATION:'Réparation',AUTRE:'Autre',
  PARC:'Parc',JARDIN:'Jardin',SQUARE:'Square',STADE:'Stade',
  TONDEUSE:'Tondeuse',TAILLE_HAIE:'Taille-haie',
  KG:'kg',UNITE:'unité',LITRE:'litre',ENTREE:'Entrée',SORTIE:'Sortie',
};
export function StatusBadge({ value }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[value] || 'bg-gray-50 text-gray-600 ring-gray-500/20'}`}>{labels[value] || value}</span>;
}

/* ═══ EMPTY STATE ═══ */
export function EmptyState({ icon: Icon = Inbox, title = 'Aucune donnée', message = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4"><Icon className="w-8 h-8 text-gray-400"/></div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 mb-4 max-w-sm">{message}</p>}
      {action}
    </div>
  );
}

/* ═══ SPINNER ═══ */
export function Spinner({ className = 'h-64' }) {
  return <div className={`flex items-center justify-center ${className}`}><div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"/></div>;
}

/* ═══ FORM FIELD ═══ */
export function FormField({ label, required, children }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>;
}
