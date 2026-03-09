import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'

// Eagerly load the landing page
import HomePage from './pages/HomePage'

// Lazy-load all other pages
const MenuPage = lazy(() => import('./pages/MenuPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const OffersPage = lazy(() => import('./pages/OffersPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Admin pages — separate chunk, only loaded by admins
const AdminGuard = lazy(() => import('./components/admin/AdminGuard'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'))
const MenuManagementPage = lazy(() => import('./pages/admin/MenuManagementPage'))
const DealsManagementPage = lazy(() => import('./pages/admin/DealsManagementPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order/:id" element={<OrderTrackingPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/offers" element={<OffersPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<OrderDetailPage />} />
                    <Route path="menu" element={<MenuManagementPage />} />
                    <Route path="deals" element={<DealsManagementPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
