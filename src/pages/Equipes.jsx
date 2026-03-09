import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, UserPlus } from 'lucide-react';
import { equipeService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, ConfirmDialog, Pagination, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DF = { nom: '', zone_assignee: '', agents: [] };

export default function Equipes() {
  const { isGestionnaireGlobal } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(DF);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState(null);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    try {
      const [eq, us] = await Promise.all([
        equipeService.getAll({ page }),
        isGestionnaireGlobal ? userService.getAll({ page_size: 100 }) : Promise.resolve({ results: [] }),
      ]);
      setItems(eq.results || []);
      setCount(eq.count || 0);
      setUsers((us.results || []).filter(u => u.is_active));
    } catch (_) { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await equipeService.update(editId, form); toast.success('Équipe modifiée'); }
      else { await equipeService.create(form); toast.success('Équipe créée'); }
      close(); load();
    } catch (err) {
      toast.error(err.response?.data?.nom?.[0] || 'Erreur');
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!delTarget) return;
    try { await equipeService.delete(delTarget); toast.success('Supprimée'); load(); }
    catch (_) { toast.error('Erreur'); }
    setDelTarget(null);
  };

  const close = () => { setModal(false); setForm(DF); setEditId(null); };

  const openEdit = (eq) => {
    setForm({ nom: eq.nom, zone_assignee: eq.zone_assignee || '', agents: eq.agents || [] });
    setEditId(eq.id); setModal(true);
  };

  const sv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleAgent = (userId) => {
    setForm(p => ({
      ...p,
      agents: p.agents.includes(userId)
        ? p.agents.filter(id => id !== userId)
        : [...p.agents, userId]
    }));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Équipes</h1>
        {isGestionnaireGlobal && (
          <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Nouvelle équipe
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Users} title="Aucune équipe" message="Créez une équipe et assignez des agents" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(eq => (
              <div key={eq.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{eq.nom}</h3>
                      {eq.zone_assignee && <p className="text-xs text-gray-500">Zone : {eq.zone_assignee}</p>}
                    </div>
                  </div>
                  {isGestionnaireGlobal && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDelTarget(eq.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    {eq.agents?.length || 0} agent{(eq.agents?.length || 0) > 1 ? 's' : ''}
                  </p>
                  {eq.agents && eq.agents.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {eq.agents.map(agentId => {
                        const u = users.find(u => u.id === agentId);
                        return (
                          <span key={agentId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {u ? (u.first_name ? `${u.first_name} ${u.last_name?.[0] || ''}` : u.username) : `#${agentId}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Aucun agent assigné</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} count={count} onPageChange={setPage} />
        </>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={close} title={editId ? "Modifier l'équipe" : 'Nouvelle équipe'} size="md">
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Nom de l'équipe" required>
            <input type="text" value={form.nom} onChange={e => sv('nom', e.target.value)} className="input-field" required placeholder="Ex: Équipe Nord, Équipe Maintenance..." />
          </FormField>
          <FormField label="Zone assignée">
            <input type="text" value={form.zone_assignee} onChange={e => sv('zone_assignee', e.target.value)} className="input-field" placeholder="Ex: Zone Nord, Secteur A..." />
          </FormField>
          <FormField label="Agents">
            {users.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Aucun utilisateur disponible</p>
            ) : (
              <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agents.includes(u.id)}
                      onChange={() => toggleAgent(u.id)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">@{u.username}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">{form.agents.length} agent{form.agents.length > 1 ? 's' : ''} sélectionné{form.agents.length > 1 ? 's' : ''}</p>
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={close} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={del}
        title="Supprimer cette équipe ?" message="Les interventions liées ne seront pas supprimées." confirmText="Supprimer" danger />
    </div>
  );
}
