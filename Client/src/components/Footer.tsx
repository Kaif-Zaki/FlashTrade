import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import vexoLogo from "../assets/VexoLogo.png";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-blue-500">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center">
            <img src={vexoLogo} alt="Vexo" className="h-8 w-auto" />
          </div>
          <p className="text-gray-400 leading-relaxed">
            Your one-stop shop for the latest products and accessories
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm tracking-widest font-semibold mb-6">
            QUICK LINKS
          </h3>
          <ul className="space-y-4 text-gray-400">
            <li>
              <Link to="/products" className="hover:text-white">
                Products
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-white">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h3 className="text-sm tracking-widest font-semibold mb-6">
            CUSTOMER SERVICE
          </h3>
          <ul className="space-y-4 text-gray-400">
            <li>
              <Link to="/about-us" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="hover:text-white">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link to="/faqs" className="hover:text-white">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm tracking-widest font-semibold mb-6">
            CONTACT US
          </h3>
          <ul className="space-y-5 text-gray-400">
            <li className="flex items-center gap-3">
              <Mail size={18} />
              <a href="mailto:support@vexo.com" className="hover:text-white underline">
                support@vexo.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} />
              <a href="tel:+94776737532" className="hover:text-white">
                +94 776737532
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} />
              <a
                href="https://maps.google.com/?q=Colombo,Sri+Lanka"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                123 Colombo, Sri Lanka
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="py-6 text-center text-gray-400 text-sm">
        © Vexo. All Rights Reserved
      </div>
    </footer>
  );
}
