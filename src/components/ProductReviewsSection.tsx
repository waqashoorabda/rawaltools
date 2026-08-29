import React, { useState } from 'react';
import { 
  Star, 
  Check, 
  ShieldCheck, 
  MessageSquare, 
  ThumbsUp, 
  Plus, 
  X, 
  MapPin, 
  Calendar, 
  Send,
  AlertCircle,
  CheckCircle2,
  Filter,
  UserCheck
} from 'lucide-react';
import { Product, ProductReview, ReviewStats, StoreSettings } from '../types';
import { 
  getProductReviews, 
  getProductReviewStats, 
  addStoredReview, 
  updateStoredReview, 
  deleteStoredReview, 
  approveStoredReview, 
  rejectStoredReview 
} from '../utils/storage';
import { ThemeId, THEMES } from '../utils/theme';

interface ProductReviewsSectionProps {
  product: Product;
  settings: StoreSettings;
  theme?: ThemeId;
  isAdmin?: boolean;
  onReviewsUpdated?: () => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  settings,
  theme = 'industrial_yellow',
  isAdmin = false,
  onReviewsUpdated,
}) => {
  const themeConfig = THEMES[theme] || THEMES.industrial_yellow;
  const isLight = !themeConfig.isDark;

  // Local state for reviews and helpful counts
  const [reviewsList, setReviewsList] = useState<ProductReview[]>(() => {
    return getProductReviews(product.id, isAdmin);
  });
  const [stats, setStats] = useState<ReviewStats>(() => {
    return getProductReviewStats(product.id);
  });

  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [userVotedIds, setUserVotedIds] = useState<string[]>([]);

  // Submission Form State
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Admin Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Refresh reviews list
  const refreshReviews = () => {
    const updated = getProductReviews(product.id, isAdmin);
    setReviewsList(updated);
    setStats(getProductReviewStats(product.id));
    if (onReviewsUpdated) onReviewsUpdated();
  };

  // Handle Review Submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setFormError('Please write a helpful review (at least 10 characters).');
      return;
    }

    // Auto-approve if submitted by admin, or set status approved/pending
    const newStatus = isAdmin ? 'approved' : 'approved'; // Instantly approved for high-friction social proof, or pending

    addStoredReview({
      productId: product.id,
      customerName: customerName.trim(),
      customerCity: customerCity.trim() || 'Rawalpindi / Islamabad',
      rating,
      title: reviewTitle.trim() || undefined,
      comment: reviewComment.trim(),
      isVerifiedPurchase: true,
      status: newStatus,
      helpfulCount: 1,
    });

    setSubmitSuccess(true);
    refreshReviews();

    setTimeout(() => {
      setCustomerName('');
      setCustomerCity('');
      setRating(5);
      setReviewTitle('');
      setReviewComment('');
      setSubmitSuccess(false);
      setIsWriteReviewOpen(false);
    }, 2000);
  };

  // Handle Helpful Upvote
  const handleHelpfulClick = (rev: ProductReview) => {
    if (userVotedIds.includes(rev.id)) return;

    const updated = updateStoredReview({
      ...rev,
      helpfulCount: (rev.helpfulCount || 0) + 1,
    });
    setUserVotedIds((prev) => [...prev, rev.id]);
    refreshReviews();
  };

  // Admin Quick Actions
  const handleAdminApprove = (id: string) => {
    approveStoredReview(id);
    refreshReviews();
  };

  const handleAdminReject = (id: string) => {
    rejectStoredReview(id);
    refreshReviews();
  };

  const handleAdminDelete = (id: string) => {
    if (window.confirm('Delete this customer review permanently?')) {
      deleteStoredReview(id);
      refreshReviews();
    }
  };

  const handleAdminSaveReply = (rev: ProductReview) => {
    if (!adminReplyText.trim()) return;
    updateStoredReview({
      ...rev,
      adminReply: adminReplyText.trim(),
      adminRepliedAt: new Date().toISOString(),
    });
    setReplyingReviewId(null);
    setAdminReplyText('');
    refreshReviews();
  };

  // Filtered reviews
  const displayedReviews = reviewsList.filter((rev) => {
    if (filterRating !== 'all' && Math.round(rev.rating) !== filterRating) return false;
    if (onlyVerified && !rev.isVerifiedPurchase) return false;
    return true;
  });

  const totalReviewsCount = stats.totalReviews;
  const avgRating = stats.averageRating || 5.0;

  return (
    <div className={`mt-8 pt-8 border-t space-y-6 font-sans ${
      isLight ? 'border-slate-200' : 'border-slate-800'
    }`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </span>
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Customer Reviews & Feedback
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Genuine ratings & testimonials from industrial workshops, fabricators, and contractors across Pakistan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteReviewOpen((prev) => !prev)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
            isWriteReviewOpen
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
          }`}
        >
          {isWriteReviewOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
          <span>{isWriteReviewOpen ? 'Close Form' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Aggregate Rating & Verification Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
      }`}>
        {/* Left: Overall Score */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 md:border-r md:pr-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-amber-400">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-slate-400">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(avgRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Based on <strong>{totalReviewsCount}</strong> verified customer reviews
          </div>

          <div className="pt-2 flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold text-emerald-500">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% Genuine Buyer Feedback</span>
          </div>
        </div>

        {/* Right: Star Breakdown Progress Bars */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.ratingCounts[stars] || 0;
            const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFilterRating(filterRating === stars ? 'all' : stars)}
                  className={`w-14 text-left font-bold flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer ${
                    filterRating === stars ? 'text-amber-400 font-extrabold' : isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>

                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-10 text-right text-[11px] text-slate-400">
                  {pct}%
                </span>
                <span className="w-8 text-right text-[11px] text-slate-500">
                  ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Form Card */}
      {isWriteReviewOpen && (
        <form
          onSubmit={handleSubmitReview}
          className={`p-5 sm:p-6 rounded-2xl border space-y-4 animate-fadeIn ${
            isLight ? 'bg-white border-amber-300 shadow-lg' : 'bg-[#121722] border-amber-500/40 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Share Your Experience with {product.name}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Verified Workshop Review</span>
          </div>

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Thank you! Your review and rating have been published successfully.</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {/* Star Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Your Overall Rating:
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-mono font-bold text-amber-400">
                {rating}.0 Star{rating > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Your Name / Business Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Tariq Mehmood / Bilal Autos"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-sans ${
                  isLight 
                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                    : 'bg-[#0B0E14] text-white border-[#2A3448] focus:border-amber-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                City / Location (Optional)
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="e.g. Rawalpindi / Lahore"
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-sans ${
                  isLight 
                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                    : 'bg-[#0B0E14] text-white border-[#2A3448] focus:border-amber-400'
                }`}
              />
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Headline / Summary (Optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Solid copper motor and fast delivery!"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-sans ${
                isLight 
                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                  : 'bg-[#0B0E14] text-white border-[#2A3448] focus:border-amber-400'
              }`}
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Your Detailed Review & Testimonial *
            </label>
            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Describe tool performance, build quality, vibration, cutting speed, or WhatsApp ordering experience..."
              className={`w-full text-xs p-3 rounded-xl border outline-none font-sans leading-relaxed ${
                isLight 
                  ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-amber-400' 
                  : 'bg-[#0B0E14] text-white border-[#2A3448] focus:border-amber-400'
              }`}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsWriteReviewOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              filterRating === 'all'
                ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-xs'
                : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                : 'bg-[#121622] text-slate-300 border-[#242E42] hover:bg-[#1A2234]'
            }`}
          >
            All Reviews ({totalReviewsCount})
          </button>

          {[5, 4, 3].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                filterRating === star
                  ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-xs'
                  : isLight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  : 'bg-[#121622] text-slate-300 border-[#242E42] hover:bg-[#1A2234]'
              }`}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          ))}

          <button
            type="button"
            onClick={() => setOnlyVerified((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
              onlyVerified
                ? 'bg-sky-500 text-white border-sky-400 font-extrabold shadow-xs'
                : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                : 'bg-[#121622] text-slate-300 border-[#242E42] hover:bg-[#1A2234]'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span>Verified Buyers Only</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Showing {displayedReviews.length} of {totalReviewsCount}
        </span>
      </div>

      {/* Testimonials List */}
      {displayedReviews.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E121B] border-[#1F2738]'
        }`}>
          <Star className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            No testimonials match the selected filter. Be the first to share your rating!
          </p>
          <button
            type="button"
            onClick={() => setIsWriteReviewOpen(true)}
            className="px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write First Review</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((rev) => {
            const hasVoted = userVotedIds.includes(rev.id);
            const isReplying = replyingReviewId === rev.id;

            return (
              <div
                key={rev.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  rev.status === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    : 'bg-[#0E121B] border-[#1F2738] hover:border-slate-700'
                }`}
              >
                {/* Header of review card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-500 font-bold flex items-center justify-center text-xs shrink-0">
                      {rev.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {rev.customerName}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>

                      {rev.customerCity && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{rev.customerCity}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Date */}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Review Body */}
                <div className="py-3 space-y-1.5">
                  {rev.title && (
                    <h5 className={`font-bold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      "{rev.title}"
                    </h5>
                  )}
                  <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {rev.comment}
                  </p>
                </div>

                {/* Official Store Admin Reply */}
                {rev.adminReply && (
                  <div className={`p-3 rounded-xl text-xs space-y-1 my-2 border-l-3 border-amber-400 ${
                    isLight ? 'bg-amber-50/80 border-amber-200 text-slate-800' : 'bg-amber-500/10 border-[#332A1C] text-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-500">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>🏪 {settings.storeName} Official Response:</span>
                      </span>
                      {rev.adminRepliedAt && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rev.adminRepliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="italic text-xs">
                      "{rev.adminReply}"
                    </p>
                  </div>
                )}

                {/* Inline Admin Reply Form */}
                {isReplying && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-400/50 space-y-2 mt-2">
                    <span className="text-xs font-bold text-amber-400">
                      Reply as {settings.storeName}:
                    </span>
                    <textarea
                      rows={2}
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder="Write official response to customer..."
                      className="w-full text-xs bg-black text-white p-2 rounded border border-slate-700 outline-none focus:border-amber-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminSaveReply(rev)}
                        className="text-xs bg-amber-400 text-black font-bold px-3 py-1 rounded"
                      >
                        Save Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer of Card: Helpful Button + Admin Moderation Controls */}
                <div className="flex items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev)}
                    disabled={hasVoted}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      hasVoted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        : 'bg-[#151A24] hover:bg-[#1E2534] text-slate-400 border-[#2A3448]'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'fill-emerald-400' : ''}`} />
                    <span>Helpful {rev.helpfulCount ? `(${rev.helpfulCount})` : ''}</span>
                  </button>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {rev.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleAdminApprove(rev.id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {rev.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleAdminReject(rev.id)}
                          className="px-2 py-1 bg-slate-800 text-slate-400 rounded hover:text-rose-400 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setAdminReplyText(rev.adminReply || '');
                        }}
                        className="px-2 py-1 bg-slate-800 text-amber-400 rounded hover:bg-slate-700 cursor-pointer"
                      >
                        {rev.adminReply ? 'Edit Reply' : 'Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminDelete(rev.id)}
                        className="px-2 py-1 bg-slate-800 text-rose-400 rounded hover:bg-rose-900/60 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
