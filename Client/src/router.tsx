
import { createBrowserRouter } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import Layout from './pages/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import AdminRoutes from './pages/AdminRoutes'
import CartPage from './pages/CartPage'
import PrivateDetailsPage from './pages/PrivateDetailsPage'
import ProductList from './pages/ProductsList'
import ProductDetail from './pages/ProductDetail'
import CheckoutCustomerDetail from './pages/CheckoutCustomerDetail'
import CheckoutPayment from './pages/CheckoutPayment'
import ContactPage from './pages/Contact'
import AboutUs from './pages/AboutUs'
import Faqs from './pages/Faqs'
import ShippingPolicy from './pages/ShippingPolicy'
import OrderHistory from './pages/OrderHistory'
import { USER_ROLES } from './types/Auth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout/>,
    children:[
      {index: true, element: <WelcomePage />},
      {path:"products",element:<ProductList/>},
      {path:"products/:id",element:<ProductDetail/>},
      {path:"contact",element:<ContactPage/>},
      {path:"about-us",element:<AboutUs/>},
      {path:"faqs",element:<Faqs/>},
      {path:"shipping-policy",element:<ShippingPolicy/>},
      {path:"login",element:<LoginPage/>},
      {path:"signup",element:<RegisterPage/>},
      {
        element:<AdminRoutes/>,
        children:[
          {path:"dashboard",element:<WelcomePage/>},
          {path:"private-details",element:<PrivateDetailsPage/>},
        ]
      },
      {
        element:<AdminRoutes allowedRoles={[USER_ROLES.CUSTOMER]}/>,
        children:[
          {path:"cart",element:<CartPage/>},
          {path:"checkout/customer-details",element:<CheckoutCustomerDetail/>},
          {path:"checkout/payment",element:<CheckoutPayment/>},
          {path:"orders",element:<OrderHistory/>},
        ]
      }
    ]
  }

])

export default router
