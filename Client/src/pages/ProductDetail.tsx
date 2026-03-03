import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { getProductByIdRequest } from "../service/productService.ts";
import type { Product } from "../types/Product";
import { getProfileRequest } from "../service/authService.ts";
import { addToCartRequest } from "../service/cartService.ts";
import { createReviewRequest, getReviewsRequest } from "../service/reviewService.ts";
import type { Review } from "../types/Review";
import { useAuth } from "../context/useAuth.ts";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewUser, setReviewUser] = useState<{ name: string; email: string } | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review: "",
  });
  const isOutOfStock = !!product && product.stock <= 0;
  const selectedSizePrice =
    product && selectedSize ? product.sizePrices?.[selectedSize] : undefined;
  const displayPrice = Number.isFinite(selectedSizePrice) ? Number(selectedSizePrice) : product?.price ?? 0;
  const canBuy = !isLoggedIn || userRole === "customer";

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("Invalid product");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getProductByIdRequest(id);
        setProduct(result);
        setSelectedSize(result.sizes?.[0] || "");
        setSelectedColor(result.colors?.[0] || "");
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load product details");
        } else {
          setError("Failed to load product details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!id) {
        setIsReviewsLoading(false);
        return;
      }

      setIsReviewsLoading(true);
      setReviewError("");
      try {
        const result = await getReviewsRequest(id);
        setReviews(result);
      } catch (err) {
        if (err instanceof AxiosError) {
          setReviewError(err.response?.data?.message || "Failed to load reviews");
        } else {
          setReviewError("Failed to load reviews");
        }
      } finally {
        setIsReviewsLoading(false);
      }
    };

    loadReviews();
  }, [id]);

  useEffect(() => {
    const loadReviewUser = async () => {
      try {
        const profile = await getProfileRequest();
        setReviewUser({ name: profile.name, email: profile.email });
      } catch {
        setReviewUser(null);
      }
    };

    loadReviewUser();
  }, []);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!canBuy) {
      setAddMessage("Seller and admin accounts cannot place orders.");
      return;
    }
    if (product.stock <= 0) {
      setAddMessage("Out of stock");
      return;
    }
    setAddMessage("");
    setIsAdding(true);

    try {
      await addToCartRequest({
        product: product._id,
        qty,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      });
      window.dispatchEvent(new Event("cart-updated"));
      setAddMessage("Added to cart");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err instanceof AxiosError) {
        setAddMessage(err.response?.data?.message || "Failed to add to cart");
      } else {
        setAddMessage("Failed to add to cart");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setReviewError("");
    setReviewSuccess("");

    const { rating, review } = reviewForm;
    if (!review.trim()) {
      setReviewError("Review is required");
      return;
    }

    setIsSubmittingReview(true);
    try {
      let reviewName = reviewUser?.name || "";
      let reviewEmail = reviewUser?.email || "";

      if (!reviewName || !reviewEmail) {
        const profile = await getProfileRequest();
        reviewName = profile.name;
        reviewEmail = profile.email;
        setReviewUser({ name: profile.name, email: profile.email });
      }

      const createdReviewResponse = await createReviewRequest({
        name: reviewName.trim(),
        email: reviewEmail.trim(),
        rating: Number(rating),
        review: review.trim(),
        productId: id,
      });
      if (createdReviewResponse.review.isApproved) {
        setReviews((prev) => [createdReviewResponse.review, ...prev]);
      }
      setReviewSuccess(createdReviewResponse.message || "Review submitted successfully");
      setReviewForm({ rating: 5, review: "" });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err instanceof AxiosError) {
        setReviewError(err.response?.data?.message || "Failed to submit review");
      } else {
        setReviewError("Failed to submit review");
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-900 hover:text-white"
        >
          <ArrowLeft size={17} />
        </button>

        {isLoading && <p className="text-sm text-gray-600">Loading product...</p>}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && product && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-sm text-gray-500">No image</div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">{product.name}</h1>
                {isOutOfStock ? (
                  <p className="mb-4 text-sm font-semibold text-red-600">Out of stock</p>
                ) : (
                  <p className="mb-4 text-sm text-gray-500">Stock: {product.stock}</p>
                )}
                <p className="mb-6 text-2xl font-bold text-gray-900">LKR {displayPrice.toLocaleString()}</p>

                <div className="mb-5">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Quantity</p>
                  <div className="flex w-fit items-center gap-3 rounded-lg border border-gray-300 px-3 py-2">
                    <button
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      disabled={isOutOfStock}
                      className="w-5 text-center text-lg font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{qty}</span>
                    <button
                      onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                      disabled={isOutOfStock || qty >= product.stock}
                      className="w-5 text-center text-lg font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-gray-700">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            selectedSize === size
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          {size}
                          {product.sizePrices?.[size] !== undefined && (
                            <span className="ml-1 text-[11px] opacity-90">
                              (LKR {Number(product.sizePrices[size]).toLocaleString()})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-gray-700">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            selectedColor === color
                              ? "border-red-500 bg-red-500 text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Description</p>
                  <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
                </div>

                {canBuy ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isOutOfStock}
                    className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ShoppingCart size={15} />
                    {isOutOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add To Cart"}
                  </button>
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    Seller accounts are sell-only. Switch to a customer account to buy.
                  </p>
                )}
                {addMessage && <p className="mt-3 text-sm text-gray-700">{addMessage}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Customer Reviews</h2>
                {isReviewsLoading && <p className="text-sm text-gray-600">Loading reviews...</p>}
                {!isReviewsLoading && reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                {!isReviewsLoading && !reviewError && reviews.length === 0 && (
                  <p className="text-sm text-gray-600">No reviews yet for this product.</p>
                )}
                {!isReviewsLoading && !reviewError && reviews.length > 0 && (
                  <div className="space-y-4">
                    {reviews.map((item) => (
                      <article key={item._id} className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="mb-2 text-xs text-gray-500">{item.email}</p>
                        <div className="mb-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg leading-none ${
                                star <= item.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{item.review}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Write a Review</h2>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Reviewing as{" "}
                    <span className="font-semibold text-gray-900">
                      {reviewUser ? `${reviewUser.name} (${reviewUser.email})` : "logged-in user"}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                        className={`text-2xl leading-none transition-colors ${
                          star <= reviewForm.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Write your review..."
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, review: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700 disabled:opacity-70"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                  {reviewSuccess && <p className="text-sm text-green-600">{reviewSuccess}</p>}
                  {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
