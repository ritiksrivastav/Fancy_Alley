import React, {Fragment} from 'react'
import Search from './Search'

import {useDispatch, useSelector} from 'react-redux'
import {useAlert} from 'react-alert'

import { logOut } from '../../actions/userActions'

import {Routes, Route, Link} from 'react-router-dom'

import '../../App.css' 

const Header = () => {
    const alert = useAlert();
    const dispatch = useDispatch();

    const {user, loading} = useSelector(state => state.auth)
    const {cartItems} = useSelector(state => state.cart)
    console.log(user && user.name)

    const logoutHandler = () =>{
        dispatch(logOut());
        alert.success('Logged out successfully')
    }

    return  (
        <Fragment>
            <nav className="navbar row">
                <div className="col-12 col-md-3">
                    <div className="navbar-brand">
                    <Link to="/">
                        <img src="/images/logo1.png"/>
                    </Link>
                    </div>
                </div>
                
                <div className="col-12 col-md-6 mt-2 mt-md-0">
                    <Search />
                </div>

                <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">
                    <Link to="/cart" style={{textDecoration: 'none'}}>
                        <span id="cart" className="ml-3">Cart</span>
                        <span className="ml-1" id="cart_count">{cartItems.length}</span>
                    </Link>
                    
                    {user ? (
                        <div className='ml-4 dropdown d-inline'>
                            <Link to="#!" className="btn dropdown-toggle mr-4" type="button" id="dropDownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <figure className="avatar avatar-nav">
                                    <img
                                        src={user.avatar && user.avatar.url}
                                        alt={user && user.name}
                                        className="rounded-circle"
                                    />
                                </figure>
                                <span>{user && user.name}</span>
                            </Link>
                            <div className="dropdown-menu" aria-labelledby="dropDownMenuButton">
                                {user && user.role === 'admin' && (
                                    <Link className="dropdown-item" to="/dashboard">Dashboard</Link>
                                )}
                                <Link className="dropdown-item" to="/orders/me">Orders</Link>
                                <Link className="dropdown-item" to="/me">Profile</Link>
                                <Link className="dropdown-item text-danger" to="/" onClick={logoutHandler}>
                                   <strong>
                                    Logout
                                    </strong>
                                </Link>
                            </div>
                        </div>
                        
                    ): !loading && <Link to="/login"className="btn ml-4" id="login_btn"><strong>Login</strong></Link>}

                </div>
                </nav>
        </Fragment>
    )
}

export default Header