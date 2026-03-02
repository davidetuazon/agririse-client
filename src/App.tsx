import React, { Suspense, lazy } from 'react';
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
import AllocationRunProvider from './providers/AllocationRunProvider';
import colors from './constants/colors';
import './App.css';

const AppLayout = lazy(() => import('./components/layout/AppLayout/AppLayout'));
const Login = lazy(() => import('./pages/Login/Login'));
const Home = lazy(() => import('./pages/Home/Home'));
const Allocations = lazy(() => import('./pages/Allocations/Allocations'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const History = lazy(() => import('./pages/History/History'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

function FullPageLoader() {
  return (
    <div className='pageLoader' role='status' aria-live='polite' aria-label='Loading page'>
      <div className='pageLoaderSpinner' />
      <span className='pageLoaderText'>Loading...</span>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        toastOptions={{
          success: {duration: 1250},
          error: {duration: 4000},
          style: {
            background: colors.surfaceElevated,
            fontFamily: 'Poppins-SemiBold',
            color: colors.textHeading,
            width: 'fit-content',
            maxWidth: '500px',
            whiteSpace: 'pre-wrap'
          }
        }}
      />
      <AuthProvider>
        <AllocationRunProvider>
          <Suspense fallback={<FullPageLoader />}>
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
              <Route
                path='/settings'
                element={
                  <AppLayout>
                    <RequireAuth>
                      <Settings/>
                    </RequireAuth>
                  </AppLayout>
                }
              />
            </Routes>
          </Suspense>
        </AllocationRunProvider>
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