import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wrench, Search } from 'lucide-react';
import { equipementService, espaceVertService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, ConfirmDialog, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { espace: '', nom: '', quantite: 1, etat: 'BON', details: '' };

export default function Equipements() {
  const { isGestionnaireGlobal, isGestionnaireParticulier } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [espaces, setEspaces] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(DF);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterEtat, setFilterEtat] = useState('');

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    try {
      const [eq, es] = await Promise.all([
        equipementService.getAll({ page }),
        espaceVertService.getAll({ page_size: 100 }),
      ]);
      setItems(eq.results || []);
      setCount(eq.count || 0);
      setEspaces(es.results || []);
    } catch (_) { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) {
        await equipementService.update(editId, form);
        toast.success('Équipement modifié');
      } else {
        await equipementService.create(form);
        toast.success('Équipement ajouté');
      }
      close(); load();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.nom?.[0] || 'Erreur';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!delTarget) return;
    try { await equipementService.delete(delTarget); toast.success('Supprimé'); load(); }
    catch (_) { toast.error('Erreur'); }
    setDelTarget(null);
  };

  const close = () => { setModal(false); setForm(DF); setEditId(null); };

  const openEdit = (eq) => {
    setForm({ espace: eq.espace, nom: eq.nom, quantite: eq.quantite, etat: eq.etat, details: eq.details || '' });
    setEditId(eq.id); setModal(true);
  };

  const sv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  let filtered = items;
  if (search) filtered = filtered.filter(e => e.nom.toLowerCase().includes(search.toLowerCase()) || e.espace_nom?.toLowerCase().includes(search.toLowerCase()));
  if (filterEtat) filtered = filtered.filter(e => e.etat === filterEtat);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Équipements</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-48" />
          </div>
          {isGestionnaireGlobal && (
            <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Filtres état */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'BON', 'USE', 'CASSE'].map(st => (
          <button key={st} onClick={() => setFilterEtat(st)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterEtat === st ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {st === '' ? 'Tous' : <StatusBadge value={st} />}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Aucun équipement" message="Ajoutez des équipements à vos espaces verts" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Nom', 'Espace vert', 'Quantité', 'État', 'Détails', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(eq => (
                  <tr key={eq.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{eq.nom}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{eq.espace_nom}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{eq.quantite}</td>
                    <td className="px-6 py-4"><StatusBadge value={eq.etat} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{eq.details || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(isGestionnaireParticulier || isGestionnaireGlobal) && (
                          <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isGestionnaireGlobal && (
                          <button onClick={() => setDelTarget(eq.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6"><Pagination page={page} count={count} onPageChange={setPage} /></div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={close} title={editId ? "Modifier l'équipement" : 'Nouvel équipement'}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Espace vert" required>
            <select value={form.espace} onChange={e => sv('espace', e.target.value)} className="input-field" required>
              <option value="">Sélectionner...</option>
              {espaces.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </FormField>
          <FormField label="Nom" required>
            <input type="text" value={form.nom} onChange={e => sv('nom', e.target.value)} className="input-field" required placeholder="Ex: Banc, Toboggan, Fontaine..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantité" required>
              <input type="number" min="1" value={form.quantite} onChange={e => sv('quantite', e.target.value)} className="input-field" required />
            </FormField>
            <FormField label="État" required>
              <select value={form.etat} onChange={e => sv('etat', e.target.value)} className="input-field">
                <option value="BON">Bon</option>
                <option value="USE">Usé</option>
                <option value="CASSE">Cassé</option>
              </select>
            </FormField>
          </div>
          <FormField label="Détails">
            <textarea value={form.details} onChange={e => sv('details', e.target.value)} className="input-field" rows="3" placeholder="Informations supplémentaires..." />
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={close} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={del}
        title="Supprimer cet équipement ?" message="Cette action est irréversible." confirmText="Supprimer" danger />
    </div>
  );
}
