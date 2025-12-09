import { useState } from 'react'
// import Login from "../src/components/login";
import Signup from "../src/components/Signup"
import { Routes, Route } from "react-router-dom";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
     <Route path="/" element={<Signup />} />
     </Routes>
     
    </>
  )
}

export default App
