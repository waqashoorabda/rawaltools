import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  ShieldCheck, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  MapPin,
  Calendar,
  Package
} from 'lucide-react';
import { Product, ProductReview, ReviewStats, StoreSettings } from '../types';
import { 
  loadStoredReviews, 
  saveStoredReviews, 
  addStoredReview, 
  updateStoredReview, 
  deleteStoredReview, 
  approveStoredReview, 
  rejectStoredReview 
} from '../utils/storage';

interface AdminReviewsManagerViewProps {
  products: Product[];
  settings: StoreSettings;
  reviews?: ProductReview[];
  onUpdateReviews?: (updated: ProductReview[]) => void;
  onReviewsUpdated?: (updated: ProductReview[]) => void;
  onViewProduct?: (productId: string) => void;
}

export const AdminReviewsManagerView: React.FC<AdminReviewsManagerViewProps> = ({
  products,
  settings,
  reviews,
  onUpdateReviews,
  onReviewsUpdated,
  onViewProduct,
}) => {
  // Safe reviews list from props or local storage
  const [localReviews, setLocalReviews] = useState<ProductReview[]>(() => {
    return Array.isArray(reviews) && reviews.length > 0 ? reviews : loadStoredReviews();
  });

  // Keep local reviews in sync if props change
  useEffect(() => {
    if (Array.isArray(reviews)) {
      setLocalReviews(reviews);
    }
  }, [reviews]);

  const activeReviews = Array.isArray(reviews) && reviews.length > 0 ? reviews : localReviews;

  const notifyUpdate = (updated: ProductReview[]) => {
    setLocalReviews(updated);
    if (onUpdateReviews) onUpdateReviews(updated);
    if (onReviewsUpdated) onReviewsUpdated(updated);
  };
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Modal / Form state for Add/Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Form Fields
  const [formProductId, setFormProductId] = useState<string>(products[0]?.id || '');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerCity, setFormCustomerCity] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formIsVerified, setFormIsVerified] = useState(true);
  const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [formAdminReply, setFormAdminReply] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Add Modal
  const handleOpenAddModal = (defaultProduct?: string) => {
    setEditingReview(null);
    setFormProductId(defaultProduct || products[0]?.id || '');
    setFormCustomerName('');
    setFormCustomerCity('Lahore');
    setFormRating(5);
    setFormTitle('');
    setFormComment('');
    setFormIsVerified(true);
    setFormStatus('approved');
    setFormAdminReply('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rev: ProductReview) => {
    setEditingReview(rev);
    setFormProductId(rev.productId);
    setFormCustomerName(rev.customerName);
    setFormCustomerCity(rev.customerCity || '');
    setFormRating(rev.rating);
    setFormTitle(rev.title || '');
    setFormComment(rev.comment);
    setFormIsVerified(rev.isVerifiedPurchase);
    setFormStatus(rev.status);
    setFormAdminReply(rev.adminReply || '');
    setIsAddModalOpen(true);
  };

  // Submit Add/Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formComment.trim() || !formProductId) {
      alert('Please fill out Customer Name, Comment, and select a Product.');
      return;
    }

    if (editingReview) {
      const updated: ProductReview = {
        ...editingReview,
        productId: formProductId,
        customerName: formCustomerName.trim(),
        customerCity: formCustomerCity.trim(),
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        isVerifiedPurchase: formIsVerified,
        status: formStatus,
        adminReply: formAdminReply.trim() || undefined,
        adminRepliedAt: formAdminReply.trim() ? (editingReview.adminRepliedAt || new Date().toISOString()) : undefined,
      };
      const newList = updateStoredReview(updated);
      notifyUpdate(newList);
      showNotification('Review updated successfully!');
    } else {
      const newList = addStoredReview({
        productId: formProductId,
        customerName: formCustomerName.trim(),
        customerCity: formCustomerCity.trim(),
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        isVerifiedPurchase: formIsVerified,
        status: formStatus,
        adminReply: formAdminReply.trim() || undefined,
        adminRepliedAt: formAdminReply.trim() ? new Date().toISOString() : undefined,
        helpfulCount: Math.floor(Math.random() * 8) + 3,
      });
      notifyUpdate(newList);
      showNotification('New customer testimonial published successfully!');
    }

    setIsAddModalOpen(false);
  };

  // Quick Actions
  const handleApprove = (id: string) => {
    const updated = approveStoredReview(id);
    notifyUpdate(updated);
    showNotification('Review approved and published to product page!');
  };

  const handleReject = (id: string) => {
    const updated = rejectStoredReview(id);
    notifyUpdate(updated);
    showNotification('Review rejected and hidden from store.');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this customer review?')) {
      const updated = deleteStoredReview(id);
      notifyUpdate(updated);
      showNotification('Review permanently deleted.');
    }
  };

  const handleToggleVerified = (rev: ProductReview) => {
    const updated = updateStoredReview({
      ...rev,
      isVerifiedPurchase: !rev.isVerifiedPurchase,
    });
    notifyUpdate(updated);
    showNotification(`Verified Purchase status set to ${!rev.isVerifiedPurchase ? 'VERIFIED' : 'UNVERIFIED'}`);
  };

  const handleSaveReply = (rev: ProductReview) => {
    const updated = updateStoredReview({
      ...rev,
      adminReply: replyText.trim() || undefined,
      adminRepliedAt: replyText.trim() ? new Date().toISOString() : undefined,
    });
    notifyUpdate(updated);
    setReplyingReviewId(null);
    setReplyText('');
    showNotification('Official store reply saved!');
  };

  const handleApproveAllPending = () => {
    const pending = activeReviews.filter((r) => r.status === 'pending');
    if (pending.length === 0) return;
    const updated = activeReviews.map((r) => (r.status === 'pending' ? { ...r, status: 'approved' as const } : r));
    saveStoredReviews(updated);
    notifyUpdate(updated);
    showNotification(`Successfully approved all ${pending.length} pending reviews!`);
  };

  // Calculate Metrics
  const totalCount = activeReviews.length;
  const approvedCount = activeReviews.filter((r) => r.status === 'approved').length;
  const pendingCount = activeReviews.filter((r) => r.status === 'pending').length;
  const rejectedCount = activeReviews.filter((r) => r.status === 'rejected').length;
  
  const avgStoreRating = approvedCount > 0
    ? (activeReviews.filter((r) => r.status === 'approved').reduce((acc, r) => acc + r.rating, 0) / approvedCount).toFixed(1)
    : '5.0';

  const fiveStarCount = activeReviews.filter((r) => r.status === 'approved' && Math.round(r.rating) === 5).length;
  const verifiedCount = activeReviews.filter((r) => r.isVerifiedPurchase).length;

  // Filter List
  const filteredReviews = activeReviews.filter((rev) => {
    if (activeFilter !== 'all' && rev.status !== activeFilter) return false;
    if (selectedProductId !== 'all' && rev.productId !== selectedProductId) return false;
    if (ratingFilter !== 'all' && Math.round(rev.rating) !== ratingFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const product = products.find((p) => p.id === rev.productId);
      const matchName = rev.customerName.toLowerCase().includes(q);
      const matchCity = (rev.customerCity || '').toLowerCase().includes(q);
      const matchComment = rev.comment.toLowerCase().includes(q);
      const matchTitle = (rev.title || '').toLowerCase().includes(q);
      const matchProduct = product ? product.name.toLowerCase().includes(q) : false;
      return matchName || matchCity || matchComment || matchTitle || matchProduct;
    }

    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner Notification */}
      {notification && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A3448]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Product Reviews & Testimonials Manager</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {totalCount} Total
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add genuine customer testimonials, approve incoming buyer reviews, and build high-conversion social proof across your tool catalog.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleApproveAllPending}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve All Pending ({pendingCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Manual Testimonial</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#131822] border border-[#232B3B] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <span>Store Rating Avg</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{avgStoreRating}</span>
            <span className="text-xs text-amber-400 font-mono">/ 5.0</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {fiveStarCount} perfect 5-star ratings
          </div>
        </div>

        <div className="p-3.5 bg-[#131822] border border-[#232B3B] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <span>Live Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{approvedCount}</span>
            <span className="text-xs text-slate-400 font-mono">testimonials</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Visible to online shoppers
          </div>
        </div>

        <div className="p-3.5 bg-[#131822] border border-[#232B3B] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <span>Pending Review</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {pendingCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">awaiting</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Requires admin moderation
          </div>
        </div>

        <div className="p-3.5 bg-[#131822] border border-[#232B3B] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase font-bold tracking-wider">
            <span>Verified Buyers</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-sky-400">{verifiedCount}</span>
            <span className="text-xs text-slate-400 font-mono">verified</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Confirmed workshop purchases
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-[#131822] border border-[#232B3B] rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0B0E14] p-1 rounded-lg border border-[#1E2532]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'pending'
                  ? 'bg-amber-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded-full text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'approved'
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('rejected')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'rejected'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, city, comment..."
              className="w-full text-xs bg-[#0B0E14] border border-[#232B3B] text-white pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Product & Star Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E2532]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">Filter Product:</span>
          </div>

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="text-xs bg-[#0B0E14] border border-[#232B3B] text-white px-2.5 py-1.5 rounded-lg outline-none focus:border-amber-400 max-w-xs"
          >
            <option value="all">All Products ({products.length})</option>
            {products.map((p) => {
              const count = reviews.filter((r) => r.productId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({count} reviews)
                </option>
              );
            })}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
            <span className="font-bold">Rating:</span>
            <select
              value={ratingFilter.toString()}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs bg-[#0B0E14] border border-[#232B3B] text-white px-2 py-1.5 rounded-lg outline-none focus:border-amber-400"
            >
              <option value="all">All Stars</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-[#131822] border border-[#232B3B] rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Testimonials Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            No customer reviews matched your active filters. Click the button below to add your first customer testimonial.
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddModal(selectedProductId !== 'all' ? selectedProductId : undefined)}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg uppercase tracking-wide cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Manual Testimonial</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => {
            const product = products.find((p) => p.id === rev.productId);
            const isReplying = replyingReviewId === rev.id;

            return (
              <div
                key={rev.id}
                className={`p-4 rounded-xl border transition-all ${
                  rev.status === 'pending'
                    ? 'bg-[#181E2E] border-amber-500/50 shadow-md'
                    : rev.status === 'rejected'
                    ? 'bg-[#14161E] border-rose-900/40 opacity-70'
                    : 'bg-[#131822] border-[#232B3B] hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Left Column: Customer & Product Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Product Tag */}
                      <span className="px-2 py-0.5 bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{product ? product.name : `Product ID: ${rev.productId}`}</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          rev.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : rev.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        ● {rev.status}
                      </span>

                      {/* Verified Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleVerified(rev)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border flex items-center gap-1 transition-all cursor-pointer ${
                          rev.isVerifiedPurchase
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Click to toggle verified purchase status"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{rev.isVerifiedPurchase ? '✓ Verified Buyer' : 'Unverified'}</span>
                      </button>

                      {/* Date */}
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3" />
                        {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Customer Name, City and Rating */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {rev.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{rev.customerName}</span>
                          {rev.customerCity && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {rev.customerCity}
                            </span>
                          )}
                        </div>

                        {/* Star Rating Icons */}
                        <div className="flex items-center gap-1 mt-0.5">
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
                          <span className="text-xs font-bold text-amber-400 ml-1 font-mono">
                            {rev.rating}.0
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Title & Body */}
                    <div className="pt-1">
                      {rev.title && (
                        <h4 className="text-xs font-bold text-white mb-1">
                          "{rev.title}"
                        </h4>
                      )}
                      <p className="text-xs text-slate-300 leading-relaxed bg-[#0C1017] p-2.5 rounded-lg border border-[#1A2230]">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Store Admin Reply Box */}
                    {rev.adminReply && (
                      <div className="p-2.5 bg-amber-500/10 border-l-2 border-amber-400 rounded-r-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>🏪 {settings.storeName} Official Response:</span>
                          </span>
                          {rev.adminRepliedAt && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(rev.adminRepliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-xs italic">
                          "{rev.adminReply}"
                        </p>
                      </div>
                    )}

                    {/* Inline Reply Editor */}
                    {isReplying && (
                      <div className="p-3 bg-[#0B0E14] border border-amber-500/40 rounded-xl space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                          <span>Reply to {rev.customerName} as {settings.storeName}:</span>
                          <button
                            type="button"
                            onClick={() => setReplyingReviewId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="e.g. Shukriya Aslam bhai! Hum hamesha 100% original copper winding tools provide karte hain."
                          className="w-full text-xs bg-[#131822] border border-[#232B3B] text-white p-2.5 rounded-lg outline-none focus:border-amber-400"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingReviewId(null)}
                            className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReply(rev)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded"
                          >
                            Save & Publish Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex md:flex-col items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#232B3B]">
                    {rev.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(rev.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Approve Review"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Approve</span>
                      </button>
                    )}

                    {rev.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleReject(rev.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        title="Hide / Reject Review"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {rev.status === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(rev.id)}
                        className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-700/50 flex items-center gap-1 transition-all cursor-pointer"
                        title="Re-Approve Review"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-Approve</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setReplyingReviewId(rev.id);
                        setReplyText(rev.adminReply || '');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                      title="Add Official Store Reply"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>{rev.adminReply ? 'Edit Reply' : 'Reply'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rev)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                      title="Edit Review Details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                      title="Permanently Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#10141D] border border-[#2A3448] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232B3B]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingReview ? 'Edit Customer Testimonial' : 'Add Manual Customer Testimonial'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingReview ? 'Update review details, ratings, or verified status' : 'Publish genuine contractor & workshop feedback for social proof'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-sans">
              {/* Product Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Product:</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  required
                  className="w-full bg-[#0B0E14] border border-[#2A3448] text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400 font-sans"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Customer / Contractor Name:</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Haji Aslam Fabrication"
                    required
                    className="w-full bg-[#0B0E14] border border-[#2A3448] text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">City / Location:</label>
                  <input
                    type="text"
                    value={formCustomerCity}
                    onChange={(e) => setFormCustomerCity(e.target.value)}
                    placeholder="e.g. Gujranwala / Lahore"
                    className="w-full bg-[#0B0E14] border border-[#2A3448] text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Rating Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Star Rating (1 to 5):</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#0B0E14] p-2 rounded-lg border border-[#2A3448]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {formRating} Star{formRating > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Review Headline / Title (Optional):</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Heavy copper motor, smooth concrete drilling"
                  className="w-full bg-[#0B0E14] border border-[#2A3448] text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              {/* Detailed Review Comment */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Testimonial / Review Comment:</label>
                <textarea
                  rows={3}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Write authentic feedback regarding tool performance, durability, copper winding, or delivery speed..."
                  required
                  className="w-full bg-[#0B0E14] border border-[#2A3448] text-white p-3 rounded-lg outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Store Official Reply */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Store Reply (Optional):</label>
                <textarea
                  rows={2}
                  value={formAdminReply}
                  onChange={(e) => setFormAdminReply(e.target.value)}
                  placeholder={`e.g. Shukriya! ${settings.storeName} par hamesha original tools available hain.`}
                  className="w-full bg-[#0B0E14] border border-[#2A3448] text-white p-2.5 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              {/* Options: Verified Buyer & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#232B3B]">
                <label className="flex items-center gap-2 cursor-pointer bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3448]">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-white block">Verified Purchase Badge</span>
                    <span className="text-[10px] text-slate-400">Displays "✓ Verified Buyer" on the product page</span>
                  </div>
                </label>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Publication Status:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#0B0E14] border border-[#2A3448] text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400"
                  >
                    <option value="approved">Approved & Published (Live)</option>
                    <option value="pending">Pending Admin Review</option>
                    <option value="rejected">Rejected / Hidden</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232B3B]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wide rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingReview ? 'Save Changes' : 'Publish Testimonial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
