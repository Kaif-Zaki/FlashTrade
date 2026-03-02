const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900">Shipping Policy</h1>
        <div className="mt-5 space-y-4 text-gray-600 leading-relaxed">
          <p>
            Orders are processed within 1-2 business days. Delivery times vary
            by location and courier availability.
          </p>
          <p>
            Shipping fees are calculated during checkout. Free shipping offers
            may apply during promotions.
          </p>
          <p>
            Once shipped, you will receive order updates and delivery status.
            Delays may occur due to weather, holidays, or high demand periods.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
