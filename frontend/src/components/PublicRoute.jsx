/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function PublicRoute({children}) {
    const { user } = useSelector(store=>store.auth);
    const navigate = useNavigate();

    useEffect(()=>{
        if(user && user.room){
            navigate(`/admin/dashboard/${user.room}`);
        }
    },[user, navigate])

    // If user is logged in, don't render the login/signup page
    if(user && user.room){
        return null;
    }

    return (
        <>{children}</>
    )
}

export default PublicRoute