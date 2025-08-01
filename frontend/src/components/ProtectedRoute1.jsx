/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function ProtectedRoutes1({children}) {


    const { user } = useSelector(store=>store.auth);
    const navigate = useNavigate();
    useEffect(()=>{
      const debugMode = false;
        if(!debugMode && !user){
            navigate("/login");
        }
    },[])

  return (
    <>{children}</>
  )
}

export default ProtectedRoutes1