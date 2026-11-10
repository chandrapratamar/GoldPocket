import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { ActivityPage } from '../pages/ActivityPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ReceiptPage } from '../pages/ReceiptPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TradePage } from '../pages/TradePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="buy" element={<TradePage key="buy" side="buy" />} />
        <Route path="sell" element={<TradePage key="sell" side="sell" />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="receipt/:id" element={<ReceiptPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Old routes */}
        <Route path="trade" element={<Navigate to="/buy" replace />} />
        <Route path="assets" element={<Navigate to="/" replace />} />
        <Route path="transactions" element={<Navigate to="/activity" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
