import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({});

  const handleFormChange = (e) => {
    const { value,name } = e.target;
    
    setFormData(prev=>({
      ...prev,
      [name]: value
    }))
  };

  console.log(formData)
  return (
    <div>
      <form>
        <input type="text" name="username" onChange={handleFormChange} />
        <input type="text" name="email" onChange={handleFormChange} />
        <input type="text" name="password" onChange={handleFormChange} />
      </form>
    </div>
  );
}

export default App;
