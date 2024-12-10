import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../../containers/Home/Home.jsx';
import './App.scss';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;


