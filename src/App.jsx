import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UploadPage from './pages/UploadPage'
import AnalysisListPage from './pages/AnalysisListPage'
import AnalysisResultPage from './pages/AnalysisResultPage'
import HelpLayout from './pages/help/HelpLayout'
import HelpIntroduction from './pages/help/HelpIntroduction'
import HelpTutorial from './pages/help/HelpTutorial'
import HelpUpload from './pages/help/HelpUpload'

function AnalysisResultDefaultPanel() {
  const { taskId } = useParams()
  return <Navigate to={`/analysis/result/${taskId}/composition`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analysis" element={<AnalysisListPage />} />
          <Route path="/analysis/result/:taskId/:resultPanel" element={<AnalysisResultPage />} />
          <Route path="/analysis/result/:taskId" element={<AnalysisResultDefaultPanel />} />
          <Route path="/help" element={<HelpLayout />}>
            <Route index element={<Navigate to="introduction" replace />} />
            <Route path="introduction" element={<HelpIntroduction />} />
            <Route path="tutorial" element={<HelpTutorial />} />
            <Route path="upload" element={<HelpUpload />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
