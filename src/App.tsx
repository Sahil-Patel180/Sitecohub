import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader';

const Landing = lazy(() => import('./pages/Landing'));
const Showcase = lazy(() => import('./pages/Showcase'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="showcase" element={<Showcase />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
