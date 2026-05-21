import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import Presenca from '@/pages/Presenca'
import Notas from '@/pages/Notas'
import Alunos from '@/pages/Alunos'
import Professores from '@/pages/Professores'
import Bandas from '@/pages/Bandas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/professores" element={<Professores />} />
          <Route path="/bandas" element={<Bandas />} />
          <Route path="/" element={<Navigate to="/presenca" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
