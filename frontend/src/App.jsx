import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import Search from './pages/Search';
import Orders from './pages/Orders';
import AdminPrescriptions from './pages/AdminPrescriptions';
import AdminOrders from './pages/AdminOrders';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminInventory from './pages/AdminInventory';
import ProtectedRoute from './components/ProtectedRoute';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/search" element={<Search />} />
          
          {/* User Routes (Protected) */}
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          
          {/* Admin Routes (Staff Managed) */}
          <Route path="/admin/prescriptions" element={<ProtectedRoute adminOnly={true}><AdminPrescriptions /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute adminOnly={true}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute adminOnly={true}><AdminInventory /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen mesh-bg flex flex-col">
        <Navbar />
        <LoginModal />

        <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <AnimatedRoutes />
        </main>

        <Footer />
      </div>
    </Router>
  )
}

export default App
