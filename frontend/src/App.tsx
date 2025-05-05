import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { AuthForm } from '@/components/auth/AuthForm'
import { AppLayout } from '@/components/layout/AppLayout'
import { QRCodeScanner } from '@/components/whatsapp/QRCodeScanner'
import './App.css'

import './lib/i18n'

import { lazy, Suspense } from 'react'
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Instances = lazy(() => import('@/pages/Instances'))
const Chat = lazy(() => import('@/pages/Chat'))
const Templates = lazy(() => import('@/pages/Templates'))
const Statistics = lazy(() => import('@/pages/Statistics'))
const Admin = lazy(() => import('@/pages/Admin'))

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="zapban-theme">
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<AuthForm type="login" />} />
            <Route path="/auth/register" element={<AuthForm type="register" />} />
            <Route path="/auth/reset-password" element={<AuthForm type="reset-password" />} />
            <Route path="/auth/update-password" element={<AuthForm type="login" />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="instances" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Instances />
                </Suspense>
              } />
              <Route path="instances/:instanceId/qr" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <QRCodeScanner instanceId="" />
                </Suspense>
              } />
              <Route path="chat" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Chat />
                </Suspense>
              } />
              <Route path="chat/:instanceId" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Chat />
                </Suspense>
              } />
              <Route path="chat/:instanceId/:chatId" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Chat />
                </Suspense>
              } />
              <Route path="templates" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Templates />
                </Suspense>
              } />
              <Route path="statistics" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Statistics />
                </Suspense>
              } />
              <Route path="admin" element={
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                  <Admin />
                </Suspense>
              } />
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
