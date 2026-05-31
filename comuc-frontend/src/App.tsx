import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import Presenca from '@/pages/Presenca'
import Notas from '@/pages/Notas'
import Alunos from '@/pages/Alunos'
import Professores from '@/pages/Professores'
import Bandas from '@/pages/Bandas'
import AlunoForm from '@/pages/AlunoForm'
import ProfessorForm from '@/pages/ProfessorForm'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/presenca" element={<Presenca />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/alunos/novo" element={<AlunoForm />} />
        <Route path="/alunos/:id/editar" element={<AlunoForm />} />
        <Route path="/professores" element={<Professores />} />
        <Route path="/professores/novo" element={<ProfessorForm />} />
        <Route path="/professores/:id/editar" element={<ProfessorForm />} />
        <Route path="/bandas" element={<Bandas />} />
        <Route path="/" element={<Navigate to="/presenca" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
