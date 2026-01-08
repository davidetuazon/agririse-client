import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import Cookies from 'js-cookie';
import { ACCESS_TOKEN } from './utils/constants';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './providers/AuthProvider';
import './App.css';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Allocations from './pages/Allocations';
import Analytics from './pages/Analytics';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        toastOptions={{
          success: {duration: 1250},
          error: {duration: 4000},
          style: {
            background: '#FFFFFF',
            fontFamily: 'Poppins-SemiBold',
            color: '#023430',
            width: 'fit-content',
            maxWidth: '500px',
            whiteSpace: 'pre-wrap'
          }
        }}
      />
      <AuthProvider>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={ <Navigate to='/home' /> } />
          <Route 
            path='/home'
            element={
              <AppLayout>
                <RequireAuth>
                  <Home/>
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path='/allocations'
            element={
              <AppLayout>
                <RequireAuth>
                  <Allocations/>
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path='/iot/analytics'
            element={
              <AppLayout>
                <RequireAuth>
                  <Analytics/>
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path='/iot/history'
            element={
              <AppLayout>
                <RequireAuth>
                  <History/>
                </RequireAuth>
              </AppLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function RequireAuth({ children }: { children: React.JSX.Element }) {
  const token = Cookies.get(ACCESS_TOKEN);
  const location = useLocation();

  if (!token) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }
  return children;
}

export default App;