import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Box, Search } from 'lucide-react';
import { materielService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, ConfirmDialog, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { nom: '', categorie: 'TONDEUSE', etat: 'DISPONIBLE', quantite_totale: 1, quantite_disponible: 1 };

export default function Materiel() {
  const { isGestionnaireGlobal } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(DF);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [filterEtat, setFilterEtat] = useState('');

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    try {
      const d = await materielService.getAll({ page });
      setItems(d.results || []); setCount(d.count || 0);
    } catch (_) { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await materielService.update(editId, form); toast.success('Matériel modifié'); }
      else { await materielService.create(form); toast.success('Matériel ajouté'); }
      close(); load();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Erreur';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!delTarget) return;
    try { await materielService.delete(delTarget); toast.success('Supprimé'); load(); }
    catch (_) { toast.error('Erreur'); }
    setDelTarget(null);
  };

  const close = () => { setModal(false); setForm(DF); setEditId(null); };

  const openEdit = (m) => {
    setForm({ nom: m.nom, categorie: m.categorie, etat: m.etat, quantite_totale: m.quantite_totale, quantite_disponible: m.quantite_disponible });
    setEditId(m.id); setModal(true);
  };

  const sv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = filterEtat ? items.filter(m => m.etat === filterEtat) : items;

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Matériel</h1>
        {isGestionnaireGlobal && (
          <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Ajouter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'DISPONIBLE', 'EN_PANNE', 'EN_REPARATION', 'HORS_SERVICE'].map(st => (
          <button key={st} onClick={() => setFilterEtat(st)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterEtat === st ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {st === '' ? 'Tous' : <StatusBadge value={st} />}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Box} title="Aucun matériel" message="Ajoutez le matériel de vos équipes" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Nom', 'Catégorie', 'État', 'Total', 'Disponible', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.nom}</td>
                    <td className="px-6 py-4"><StatusBadge value={m.categorie} /></td>
                    <td className="px-6 py-4"><StatusBadge value={m.etat} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.quantite_totale}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${m.quantite_disponible === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {m.quantite_disponible}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isGestionnaireGlobal && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDelTarget(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6"><Pagination page={page} count={count} onPageChange={setPage} /></div>
        </div>
      )}

      <Modal open={modal} onClose={close} title={editId ? 'Modifier le matériel' : 'Nouveau matériel'}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Nom" required>
            <input type="text" value={form.nom} onChange={e => sv('nom', e.target.value)} className="input-field" required placeholder="Ex: Tondeuse Honda HRX..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Catégorie" required>
              <select value={form.categorie} onChange={e => sv('categorie', e.target.value)} className="input-field">
                <option value="TONDEUSE">Tondeuse</option>
                <option value="TAILLE_HAIE">Taille-haie</option>
                <option value="AUTRE">Autre</option>
              </select>
            </FormField>
            <FormField label="État" required>
              <select value={form.etat} onChange={e => sv('etat', e.target.value)} className="input-field">
                <option value="DISPONIBLE">Disponible</option>
                <option value="EN_PANNE">En panne</option>
                <option value="EN_REPARATION">En réparation</option>
                <option value="HORS_SERVICE">Hors service</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantité totale" required>
              <input type="number" min="0" value={form.quantite_totale} onChange={e => sv('quantite_totale', parseInt(e.target.value) || 0)} className="input-field" required />
            </FormField>
            <FormField label="Quantité disponible" required>
              <input type="number" min="0" value={form.quantite_disponible} onChange={e => sv('quantite_disponible', parseInt(e.target.value) || 0)} className="input-field" required />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={close} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={del}
        title="Supprimer ce matériel ?" message="Cette action est irréversible." confirmText="Supprimer" danger />
    </div>
  );
}
