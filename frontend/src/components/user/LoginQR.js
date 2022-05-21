import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../layout/Loader";
import MetaData from "../layout/MetaData";
import { useNavigate } from "react-router-dom";
import { loginQR, clearErrors } from "../../actions/userActions";
import axios from "axios";

const LoginQR = () => {
  const navigate = useNavigate();

  const [dataURL,setDataURL] = useState("");
  const [tokenID,setTokenID] = useState("");
  const alert = useAlert();
  const dispatch = useDispatch();

  const { isAuthenticated, error, loading } = useSelector(
    (state) => state.auth
  );

  const redirect = window.location.search
    ? window.location.search.split("=")[1]
    : "/";
  console.log(redirect);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }

    if (error) {
      dispatch(clearErrors());
    }
  }, [dispatch, alert, isAuthenticated, error, navigate]);

  useEffect(() => {
      async function fetchURL(){
        const req = await axios.get('/api/v1/qrgenerator');
        console.log('happening')
        setDataURL(req.data.dataURL)
        setTokenID(req.data.tokenID)
        // console.log(" data :" + req.data);
      }
      fetchURL()
  },[])

  useEffect(()=>{
    if (tokenID == "") return;
    const interval = setInterval(checkAuthQR,1000)

    async function checkAuthQR(){
      const {data} = await axios.post(`/api/v1/loginqr/${tokenID}`);

      if(data != "")
      {
        clearInterval(interval);

        dispatch(loginQR(data))
      }
    }
  },[dataURL])

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title={`LoginQR`} />

          <div className="row wrapper">
            <div className="col-10 col-lg-5">
              <form className="shadow-lg">
                <h1 className="mb-3">
                  <strong>QR Login</strong>
                </h1>
                  <img src={dataURL} className="rounded mx-auto d-block" width="300" height="300"/>
                <Link to="/login" className="float-none mb-4">
                  Login With Email?
                </Link>
              </form>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default LoginQR;
