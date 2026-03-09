import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, AlertTriangle, Package, Activity, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { espaceVertService, interventionService, signalementService, materielService, activiteService } from '../services/api';
import { Spinner, StatusBadge } from '../components/Shared';

export default function Dashboard() {
  const { user, hasAnyRole } = useAuth();
  const [stats, setStats] = useState({ espaces: 0, interventions: 0, signalements: 0, materiel: 0 });
  const [recents, setRecents] = useState([]);
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const adv = hasAnyRole(['GestionnaireGlobal', 'Maire']);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [esp, intPrev, sigOuv, intAll] = await Promise.all([
        espaceVertService.getAll(), interventionService.getAll({ statut: 'PREVUE' }),
        signalementService.getAll({ statut: 'OUVERT' }), interventionService.getAll(),
      ]);
      let mat = { count: 0 }, act = { results: [] };
      if (adv) { [mat, act] = await Promise.all([materielService.getAll(), activiteService.getAll()]); }
      setStats({ espaces: esp.count || 0, interventions: intPrev.count || 0, signalements: sigOuv.count || 0, materiel: mat.count || 0 });
      setRecents((intAll.results || []).slice(0, 5));
      setActivites((act.results || []).slice(0, 8));
    } catch (_) {}
    finally { setLoading(false); }
  };

  const ago = (d) => { if (!d) return ''; const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return "À l'instant"; if (s < 3600) return `${Math.floor(s/60)}min`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}j`; };

  const cards = [
    { title: 'Espaces verts', value: stats.espaces, icon: MapPin, color: 'bg-emerald-500', link: '/espaces' },
    { title: 'Interventions prévues', value: stats.interventions, icon: Calendar, color: 'bg-blue-500', link: '/interventions' },
    { title: 'Signalements ouverts', value: stats.signalements, icon: AlertTriangle, color: 'bg-orange-500', link: '/signalements' },
    ...(adv ? [{ title: 'Matériel', value: stats.materiel, icon: Package, color: 'bg-purple-500', link: '/materiel' }] : []),
  ];

  if (loading) return <Spinner/>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.first_name || user?.username}</h1>
        <p className="text-gray-500 mt-1">Voici un aperçu de votre activité</p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${adv ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-5 mb-8`}>
        {cards.map(c => (
          <Link key={c.title} to={c.link} className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{c.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.color}`}><c.icon className="w-6 h-6 text-white"/></div>
            </div>
            <div className="mt-3 flex items-center text-xs text-gray-400 group-hover:text-green-600">Voir tout <ArrowRight className="w-3 h-3 ml-1"/></div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/>Interventions récentes</h2>
            <Link to="/interventions" className="text-sm text-green-600 hover:text-green-700 font-medium">Voir tout</Link>
          </div>
          {recents.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Aucune intervention</p> :
            <div className="space-y-3">{recents.map(i => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{i.espace_nom}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/>{i.planifiee_le ? new Date(i.planifiee_le).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
                <div className="flex items-center gap-2 ml-3"><StatusBadge value={i.type_intervention}/><StatusBadge value={i.statut}/></div>
              </div>
            ))}</div>
          }
        </div>

        <div className="card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-emerald-500"/>Activité récente</h2>
          {activites.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">{adv ? 'Aucune activité' : 'Accès réservé aux gestionnaires'}</p> :
            <div className="space-y-3">{activites.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="mt-1 w-2 h-2 rounded-full bg-green-400 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800"><span className="font-medium">{a.utilisateur_username || 'Système'}</span> {a.action}</p>
                  {a.details && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.details}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{ago(a.created_at)}</span>
              </div>
            ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
