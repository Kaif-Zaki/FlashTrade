const faqs = [
  {
    q: "How long does delivery take?",
    a: "Most orders are delivered within 2-5 business days depending on location.",
  },
  {
    q: "Can I return a product?",
    a: "Yes, you can request a return within 7 days if the product is unused and in original condition.",
  },
  {
    q: "Do you support cash on delivery?",
    a: "Yes, cash on delivery is available for selected regions.",
  },
  {
    q: "How can I contact support?",
    a: "You can use the Contact page or email us at support@vexo.com.",
  },
];

const Faqs = () => {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
        <div className="mt-6 space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">{item.q}</p>
              <p className="mt-2 text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faqs;
