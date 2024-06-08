import React from "react";
import "../Css/Login.css";
const Login = (props) => {
    return (
        <div className="login-container" style={{ marginTop: '200px' }}>
            <h1 className="welcome-message">Welcome To Our Voting App</h1>
            <button className="login-button" onClick = {props.connectWallet}>Login</button>
        </div>
    )
}

export default Login;