import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";

const SellerApprovalRequired = () => {
  const { sellerApproved, sellerActive } = useAuth();
  const isPendingApproval = sellerApproved !== true;
  const isInactive = sellerApproved === true && sellerActive === false;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <section className="w-full rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isPendingApproval ? "Waiting for Admin Approval" : "Seller Account Inactive"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {isPendingApproval
              ? "Your seller account request is submitted and waiting for admin approval."
              : isInactive
                ? "Your seller account is currently inactive. Please contact admin to reactivate it."
                : "Your seller account cannot access management pages right now."}
          </p>
          <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
            Admin approval is required to open Seller Panel pages.
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            You can still browse all products.
          </p>

          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              View All Products
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerApprovalRequired;
