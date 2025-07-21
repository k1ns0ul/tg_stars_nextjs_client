import './App.css';
import React, { useEffect } from 'react';
import { Route, Routes} from 'react-router-dom'
import Header from '@/components/Header/Header';
import Form from '@/components/Form/Form';
import ProductList from '@/components/ProductList/ProductList';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route index element = {<ProductList />}/>
        <Route path={`form`} element = {<Form/>}/>
      </Routes> 
    </div>
  );
}

export default App;
