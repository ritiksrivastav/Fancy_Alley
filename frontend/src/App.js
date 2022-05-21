import { useEffect, useState } from 'react';
import React from 'react';
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './components/Home';
import './App.css';

import { loadUser } from './actions/userActions';

import ProductDetails from './components/product/ProductDetails';

import Cart from './components/cart/Cart'

import Login from './components/user/Login';

import LoginQR from "./components/user/LoginQR";

import UpdateProfile from './components/user/UpdateProfile';

import Register from './components/user/Register';

import Dashboard from './components/admin/Dashboard';

import store from './store'

import Profile from './components/user/Profile';

import Payment from './components/cart/Payment'

import UpdatePassword from './components/user/UpdatePassword';

import ForgotPassword from './components/user/ForgotPassword';

import ConfirmOrder from './components/cart/ConfirmOrder';

import NewPassword from './components/user/NewPassword';

import axios from 'axios'

import ListOrders from './components/order/ListOrders'

import OrderDetails from './components/order/OrderDetails';

import { Elements } from '@stripe/react-stripe-js'

import { loadStripe } from '@stripe/stripe-js'

import OrderSuccess from './components/cart/OrderSuccess';

import Shipping from './components/cart/Shipping';

import ProtectedRoute from './components/route/ProtectedRoute';

import ProductsList from './components/admin/ProductsList';

import NewProduct from './components/admin/NewProduct';
import UpdateProduct from './components/admin/UpdateProduct';
import OrdersList from './components/admin/OrdersList';
import ProcessOrder from './components/admin/ProcessOrder';
import UsersList from './components/admin/UsersList';
import UpdateUser from './components/admin/UpdateUser';
import ProductReviews from './components/admin/ProductReviews';

function App() {

  const [stripeApiKey, setStripeApiKey] = useState('');

  useEffect(() => {
    store.dispatch(loadUser())

    async function getStripApiKey() {
      const { data } = await axios.get('/api/v1/stripeapi');

      setStripeApiKey(data.stripeApiKey)
    }

    getStripApiKey();

  }, [])

  return (
    <BrowserRouter>
    <div className="App"> 
      <Header/>
      <div className='container container-fluid'>
      <Routes>
        <Route path="/" element={<Home />} exact/>
        <Route path="/search/:keyword" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/loginqr" element={<LoginQR />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset/:token" element={<NewPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/success" element={<OrderSuccess />} />
        <Route path="/payment" 
        element={stripeApiKey &&
            <Elements stripe={loadStripe(stripeApiKey)}>
              <Payment />

            </Elements>
          }
        />
        <Route path="/orders/me" element={<ListOrders />} />
        <Route path="/me" element={<Profile />} exact/>
        <Route path="/cart" element={<Cart />} exact/>
        <Route path="/order/confirm" element={<ConfirmOrder />} exact/>
        <Route path="/me/update" element={<UpdateProfile />} exact/>
        <Route path="/password/update" element={<UpdatePassword />} exact />
        <Route path="/shipping" element={<Shipping />} exact/>
        <Route path="/order/:id" element={<OrderDetails />} exact/>
      </Routes>
      </div>
      <Routes>
      <Route path="/dashboard" element={<Dashboard />} exact/>
      <Route path="/admin/products" element={<ProductsList />} />
      <Route path="/admin/product" element={<NewProduct />} />
      <Route path="/admin/product/:id" element={<UpdateProduct />} />
      <Route path="/admin/orders" element={<OrdersList />} />
      <Route path="/admin/order/:id" element={<ProcessOrder />} />
      <Route path="/admin/users" element={<UsersList />} />
      <Route path="/admin/user/:id" element={<UpdateUser />} />
      <Route path="/admin/reviews" element={<ProductReviews />} />
      
        </Routes>
      <Footer />
    </div>
    </BrowserRouter>
  );
}

export default App;
