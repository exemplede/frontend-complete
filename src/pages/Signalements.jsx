import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { signalementService, espaceVertService, equipementService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { espace: '', equipement: '', description: '', priorite: 'MOYENNE' };

export default function Signalements() {
  const { isGestionnaireGlobal, isGestionnaireParticulier } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [espaces, setEspaces] = useState([]);
  const [equips, setEquips] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [statutModal, setStatutModal] = useState(null);
  const [form, setForm] = useState(DF);
  const [saving, setSaving] = useState(false);
  const [filterSt, setFilterSt] = useState('');

  useEffect(() => { load(); }, [page, filterSt]);

  const load = async () => {
    try {
      const p = { page }; if (filterSt) p.statut = filterSt;
      const [si, es, eq] = await Promise.all([signalementService.getAll(p), espaceVertService.getAll({ page_size: 100 }), equipementService.getAll({ page_size: 100 })]);
      setItems(si.results || []); setCount(si.count || 0); setEspaces(es.results || []); setEquips(eq.results || []);
    } catch (_) { toast.error('Erreur de chargement'); } finally { setLoading(false); }
  };

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...form }; if (!p.equipement) p.equipement = null;
      await signalementService.create(p); toast.success('Signalement créé'); setModal(false); setForm(DF); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); } finally { setSaving(false); }
  };

  const changeStatut = async (id, statut) => {
    try { await signalementService.changerStatut(id, statut); toast.success('Statut mis à jour'); setStatutModal(null); load(); }
    catch (_) { toast.error('Erreur'); }
  };

  const sv = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filteredEq = form.espace ? equips.filter(eq => eq.espace === parseInt(form.espace)) : equips;

  if (loading) return <Spinner/>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Signalements</h1>
        {(isGestionnaireParticulier || isGestionnaireGlobal) && <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nouveau</button>}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'OUVERT', 'EN_COURS', 'RESOLU', 'REJETE'].map(st => (
          <button key={st} onClick={() => { setFilterSt(st); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterSt === st ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {st === '' ? 'Tous' : <StatusBadge value={st}/>}
          </button>
        ))}
      </div>

      {items.length === 0 ? <EmptyState icon={AlertTriangle} title="Aucun signalement"/> : (
        <>
          <div className="space-y-4">
            {items.map(sig => (
              <div key={sig.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-400">#{sig.id}</span>
                      <StatusBadge value={sig.priorite}/><StatusBadge value={sig.statut}/>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{sig.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Espace : <strong className="text-gray-700">{sig.espace_nom}</strong></span>
                      {sig.equipement_nom && <span>Équipement : <strong className="text-gray-700">{sig.equipement_nom}</strong></span>}
                      <span>Par : <strong className="text-gray-700">{sig.cree_par_username || '—'}</strong></span>
                      <span>{new Date(sig.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {isGestionnaireGlobal && sig.statut !== 'RESOLU' && sig.statut !== 'REJETE' && (
                    <button onClick={() => setStatutModal(sig)} className="btn btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0">
                      <ArrowRightCircle className="w-4 h-4"/>Changer statut
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} count={count} onPageChange={setPage}/>
        </>
      )}

      {/* Modal création */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(DF); }} title="Nouveau signalement">
        <form onSubmit={create} className="space-y-4">
          <FormField label="Espace vert" required><select value={form.espace} onChange={e => sv('espace', e.target.value)} className="input-field" required><option value="">Sélectionner...</option>{espaces.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></FormField>
          <FormField label="Équipement concerné"><select value={form.equipement} onChange={e => sv('equipement', e.target.value)} className="input-field"><option value="">Aucun / Général</option>{filteredEq.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></FormField>
          <FormField label="Priorité" required><select value={form.priorite} onChange={e => sv('priorite', e.target.value)} className="input-field"><option value="BASSE">Basse</option><option value="MOYENNE">Moyenne</option><option value="HAUTE">Haute</option><option value="URGENTE">Urgente</option></select></FormField>
          <FormField label="Description" required><textarea value={form.description} onChange={e => sv('description', e.target.value)} className="input-field" rows="4" required placeholder="Décrivez le problème..."/></FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => { setModal(false); setForm(DF); }} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Envoi...' : 'Signaler'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal changement statut */}
      <Modal open={!!statutModal} onClose={() => setStatutModal(null)} title="Changer le statut" size="sm">
        {statutModal && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">Signalement <strong>#{statutModal.id}</strong> — actuellement <StatusBadge value={statutModal.statut}/></p>
            <div className="grid grid-cols-1 gap-2">
              {['EN_COURS', 'RESOLU', 'REJETE'].filter(s => s !== statutModal.statut).map(st => (
                <button key={st} onClick={() => changeStatut(statutModal.id, st)} className="btn btn-secondary flex items-center justify-between w-full">
                  <span>Passer en</span><StatusBadge value={st}/>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
