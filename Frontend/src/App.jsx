import { useState } from 'react'
import Login from "./components/login";
import Signup from "./components/Signup";
import Home from "./components/home";
import { Routes, Route } from "react-router-dom";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
     <Route path="/signup" element={<Signup />} />
     <Route path="/login" element={<Login />} />
     <Route path="/home" element={<Home />} />
     </Routes>
     
    </>
  )
}

export default App
