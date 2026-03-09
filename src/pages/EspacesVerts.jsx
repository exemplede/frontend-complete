import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search } from 'lucide-react';
import { espaceVertService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, ConfirmDialog, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { nom: '', type_espace: 'PARC', superficie_m2: '', adresse: '', zone: '' };

export default function EspacesVerts() {
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
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    try { const d = await espaceVertService.getAll({ page }); setItems(d.results || []); setCount(d.count || 0); }
    catch (_) { toast.error('Erreur de chargement'); } finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await espaceVertService.update(editId, form); toast.success('Espace modifié'); }
      else { await espaceVertService.create(form); toast.success('Espace créé'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.nom?.[0] || 'Erreur'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!delTarget) return;
    try { await espaceVertService.delete(delTarget); toast.success('Supprimé'); load(); }
    catch (_) { toast.error('Erreur'); }
    setDelTarget(null);
  };

  const close = () => { setModal(false); setForm(DF); setEditId(null); };
  const edit = (e) => { setForm({ nom: e.nom, type_espace: e.type_espace, superficie_m2: e.superficie_m2, adresse: e.adresse || '', zone: e.zone || '' }); setEditId(e.id); setModal(true); };
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filtered = search ? items.filter(e => e.nom.toLowerCase().includes(search.toLowerCase()) || e.zone?.toLowerCase().includes(search.toLowerCase())) : items;

  if (loading) return <Spinner/>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Espaces Verts</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 w-48"/>
          </div>
          {isGestionnaireGlobal && <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Nouveau</button>}
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState icon={MapPin} title="Aucun espace vert" message="Commencez par ajouter un espace vert" action={isGestionnaireGlobal && <button onClick={() => setModal(true)} className="btn btn-primary">Ajouter</button>}/> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(e => (
              <div key={e.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-lg"><MapPin className="w-4 h-4 text-green-600"/></div>
                    <h3 className="font-bold text-gray-900">{e.nom}</h3>
                  </div>
                  {isGestionnaireGlobal && (
                    <div className="flex gap-1">
                      <button onClick={() => edit(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => setDelTarget(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><StatusBadge value={e.type_espace}/></div>
                  <div className="flex justify-between"><span className="text-gray-500">Superficie</span><span className="font-medium">{Number(e.superficie_m2).toLocaleString('fr-FR')} m²</span></div>
                  {e.adresse && <div className="flex justify-between"><span className="text-gray-500">Adresse</span><span className="text-gray-700 text-right max-w-[60%] truncate">{e.adresse}</span></div>}
                  {e.zone && <div className="flex justify-between"><span className="text-gray-500">Zone</span><span className="font-medium text-gray-700">{e.zone}</span></div>}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} count={count} onPageChange={setPage}/>
        </>
      )}

      <Modal open={modal} onClose={close} title={editId ? "Modifier l'espace" : 'Nouvel espace vert'}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Nom" required><input type="text" value={form.nom} onChange={e => s('nom', e.target.value)} className="input-field" required/></FormField>
          <FormField label="Type" required>
            <select value={form.type_espace} onChange={e => s('type_espace', e.target.value)} className="input-field">
              <option value="PARC">Parc</option><option value="JARDIN">Jardin public</option><option value="SQUARE">Square</option><option value="STADE">Stade</option>
            </select>
          </FormField>
          <FormField label="Superficie (m²)" required><input type="number" step="0.01" value={form.superficie_m2} onChange={e => s('superficie_m2', e.target.value)} className="input-field" required/></FormField>
          <FormField label="Adresse"><input type="text" value={form.adresse} onChange={e => s('adresse', e.target.value)} className="input-field"/></FormField>
          <FormField label="Zone"><input type="text" value={form.zone} onChange={e => s('zone', e.target.value)} className="input-field"/></FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={close} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={del} title="Supprimer cet espace ?" message="Tous les équipements et interventions liés seront supprimés." confirmText="Supprimer" danger/>
    </div>
  );
}
