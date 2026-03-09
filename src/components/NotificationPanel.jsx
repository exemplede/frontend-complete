import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Calendar, AlertTriangle, Package, Settings } from 'lucide-react';
import { notificationService } from '../services/api';

const icons = { INTERVENTION: Calendar, SIGNALEMENT: AlertTriangle, STOCK: Package, SYSTEME: Settings };

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const load = async () => {
    try {
      const d = await notificationService.getAll();
      const list = d.results || [];
      setItems(list);
      setUnread(list.filter(n => !n.lu).length);
    } catch (_) {}
  };

  const markRead = async (id) => {
    try { await notificationService.marquerLue(id); setItems(p => p.map(n => n.id === id ? { ...n, lu: true } : n)); setUnread(c => Math.max(0, c - 1)); } catch (_) {}
  };

  const markAll = async () => {
    try { await notificationService.marquerToutesLues(); setItems(p => p.map(n => ({ ...n, lu: true }))); setUnread(0); } catch (_) {}
  };

  const ago = (d) => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return "À l'instant"; if (s < 3600) return `Il y a ${Math.floor(s/60)}min`;
    if (s < 86400) return `Il y a ${Math.floor(s/3600)}h`; return `Il y a ${Math.floor(s/86400)}j`;
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell className="w-5 h-5 text-gray-600"/>
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-bold">Notifications</h3>
            {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"><CheckCheck className="w-3.5 h-3.5"/> Tout lire</button>}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? <div className="py-12 text-center text-sm text-gray-400">Aucune notification</div> :
              items.slice(0, 20).map(n => {
                const Icon = icons[n.type_notification] || Bell;
                return (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer ${!n.lu ? 'bg-green-50/50' : ''}`} onClick={() => !n.lu && markRead(n.id)}>
                    <div className={`mt-0.5 p-1.5 rounded-lg ${!n.lu ? 'bg-green-100' : 'bg-gray-100'}`}><Icon className={`w-4 h-4 ${!n.lu ? 'text-green-600' : 'text-gray-400'}`}/></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.lu ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{ago(n.created_at)}</p>
                    </div>
                    {!n.lu && <div className="mt-2 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"/>}
                  </div>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}
