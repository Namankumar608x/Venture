import { useState } from 'react'
import Login from "../src/components/login";
import Signup from "../src/components/Signup";
import home from "./components/home";
import { Routes, Route } from "react-router-dom";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
     <Route path="/" element={<Signup />} />
     <Route path="/login" element={<Login />} />
     <Route path="/home" element={<home/>} />
     </Routes>
     
    </>
  )
}

export default App
