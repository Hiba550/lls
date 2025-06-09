import React, { useEffect } from "react";

const Packing = () => {
  useEffect(() => {
    // Redirect to localhost:3001
    window.location.href = "http://localhost:3001";
  }, []);

  // Return a simple loading message while redirecting
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh" 
    }}>
      <div style={{ textAlign: "center" }}>
        <h2>Redirecting to Packing System...</h2>
        <p>If you are not redirected automatically, click <a href="http://localhost:3001">here</a>.</p>
      </div>
    </div>
  );
};

export default Packing;