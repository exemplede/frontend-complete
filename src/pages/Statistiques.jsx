import { useState, useEffect } from 'react';
import { BarChart3, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { statistiqueService } from '../services/api';
import { Spinner, useToast } from '../components/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Statistiques() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const d = await statistiqueService.get(params);
      setData(d);
    } catch (_) { toast.error('Erreur de chargement des statistiques'); }
    finally { setLoading(false); }
  };

  const applyFilters = () => { load(); };

  if (loading) return <Spinner />;
  if (!data) return <div className="text-center text-gray-500 py-16">Aucune donnée disponible</div>;

  // Formater données interventions par mois
  const interMois = (data.interventions_par_mois || []).map(d => ({
    mois: d.mois ? new Date(d.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '?',
    nombre: d.nombre || 0,
    depenses: parseFloat(d.depenses || 0),
  }));

  // Interventions par type
  const interType = (data.interventions_par_type || []).map(d => ({
    name: { TONTE: 'Tonte', ARROSAGE: 'Arrosage', FEUILLES: 'Feuilles', REPARATION: 'Réparation', AUTRE: 'Autre' }[d.type_intervention] || d.type_intervention,
    value: d.nombre || 0,
  }));

  // Signalements
  const sig = data.signalements || {};
  const sigData = [
    { name: 'Résolus', value: sig.resolus || 0 },
    { name: 'Non résolus', value: (sig.total || 0) - (sig.resolus || 0) },
  ];

  // Activité globale
  const actGlobale = (data.activite_globale || []).map(d => ({
    mois: d.mois ? new Date(d.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '?',
    total: d.total || 0,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Statistiques</h1>
      </div>

      {/* Filtres dates */}
      <div className="card mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date début</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-40" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date fin</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-40" />
        </div>
        <button onClick={applyFilters} className="btn btn-primary">Appliquer</button>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(load, 0); }} className="btn btn-secondary">Réinitialiser</button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
            <span className="text-sm font-medium text-gray-500">Total interventions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {interType.reduce((s, t) => s + t.value, 0)}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-sm font-medium text-gray-500">Taux de résolution</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{sig.taux_resolution || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{sig.resolus || 0} / {sig.total || 0} signalements</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <span className="text-sm font-medium text-gray-500">Signalements ouverts</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{(sig.total || 0) - (sig.resolus || 0)}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Interventions par mois */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />Interventions par mois
          </h3>
          {interMois.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={interMois}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="nombre" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Interventions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Interventions par type */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Répartition par type</h3>
          {interType.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={interType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {interType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Taux résolution signalements */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Résolution des signalements</h3>
          {sig.total === 0 ? <p className="text-sm text-gray-400 py-8 text-center">Aucun signalement</p> : (
            <div className="flex items-center justify-center py-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sigData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name">
                    <Cell fill="#10b981" />
                    <Cell fill="#f3f4f6" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Activité globale */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />Activité globale
          </h3>
          {actGlobale.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={actGlobale}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="total" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Actions" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Consommation stock */}
      {data.consommation_stock_par_mois && data.consommation_stock_par_mois.length > 0 && (
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />Consommation de stock par mois
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className="bg-gray-50 border-b">
                {['Mois', 'Article', 'Quantité consommée'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.consommation_stock_par_mois.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-600">{r.mois ? new Date(r.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '?'}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{r.article__nom}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{Number(r.quantite).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
