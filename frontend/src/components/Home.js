import React, { Fragment, useState ,useEffect } from 'react'

import Pagination from 'react-js-pagination';

import { useParams } from 'react-router-dom';

import Slider, {Range} from 'rc-slider'

import 'rc-slider/assets/index.css'

import MetaData from './layout/MetaData'

import Product from './product/Product'

import { useDispatch, useSelector } from 'react-redux'

import { getProducts } from '../actions/productActions'

import Loader from './layout/Loader'

import { useAlert } from 'react-alert'
import { set } from 'express/lib/application';



const Home = () => {

    const [currentPage, setCurrentPage] = useState(1);  
    const [price, setPrice] = useState([1,500000]);
    const [category, setCategory] = useState('');
    const [rating,setRating] = useState(0);
    const categories = [
        'Electronics',
        'Cameras',
        'Laptops',
        'Accessories',
        'Headphones',
        'Food',
        "Books",
        'Clothes/Shoes',
        'Beauty/Health',
        'Sports',
        'Outdoor',
        'Home'
    ]

    const alert = useAlert();
    const dispatch = useDispatch();

    const {loading, products, error, productsCount, resPerPage, filteredProductsCount} = useSelector(state => state.products)
    console.log(products)
    const keyword = useParams().keyword;
    useEffect(()=>{

        if(error){
            return alert.error(error)
        }
        dispatch(getProducts(keyword, currentPage, price, category, rating));

    }, [dispatch, error,alert, keyword,currentPage, price, category, rating])

    function setCurrentPageNo(pageNumber) {
        setCurrentPage(pageNumber)
    }
    console.log(resPerPage)
    let count = productsCount;
    if(keyword){
        console.log(count);
        count = filteredProductsCount;
    }
  return (
    <Fragment>
        {loading ? <Loader/> : (
            <Fragment>
                <MetaData title={'Best Online Products'} />

                    <h1 id="products_heading">Find the latest exclusive products and get your Cart Simplified!</h1>
                    <section id="products" className="container mt-5">
                        <div className="row">
                            {keyword ? (
                                <Fragment>
                                    <div className='col-6 col-md-3 mt-5 mb-5'>
                                        <div className='px-5'>
                                            <Slider
                                                range
                                                marks={{
                                                    1 : "₹1",
                                                    500000 : "₹500000"
                                                }}
                                                min = {1}
                                                max = {500000}
                                                defaultValue = {[1,500000]}
                                                tipFormatter={value => `₹${value}`}
                                                tipProps ={{
                                                    placement: "top",
                                                    visible: true
                                                }}
                                                value = {price}
                                                onChange={price => setPrice(price)}
                                            />

                                            <hr className='my-5'/>
                                            
                                            <div className='my-5'>
                                                <h4 className='mb-3'>
                                                    Categories
                                                </h4>

                                                <ul className="pl-0">
                                                    {categories.map(category=>(
                                                        <li 
                                                            style = {{cursor: 'pointer', 
                                                                      listStyleType: 'none'                                                            
                                                                    }}
                                                                    key ={category}
                                                                    onClick = {()=>setCategory(category )}
                                                        >
                                                            {category}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <hr className='my-3'/>
                                            
                                            <div className='my-5'>
                                                <h4 className='mb-3'>
                                                    Ratings
                                                </h4>

                                                <ul className="pl-0">
                                                    {[5, 4, 3, 2, 1].map(star=>(
                                                        <li 
                                                            style = {{cursor: 'pointer', 
                                                                      listStyleType: 'none'                                                            
                                                                    }}
                                                                    key ={star}
                                                                    onClick = {()=>setRating(star )}
                                                        >
                                                            <div className='rating-outer'>
                                                                <div className='rating-inner'
                                                                     style={{
                                                                         width: `${star*20}%`
                                                                     }}
                                                                
                                                                >
                                                                    
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                        </div>
                                    </div>
                                    <div className='col-6 col-md-9'>
                                        <div className='row'>
                                            {
                                                products.map(product => (
                                                    <Product key={product._id} product={product} col={4}/>          
                                                ))
                                            }
                                        </div>
                                    </div>
                                </Fragment>
                            ): (
                                products.map(product => (
                                    <Product key={product._id} product={product} col={3}/>          
                                ))
                            )}
                        </div>
                    </section>
                    {resPerPage <= count && (
                        <div className='d-flex justify-content-center mt-5'>
                        <Pagination
                            activePage={currentPage}
                            itemsCountPerPage = {resPerPage}
                            totalItemsCount = {productsCount}
                            onChange = {setCurrentPageNo}
                            nextPageText = {'Next'}
                            prevPageText = {'Prev'}
                            firstPageText = {'First'}
                            lastPageText = {'Last'}
                            itemClass = "page=item" //Bootstrap Classes
                            linkClass='page-link' //Bootstrap Classes
                        />
                    </div>
                    )}

            </Fragment>
        )}
    </Fragment>
  )
}

export default Home