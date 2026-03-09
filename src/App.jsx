import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Shared';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EspacesVerts from './pages/EspacesVerts';
import Interventions from './pages/Interventions';
import Signalements from './pages/Signalements';
import Equipements from './pages/Equipements';
import Equipes from './pages/Equipes';
import Materiel from './pages/Materiel';
import Stock from './pages/Stock';
import Statistiques from './pages/Statistiques';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"/></div>;
  return user ? children : <Navigate to="/login"/>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/"/> : <Login/>}/>
      <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index element={<Dashboard/>}/>
        <Route path="espaces" element={<EspacesVerts/>}/>
        <Route path="interventions" element={<Interventions/>}/>
        <Route path="signalements" element={<Signalements/>}/>
        <Route path="equipements" element={<Equipements/>}/>
        <Route path="equipes" element={<Equipes/>}/>
        <Route path="materiel" element={<Materiel/>}/>
        <Route path="stock" element={<Stock/>}/>
        <Route path="statistiques" element={<Statistiques/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/"/>}/>
    </Routes>
  );
}

export default function App() {
  return <Router><AuthProvider><ToastProvider><AppRoutes/></ToastProvider></AuthProvider></Router>;
}
