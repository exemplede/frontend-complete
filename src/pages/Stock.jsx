import { useState, useEffect } from 'react';
import { Plus, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { articleStockService, mouvementStockService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, Pagination, StatusBadge, EmptyState, Spinner, FormField, useToast } from '../components/Shared';

const DFA = { nom: '', unite: 'UNITE', quantite: 0, seuil_alerte: 0 };
const DFM = { article: '', type_mouvement: 'ENTREE', quantite: '', motif: '' };

export default function Stock() {
  const { isGestionnaireGlobal } = useAuth();
  const toast = useToast();
  const [articles, setArticles] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [countA, setCountA] = useState(0);
  const [countM, setCountM] = useState(0);
  const [pageA, setPageA] = useState(1);
  const [pageM, setPageM] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('articles');

  // Modal article
  const [modalA, setModalA] = useState(false);
  const [formA, setFormA] = useState(DFA);
  const [editAId, setEditAId] = useState(null);

  // Modal mouvement
  const [modalM, setModalM] = useState(false);
  const [formM, setFormM] = useState(DFM);

  const [saving, setSaving] = useState(false);

  useEffect(() => { loadArticles(); }, [pageA]);
  useEffect(() => { if (tab === 'mouvements') loadMouvements(); }, [pageM, tab]);

  const loadArticles = async () => {
    try {
      const d = await articleStockService.getAll({ page: pageA });
      setArticles(d.results || []); setCountA(d.count || 0);
    } catch (_) { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  const loadMouvements = async () => {
    try {
      const d = await mouvementStockService.getAll({ page: pageM });
      setMouvements(d.results || []); setCountM(d.count || 0);
    } catch (_) {}
  };

  // Article CRUD
  const submitArticle = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editAId) { await articleStockService.update(editAId, formA); toast.success('Article modifié'); }
      else { await articleStockService.create(formA); toast.success('Article créé'); }
      closeA(); loadArticles();
    } catch (err) { toast.error(err.response?.data?.nom?.[0] || 'Erreur'); }
    finally { setSaving(false); }
  };

  const closeA = () => { setModalA(false); setFormA(DFA); setEditAId(null); };
  const editArticle = (a) => { setFormA({ nom: a.nom, unite: a.unite, quantite: a.quantite, seuil_alerte: a.seuil_alerte }); setEditAId(a.id); setModalA(true); };
  const sva = (k, v) => setFormA(p => ({ ...p, [k]: v }));

  // Mouvement
  const submitMouvement = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await mouvementStockService.create(formM);
      toast.success('Mouvement enregistré');
      setModalM(false); setFormM(DFM);
      loadArticles(); if (tab === 'mouvements') loadMouvements();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Erreur';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const svm = (k, v) => setFormM(p => ({ ...p, [k]: v }));

  const alertesBas = articles.filter(a => parseFloat(a.quantite) <= parseFloat(a.seuil_alerte) && parseFloat(a.seuil_alerte) > 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gestion du Stock</h1>
        {isGestionnaireGlobal && (
          <div className="flex gap-2">
            <button onClick={() => setModalM(true)} className="btn btn-secondary flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" />Mouvement
            </button>
            <button onClick={() => setModalA(true)} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />Nouvel article
            </button>
          </div>
        )}
      </div>

      {/* Alertes stock bas */}
      {alertesBas.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Alertes stock bas ({alertesBas.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertesBas.map(a => (
              <span key={a.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
                {a.nom} : {a.quantite} {a.unite?.toLowerCase()} (seuil: {a.seuil_alerte})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[{ key: 'articles', label: 'Articles' }, { key: 'mouvements', label: 'Mouvements' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Articles */}
      {tab === 'articles' && (
        articles.length === 0 ? <EmptyState icon={Package} title="Aucun article en stock" /> : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr className="bg-gray-50 border-b">
                  {['Article', 'Unité', 'Quantité', 'Seuil alerte', 'Statut', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map(a => {
                    const low = parseFloat(a.seuil_alerte) > 0 && parseFloat(a.quantite) <= parseFloat(a.seuil_alerte);
                    return (
                      <tr key={a.id} className={`hover:bg-gray-50/50 ${low ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.nom}</td>
                        <td className="px-6 py-4"><StatusBadge value={a.unite} /></td>
                        <td className="px-6 py-4 text-sm font-medium">{Number(a.quantite).toLocaleString('fr-FR')}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{a.seuil_alerte}</td>
                        <td className="px-6 py-4">
                          {low ? <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="w-3.5 h-3.5" />Stock bas</span>
                            : <span className="text-xs font-medium text-emerald-600">OK</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isGestionnaireGlobal && (
                            <button onClick={() => editArticle(a)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6"><Pagination page={pageA} count={countA} onPageChange={setPageA} /></div>
          </div>
        )
      )}

      {/* Tab Mouvements */}
      {tab === 'mouvements' && (
        mouvements.length === 0 ? <EmptyState icon={ArrowDownCircle} title="Aucun mouvement" /> : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr className="bg-gray-50 border-b">
                  {['Date', 'Article', 'Type', 'Quantité', 'Motif', 'Par'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {mouvements.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(m.date_mouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.article_nom}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.type_mouvement === 'ENTREE' ? 'text-emerald-700' : 'text-orange-700'}`}>
                          {m.type_mouvement === 'ENTREE' ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                          <StatusBadge value={m.type_mouvement} />
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{Number(m.quantite).toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{m.motif || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.cree_par_username || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6"><Pagination page={pageM} count={countM} onPageChange={setPageM} /></div>
          </div>
        )
      )}

      {/* Modal Article */}
      <Modal open={modalA} onClose={closeA} title={editAId ? "Modifier l'article" : 'Nouvel article'}>
        <form onSubmit={submitArticle} className="space-y-4">
          <FormField label="Nom" required><input type="text" value={formA.nom} onChange={e => sva('nom', e.target.value)} className="input-field" required placeholder="Ex: Engrais, Terreau..."/></FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Unité"><select value={formA.unite} onChange={e => sva('unite', e.target.value)} className="input-field"><option value="UNITE">Unité</option><option value="KG">kg</option><option value="LITRE">Litre</option></select></FormField>
            <FormField label="Quantité"><input type="number" step="0.01" value={formA.quantite} onChange={e => sva('quantite', e.target.value)} className="input-field"/></FormField>
            <FormField label="Seuil alerte"><input type="number" step="0.01" value={formA.seuil_alerte} onChange={e => sva('seuil_alerte', e.target.value)} className="input-field"/></FormField>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={closeA} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Enregistrement...' : editAId ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Mouvement */}
      <Modal open={modalM} onClose={() => { setModalM(false); setFormM(DFM); }} title="Enregistrer un mouvement">
        <form onSubmit={submitMouvement} className="space-y-4">
          <FormField label="Article" required>
            <select value={formM.article} onChange={e => svm('article', e.target.value)} className="input-field" required>
              <option value="">Sélectionner...</option>
              {articles.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.quantite} {a.unite?.toLowerCase()})</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" required>
              <select value={formM.type_mouvement} onChange={e => svm('type_mouvement', e.target.value)} className="input-field">
                <option value="ENTREE">Entrée (approvisionnement)</option>
                <option value="SORTIE">Sortie (consommation)</option>
              </select>
            </FormField>
            <FormField label="Quantité" required>
              <input type="number" step="0.01" min="0.01" value={formM.quantite} onChange={e => svm('quantite', e.target.value)} className="input-field" required/>
            </FormField>
          </div>
          <FormField label="Motif">
            <input type="text" value={formM.motif} onChange={e => svm('motif', e.target.value)} className="input-field" placeholder="Ex: Approvisionnement mensuel, Intervention parc..."/>
          </FormField>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => { setModalM(false); setFormM(DFM); }} className="btn btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
