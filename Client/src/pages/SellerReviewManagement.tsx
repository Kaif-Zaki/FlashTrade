import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  approveSellerReviewRequest,
  getPendingSellerReviewsRequest,
  type SellerPendingReview,
} from "../service/sellerService";

const SellerReviewManagement = () => {
  const [pendingReviews, setPendingReviews] = useState<SellerPendingReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [approvingReviewId, setApprovingReviewId] = useState("");
  const [error, setError] = useState("");

  const loadPendingReviews = async () => {
    setLoadingReviews(true);
    try {
      const reviewData = await getPendingSellerReviewsRequest();
      setPendingReviews(reviewData);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to load pending reviews");
      } else {
        setError("Failed to load pending reviews");
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const handleApproveReview = async (reviewId: string) => {
    setApprovingReviewId(reviewId);
    setError("");
    try {
      await approveSellerReviewRequest(reviewId);
      setPendingReviews((prev) => prev.filter((review) => review._id !== reviewId));
      window.dispatchEvent(new Event("seller-notification-updated"));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to approve review");
      } else {
        setError("Failed to approve review");
      }
    } finally {
      setApprovingReviewId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-900">Review Management</h1>
        <p className="mt-1 text-sm text-slate-600">Approve customer reviews for your products.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {loadingReviews && <p className="text-sm text-slate-600">Loading pending reviews...</p>}
          {!loadingReviews && pendingReviews.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No reviews waiting for your approval.
            </p>
          )}
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div key={review._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.productName || "Product"}</p>
                    <p className="text-xs text-slate-600">
                      By {review.name} ({review.email}) | Rating: {review.rating}/5
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApproveReview(review._id)}
                    disabled={approvingReviewId === review._id}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                  >
                    {approvingReviewId === review._id ? "Approving..." : "Approve Review"}
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-700">{review.review}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerReviewManagement;
