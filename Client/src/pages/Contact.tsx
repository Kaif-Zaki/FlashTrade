import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";
import { sendContactMessage } from "../service/contactService";
import { getProfileRequest } from "../service/authService";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ContactPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    message: "",
  });
  const [userEmail, setUserEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfileRequest();
        setUserEmail(profile.email);
        setForm((prev) => ({
          ...prev,
          name: prev.name || profile.name || "",
        }));
      } catch {
        setUserEmail("");
      }
    };

    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSending(true);

    try {
      let email = userEmail;
      if (!email) {
        const profile = await getProfileRequest();
        email = profile.email;
        setUserEmail(profile.email);
      }

      await sendContactMessage({
        ...form,
        email,
      });
      setSent(true);
      setForm({ name: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to send message");
      } else {
        setError("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail size={18} />,
      label: "Email Us",
      value: "support@vexo.lk",
      sub: "We reply within 24 hours",
    },
    {
      icon: <Phone size={18} />,
      label: "Call Us",
      value: "+94 77 123 4567",
      sub: "Mon – Sat, 9am – 6pm",
    },
    {
      icon: <MapPin size={18} />,
      label: "Visit Us",
      value: "Colombo 03, Sri Lanka",
      sub: "Head office location",
    },
    {
      icon: <Clock size={18} />,
      label: "Working Hours",
      value: "9:00 AM – 6:00 PM",
      sub: "Monday to Saturday",
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-100"
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gray-900 px-4 py-14 text-white sm:px-6 sm:py-16">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-gray-700 opacity-30" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-gray-600 opacity-20" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full border border-gray-700 opacity-10 -translate-y-1/2" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 tracking-widest uppercase">Get In Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            We'd Love To<br />
            <span className="text-gray-400">Hear From You.</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed">
            Have a question about your order, a product, or anything else?
            Our team is here and ready to help.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Contact Info Cards */}
          <div className="lg:w-64 xl:w-72 space-y-4 flex-shrink-0">
            {contactInfo.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center text-gray-600 transition-all duration-300 mb-3">
                  {item.icon}
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 mb-0.5">{item.value}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Right: Contact Form */}
          <div className="flex-1 bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
              Send Us a Message
            </h2>
            <p className="text-xs text-gray-400 mb-7">
              Fill out the form and we'll get back to you shortly.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="John Doe"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none transition-all duration-200 ${
                      focused === "name" ? "border-gray-900" : "border-transparent"
                    }`}
                    style={{ boxShadow: focused === "name" ? "none" : "0 0 0 1px #e5e7eb" }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Sending from: <span className="font-semibold text-gray-700">{userEmail || "your account email"}</span>
              </p>

              {/* Subject */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">
                  Subject
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  onFocus={() => setFocused("subject")}
                  onBlur={() => setFocused(null)}
                  placeholder="Order issue, Product query..."
                  className={`w-full border-2 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none transition-all duration-200 ${
                    focused === "subject" ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ boxShadow: focused === "subject" ? "none" : "0 0 0 1px #e5e7eb" }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block tracking-wide">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  rows={5}
                  placeholder="Write your message here..."
                  className={`w-full border-2 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none transition-all duration-200 resize-none ${
                    focused === "message" ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ boxShadow: focused === "message" ? "none" : "0 0 0 1px #e5e7eb" }}
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">
                  We typically respond within 24 hours.
                </p>
                <button
                  type="submit"
                  disabled={sending || sent}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    sent
                      ? "bg-green-500 text-white scale-95"
                      : sending
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-700 active:scale-95"
                  }`}
                >
                  {sent ? (
                    <>✓ Message Sent!</>
                  ) : sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send Message
                      <Send size={14} />
                    </>
                  )}
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </div>
        </div>

        {/* Bottom FAQ Strip */}
        <div className="mt-6 rounded-2xl bg-gray-900 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-0.5 text-sm font-bold">Looking for quick answers?</p>
              <p className="text-xs text-gray-400">
                Check our FAQ page for instant help on orders, returns and shipping.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/faqs")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-900 transition-colors duration-200 hover:bg-gray-200 sm:w-auto"
            >
              View FAQs
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
