const values = [
  {
    title: "Customer First",
    text: "Every feature and process is designed to make shopping simpler, faster, and safer for customers.",
  },
  {
    title: "Quality Over Noise",
    text: "We focus on products that are useful, reliable, and worth the price, not just trendy.",
  },
  {
    title: "Transparent Service",
    text: "From pricing to delivery updates, we believe customers should always know what to expect.",
  },
  {
    title: "Continuous Improvement",
    text: "We improve weekly through customer feedback, performance data, and operational reviews.",
  },
];

const stats = [
  { label: "Products Listed", value: "5,000+" },
  { label: "Happy Customers", value: "12,000+" },
  { label: "Average Delivery", value: "2-5 Days" },
  { label: "Support Availability", value: "24/7" },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gray-900 px-5 py-10 text-white shadow-sm sm:px-8 sm:py-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-gray-300 uppercase">About Vexo</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Built To Make Online Shopping Feel Effortless
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">
              Vexo is a modern commerce platform focused on trusted products, smooth checkout, and reliable delivery.
              We combine strong technology with human-centered support so customers can shop confidently from discovery
              to doorstep.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Who We Are</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              We started Vexo with one clear goal: remove friction from online shopping. Too many stores felt slow,
              confusing, and inconsistent. We built Vexo to be different, with better product clarity, cleaner
              interfaces, and a purchasing flow that respects customer time.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600">
              Today, Vexo serves customers across multiple categories including fashion, electronics, and lifestyle
              products. We partner with dependable suppliers and continuously review quality, fulfillment speed, and
              post-purchase support.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
            <p className="mt-4 leading-relaxed text-gray-600">
              To deliver a trustworthy and modern shopping experience where customers can find what they need quickly,
              buy with confidence, and receive consistent support at every step.
            </p>
            <div className="mt-5 rounded-xl bg-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-900">Our Promise</p>
              <p className="mt-1 text-sm text-gray-600">
                Clear pricing, reliable delivery, and customer-first support without hidden friction.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Core Values</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">{value.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">How We Work</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-700">01. Curate</p>
              <p className="mt-2 text-sm text-gray-600">
                We shortlist products based on relevance, reliability, and customer demand.
              </p>
            </div>
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-700">02. Validate</p>
              <p className="mt-2 text-sm text-gray-600">
                We review quality, stock consistency, and logistics capability before scaling listings.
              </p>
            </div>
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-700">03. Support</p>
              <p className="mt-2 text-sm text-gray-600">
                We track order journeys and resolve issues quickly through responsive support channels.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-7 shadow-sm sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
