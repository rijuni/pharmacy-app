import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginModal from './components/LoginModal';
import Medicines from './pages/Medicines';
import Cart from './pages/Cart';
import Prescriptions from './pages/Prescriptions';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <LoginModal />

        <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/profile" element={<Profile />} />
            {/* Other routes will be added here */}
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App
