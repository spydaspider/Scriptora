import logo from './logo.svg';
import './App.css';
import Dashboard from './components/dashboard';
import {BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';

  

export default function App() {
   return (
    <div className = "Scriptora">
      <BrowserRouter>
           <Routes>
        <Route exact path = '/' element = { <Dashboard/>}/>
      </Routes>

      </BrowserRouter> 
    </div>
  );
}



