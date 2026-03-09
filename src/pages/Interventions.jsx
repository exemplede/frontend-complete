import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Calendar, Filter } from 'lucide-react';
import { interventionService, espaceVertService, equipeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, ConfirmDialog, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { type_intervention: 'TONTE', espace: '', equipe: '', planifiee_le: '', cout: '0', notes: '', statut: 'PREVUE' };

export default function Interventions() {
  const { isGestionnaireGlobal, isGestionnaireParticulier } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [espaces, setEspaces] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(DF);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [filterStatut, setFilterStatut] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadData(); }, [page, filterStatut]);

  const loadData = async () => {
    try {
      const params = { page }; if (filterStatut) params.statut = filterStatut;
      const [i, e, q] = await Promise.all([
        interventionService.getAll(params), espaceVertService.getAll({ page_size: 100 }),
        isGestionnaireGlobal ? equipeService.getAll({ page_size: 100 }) : Promise.resolve({ results: [] }),
      ]);
      setItems(i.results || []); setCount(i.count || 0); setEspaces(e.results || []); setEquipes(q.results || []);
    } catch (_) { toast.error('Erreur de chargement'); } finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...form }; if (!p.equipe) p.equipe = null;
      if (editId) { await interventionService.update(editId, p); toast.success('Modifiée'); }
      else { await interventionService.create(p); toast.success('Créée'); }
      close(); loadData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); } finally { setSaving(false); }
  };

  const del = async () => { if (!delTarget) return; try { await interventionService.delete(delTarget); toast.success('Supprimée'); loadData(); } catch (_) { toast.error('Erreur'); } setDelTarget(null); };
  const markDone = async (id) => { try { await interventionService.marquerEffectuee(id); toast.success('Terminée'); loadData(); } catch (_) { toast.error('Erreur'); } };
  const close = () => { setModal(false); setForm(DF); setEditId(null); };
  const openEdit = (i) => { setForm({ type_intervention: i.type_intervention, espace: i.espace, equipe: i.equipe || '', planifiee_le: i.planifiee_le?.slice(0, 16) || '', cout: i.cout || '0', notes: i.notes || '', statut: i.statut }); setEditId(i.id); setModal(true); };
  const sv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <Spinner/>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Interventions</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}><Filter className="w-4 h-4"/>Filtres</button>
          {isGestionnaireGlobal && <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nouvelle</button>}
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Statut :</span>
          {['', 'PREVUE', 'EN_COURS', 'TERMINEE', 'ANNULEE'].map(st => (
            <button key={st} onClick={() => { setFilterStatut(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatut === st ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {st === '' ? 'Tous' : <StatusBadge value={st}/>}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? <EmptyState icon={Calendar} title="Aucune intervention"/> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className="bg-gray-50 border-b">
                {['Type','Espace','Équipe','Date','Coût','Statut','Actions'].map(h => <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4"><StatusBadge value={i.type_intervention}/></td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{i.espace_nom}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{i.equipe_nom || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{i.planifiee_le ? new Date(i.planifiee_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{Number(i.cout || 0).toLocaleString('fr-FR')} €</td>
                    <td className="px-6 py-4"><StatusBadge value={i.statut}/></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(isGestionnaireParticulier || isGestionnaireGlobal) && i.statut === 'PREVUE' && <button onClick={() => markDone(i.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Terminée"><CheckCircle className="w-4 h-4"/></button>}
                        {isGestionnaireGlobal && <>
                          <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => setDelTarget(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4"/></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6"><Pagination page={page} count={count} onPageChange={setPage}/></div>
        </div>
      )}

      <Modal open={modal} onClose={close} title={editId ? 'Modifier' : 'Nouvelle intervention'}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Type" required><select value={form.type_intervention} onChange={e => sv('type_intervention', e.target.value)} className="input-field"><option value="TONTE">Tonte</option><option value="ARROSAGE">Arrosage</option><option value="FEUILLES">Ramassage feuilles</option><option value="REPARATION">Réparation</option><option value="AUTRE">Autre</option></select></FormField>
          <FormField label="Espace vert" required><select value={form.espace} onChange={e => sv('espace', e.target.value)} className="input-field" required><option value="">Sélectionner...</option>{espaces.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></FormField>
          <FormField label="Équipe"><select value={form.equipe} onChange={e => sv('equipe', e.target.value)} className="input-field"><option value="">Aucune</option>{equipes.map(q => <option key={q.id} value={q.id}>{q.nom}</option>)}</select></FormField>
          <FormField label="Date planifiée" required><input type="datetime-local" value={form.planifiee_le} onChange={e => sv('planifiee_le', e.target.value)} className="input-field" required/></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Coût (€)"><input type="number" step="0.01" value={form.cout} onChange={e => sv('cout', e.target.value)} className="input-field"/></FormField>
            {editId && <FormField label="Statut"><select value={form.statut} onChange={e => sv('statut', e.target.value)} className="input-field"><option value="PREVUE">Prévue</option><option value="EN_COURS">En cours</option><option value="TERMINEE">Terminée</option><option value="ANNULEE">Annulée</option></select></FormField>}
          </div>
          <FormField label="Notes"><textarea value={form.notes} onChange={e => sv('notes', e.target.value)} className="input-field" rows="3"/></FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={close} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={del} title="Supprimer cette intervention ?" message="Cette action est irréversible." confirmText="Supprimer" danger/>
    </div>
  );
}
