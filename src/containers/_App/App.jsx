import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/containers/Home/Home';
import Admin from '@/containers/Admin/Admin';
import './App.scss';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
};

export default App;


