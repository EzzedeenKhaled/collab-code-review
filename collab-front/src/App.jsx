import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import  Dashboard  from './Pages/Dashboard'
import Session from './Pages/Session';
export default function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session/:id" element={<Session />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
