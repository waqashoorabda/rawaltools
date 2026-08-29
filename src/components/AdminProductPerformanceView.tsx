import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  ShoppingBag,
  Percent,
  Coins,
  Download,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Flame,
  Zap,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Product, StoreSettings, ProductPerformanceItem, ProductPerformanceStatus } from '../types';
import {
  getProductPerformanceList,
  seedSimulatedProductEvents,
  resetAnalytics,
  exportProductPerformanceCSV,
  trackProductView,
  trackAddToCart,
} from '../utils/analytics';
import { CATEGORIES } from '../data/defaultProducts';

interface AdminProductPerformanceViewProps {
  products: Product[];
  settings: StoreSettings;
  onEditProduct?: (product: Product) => void;
  onViewProductDetails?: (product: Product) => void;
}

type SortField = 'views' | 'cartAdds' | 'conversionRate' | 'potentialRevenue' | 'price' | 'name';
type SortOrder = 'desc' | 'asc';
type ChartViewMode = 'comparison' | 'views_only' | 'cart_only' | 'conversion_rate' | 'category_breakdown';
type ChartOrientation = 'vertical' | 'horizontal';

export const AdminProductPerformanceView: React.FC<AdminProductPerformanceViewProps> = ({
  products,
  settings,
  onEditProduct,
  onViewProductDetails,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('comparison');
  const [chartOrientation, setChartOrientation] = useState<ChartOrientation>('vertical');
  const [chartLimit, setChartLimit] = useState<number>(10);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Show temporary toast notification
  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Compute performance list based on filters
  const performanceItems = useMemo(() => {
    return getProductPerformanceList(products, timeFilter, categoryFilter, searchQuery);
  }, [products, timeFilter, categoryFilter, searchQuery, refreshTrigger]);

  // Sorted items for the detailed data table
  const sortedItems = useMemo(() => {
    return [...performanceItems].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = Number(valA);
      const numB = Number(valB);
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [performanceItems, sortField, sortOrder]);

  // Aggregate Key Performance Indicators (KPIs)
  const kpis = useMemo(() => {
    const totalViews = performanceItems.reduce((sum, item) => sum + item.views, 0);
    const totalCartAdds = performanceItems.reduce((sum, item) => sum + item.cartAdds, 0);
    const totalPotentialRevenue = performanceItems.reduce((sum, item) => sum + item.potentialRevenue, 0);
    const avgConversionRate = totalViews > 0 ? parseFloat(((totalCartAdds / totalViews) * 100).toFixed(1)) : 0;

    const mostViewed = [...performanceItems].sort((a, b) => b.views - a.views)[0];
    const mostAdded = [...performanceItems].sort((a, b) => b.cartAdds - a.cartAdds)[0];
    const highestConverting = [...performanceItems]
      .filter((p) => p.views >= 5)
      .sort((a, b) => b.conversionRate - a.conversionRate)[0];

    return {
      totalViews,
      totalCartAdds,
      totalPotentialRevenue,
      avgConversionRate,
      mostViewed,
      mostAdded,
      highestConverting,
      hotProductsCount: performanceItems.filter((p) => p.status === 'hot_seller' || p.status === 'high_intent').length,
    };
  }, [performanceItems]);

  // Prepare chart dataset based on current settings
  const chartData = useMemo(() => {
    if (chartViewMode === 'category_breakdown') {
      // Group by Category
      const catMap: Record<string, { category: string; views: number; cartAdds: number; count: number }> = {};
      performanceItems.forEach((p) => {
        if (!catMap[p.category]) {
          catMap[p.category] = { category: p.category, views: 0, cartAdds: 0, count: 0 };
        }
        catMap[p.category].views += p.views;
        catMap[p.category].cartAdds += p.cartAdds;
        catMap[p.category].count += 1;
      });

      return Object.values(catMap)
        .map((c) => ({
          name: c.category,
          displayName: c.category.length > 18 ? c.category.slice(0, 16) + '…' : c.category,
          views: c.views,
          cartAdds: c.cartAdds,
          conversionRate: c.views > 0 ? parseFloat(((c.cartAdds / c.views) * 100).toFixed(1)) : 0,
          productCount: c.count,
        }))
        .sort((a, b) => b.views - a.views);
    }

    // Sort items according to the chart mode
    let sortedForChart = [...performanceItems];
    if (chartViewMode === 'views_only' || chartViewMode === 'comparison') {
      sortedForChart.sort((a, b) => b.views - a.views);
    } else if (chartViewMode === 'cart_only') {
      sortedForChart.sort((a, b) => b.cartAdds - a.cartAdds);
    } else if (chartViewMode === 'conversion_rate') {
      sortedForChart.sort((a, b) => b.conversionRate - a.conversionRate);
    }

    const limited = chartLimit > 0 ? sortedForChart.slice(0, chartLimit) : sortedForChart;

    return limited.map((item) => {
      // Truncate long names for clear chart readability
      const shortName = item.name.length > 20 ? item.name.substring(0, 18) + '…' : item.name;
      return {
        id: item.id,
        name: item.name,
        displayName: shortName,
        sku: item.sku,
        views: item.views,
        cartAdds: item.cartAdds,
        conversionRate: item.conversionRate,
        price: item.price,
        category: item.category,
        potentialRevenue: item.potentialRevenue,
        status: item.status,
      };
    });
  }, [performanceItems, chartViewMode, chartLimit]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSeedTraffic = () => {
    seedSimulatedProductEvents(products);
    setRefreshTrigger((prev) => prev + 1);
    showToast('Generated realistic simulated views & add-to-cart events across products!');
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear all product view and cart analytics events?')) {
      resetAnalytics();
      setRefreshTrigger((prev) => prev + 1);
      showToast('Analytics logs reset.', 'info');
    }
  };

  const handleExport = () => {
    exportProductPerformanceCSV(sortedItems);
    showToast('Product Performance report exported to CSV!');
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B0F19] border border-[#2B3852] p-3 rounded-xl shadow-2xl font-sans text-xs text-slate-200 min-w-[220px]">
          <div className="font-bold text-white mb-1 border-b border-[#1E293B] pb-1.5 flex items-center justify-between gap-2">
            <span className="truncate max-w-[170px]" title={data.name || label}>
              {data.name || label}
            </span>
            {data.sku && <span className="text-[10px] font-mono text-amber-400 shrink-0">{data.sku}</span>}
          </div>

          <div className="space-y-1.5 pt-1">
            {data.category && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Category:</span>
                <span className="text-slate-300 font-medium">{data.category}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sky-400 font-mono">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> Views:
              </span>
              <span className="font-bold text-sm">{data.views?.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-amber-400 font-mono">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> Add to Cart:
              </span>
              <span className="font-bold text-sm">{data.cartAdds?.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-400 font-mono pt-1 border-t border-[#1E293B]">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" /> Conversion Rate:
              </span>
              <span className="font-bold">{data.conversionRate}%</span>
            </div>

            {data.price && (
              <div className="flex items-center justify-between text-slate-300 font-mono text-[10px] pt-0.5">
                <span>Unit Price:</span>
                <span>PKR {data.price.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: ProductPerformanceStatus) => {
    switch (status) {
      case 'hot_seller':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>HOT SELLER</span>
          </span>
        );
      case 'high_intent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>HIGH CONVERSION</span>
          </span>
        );
      case 'high_interest':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Eye className="w-3 h-3 text-sky-400" />
            <span>TRENDING VIEWS</span>
          </span>
        );
      case 'low_activity':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span>LOW ENGAGEMENT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1A2234] text-slate-300 border border-[#2B3852]">
            <span>STABLE</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 text-slate-100 font-sans max-w-full pb-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-sans shadow-lg transition-all animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-blue-950/80 border-blue-500/50 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Fast Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-[#0F1420] p-4 rounded-xl border border-[#202A3C] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Product Performance Dashboard
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400">
                (پراڈکٹ ویوز و کارٹ تجزیہ)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Track how many times each tool has been viewed, added to cart, and customer conversion rates.
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          <button
            type="button"
            onClick={handleSeedTraffic}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
            title="Seed simulated test views and cart additions across products"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Seed Test Traffic</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRefreshTrigger((prev) => prev + 1);
              showToast('Data refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171E2E] hover:bg-[#222C42] text-slate-200 border border-[#2B3852] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
            title="Export CSV performance sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#171E2E] hover:bg-rose-950/40 rounded-lg border border-[#2B3852] transition-colors cursor-pointer"
            title="Reset analytics events"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Product Views */}
        <div className="bg-[#0F1420] p-4 rounded-xl border border-[#202A3C] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Product Views</span>
            <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {kpis.totalViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-sky-300 font-sans mt-1 flex items-center gap-1">
              <span>کل پراڈکٹ ملاحظات</span>
            </div>
          </div>
        </div>

        {/* Total Add to Cart Actions */}
        <div className="bg-[#0F1420] p-4 rounded-xl border border-[#202A3C] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Add-to-Cart</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {kpis.totalCartAdds.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-300/80 font-sans mt-1 flex items-center gap-1">
              <span>کارٹ میں شامل کی گئی اشیاء</span>
            </div>
          </div>
        </div>

        {/* Average Cart Conversion Rate */}
        <div className="bg-[#0F1420] p-4 rounded-xl border border-[#202A3C] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Add-to-Cart Rate</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {kpis.avgConversionRate}%
            </div>
            <div className="text-[11px] text-emerald-300/80 font-sans mt-1 flex items-center gap-1">
              <span>ویو تا کارٹ تناسب (Conversion)</span>
            </div>
          </div>
        </div>

        {/* Potential Cart Value */}
        <div className="bg-[#0F1420] p-4 rounded-xl border border-[#202A3C] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cart Pipeline Value</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-white font-mono truncate">
              PKR {kpis.totalPotentialRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-300/80 font-sans mt-1 flex items-center gap-1">
              <span>ممکنہ آرڈر ویلیو</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Highlights Pill Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {kpis.mostViewed && (
          <div className="p-3 bg-[#131824] border border-[#243048] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Most Viewed Product
              </div>
              <div className="text-xs font-bold text-white truncate" title={kpis.mostViewed.name}>
                {kpis.mostViewed.name}
              </div>
              <div className="text-[11px] text-sky-400 font-mono font-bold">
                {kpis.mostViewed.views} views ({kpis.mostViewed.sku})
              </div>
            </div>
          </div>
        )}

        {kpis.mostAdded && (
          <div className="p-3 bg-[#131824] border border-[#243048] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Most Added To Cart
              </div>
              <div className="text-xs font-bold text-white truncate" title={kpis.mostAdded.name}>
                {kpis.mostAdded.name}
              </div>
              <div className="text-[11px] text-amber-400 font-mono font-bold">
                {kpis.mostAdded.cartAdds} cart additions
              </div>
            </div>
          </div>
        )}

        {kpis.highestConverting && (
          <div className="p-3 bg-[#131824] border border-[#243048] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Top Converting Tool
              </div>
              <div className="text-xs font-bold text-white truncate" title={kpis.highestConverting.name}>
                {kpis.highestConverting.name}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold">
                {kpis.highestConverting.conversionRate}% conversion rate
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          RECHARTS VISUALIZATION CONTAINER
          ========================================================================= */}
      <div className="bg-[#0F1420] p-4 sm:p-6 rounded-xl border border-[#202A3C] shadow-md space-y-4">
        {/* Chart Header & Custom Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                Product Engagement & Conversion Bar Chart
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Interactive comparison of product views vs shopping cart additions
              </p>
            </div>
          </div>

          {/* Chart View Switches */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Mode Selector */}
            <div className="flex items-center bg-[#151C2C] border border-[#26354D] rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setChartViewMode('comparison')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartViewMode === 'comparison'
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Compare Views vs Add-to-Cart"
              >
                Views vs Cart
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('views_only')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartViewMode === 'views_only'
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Top Views only"
              >
                Views Only
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('cart_only')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartViewMode === 'cart_only'
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Top Cart Additions only"
              >
                Cart Only
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('category_breakdown')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartViewMode === 'category_breakdown'
                    ? 'bg-emerald-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Category-wise Performance"
              >
                Categories
              </button>
            </div>

            {/* Display Limit Dropdown */}
            {chartViewMode !== 'category_breakdown' && (
              <select
                value={chartLimit}
                onChange={(e) => setChartLimit(Number(e.target.value))}
                className="bg-[#151C2C] text-slate-200 border border-[#26354D] rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold cursor-pointer focus:outline-none focus:border-amber-400"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={25}>Top 25</option>
                <option value={0}>All Products</option>
              </select>
            )}

            {/* Orientation Toggle */}
            <button
              type="button"
              onClick={() => setChartOrientation(chartOrientation === 'vertical' ? 'horizontal' : 'vertical')}
              className="p-1.5 bg-[#151C2C] hover:bg-[#202C44] text-slate-300 hover:text-amber-400 border border-[#26354D] rounded-lg text-xs font-mono transition-colors cursor-pointer"
              title={chartOrientation === 'vertical' ? 'Switch to Horizontal Bars' : 'Switch to Vertical Columns'}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Recharts Bar Chart Area */}
        <div className="w-full h-[320px] sm:h-[380px] pt-2">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-mono space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400/60" />
              <span>No product data matches your current search or category filter.</span>
            </div>
          ) : chartOrientation === 'vertical' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="displayName"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={65}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  iconType="circle"
                />

                {(chartViewMode === 'comparison' || chartViewMode === 'views_only' || chartViewMode === 'category_breakdown') && (
                  <Bar
                    dataKey="views"
                    name="Product Views (ملاحظات)"
                    fill="#38BDF8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                )}

                {(chartViewMode === 'comparison' || chartViewMode === 'cart_only' || chartViewMode === 'category_breakdown') && (
                  <Bar
                    dataKey="cartAdds"
                    name="Add to Cart (کارٹ اندراج)"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} iconType="circle" />

                {(chartViewMode === 'comparison' || chartViewMode === 'views_only' || chartViewMode === 'category_breakdown') && (
                  <Bar
                    dataKey="views"
                    name="Product Views"
                    fill="#38BDF8"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={25}
                  />
                )}

                {(chartViewMode === 'comparison' || chartViewMode === 'cart_only' || chartViewMode === 'category_breakdown') && (
                  <Bar
                    dataKey="cartAdds"
                    name="Add to Cart"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={25}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* =========================================================================
          DETAILED TABULAR BREAKDOWN & ADVANCED FILTERS
          ========================================================================= */}
      <div className="bg-[#0F1420] rounded-xl border border-[#202A3C] shadow-md overflow-hidden space-y-4 p-4 sm:p-5">
        {/* Table Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product title, SKU, brand, or category..."
              className="w-full bg-[#141A26] border border-[#26354D] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#141A26] border border-[#26354D] rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-sans focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#141A26]">All Categories ({products.length})</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#141A26]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Window Selector */}
            <div className="flex items-center bg-[#141A26] border border-[#26354D] rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeFilter === 'all'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('30days')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeFilter === '30days'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('7days')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeFilter === '7days'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('today')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeFilter === 'today'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
          <table className="w-full text-left text-xs font-sans text-slate-300">
            <thead className="bg-[#0C1018] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Product Details</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('views')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5 text-sky-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Views</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cartAdds')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5 text-amber-400">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>In Cart</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('conversionRate')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center w-36"
                >
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Conv. Rate</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('potentialRevenue')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right hidden md:table-cell"
                >
                  <div className="flex items-center justify-end gap-1.5 text-purple-300">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Cart Value</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1A2234]">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, idx) => {
                  const originalProduct = products.find((p) => p.id === item.id);
                  const isTopRanked = idx < 3 && sortField === 'views';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#141B28] transition-colors group"
                    >
                      {/* Rank Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                        {isTopRanked ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 inline-flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                        ) : (
                          idx + 1
                        )}
                      </td>

                      {/* Product Thumbnail, Title & Metadata */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-[#090C12] border border-[#222E42] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#182030] border border-[#222E42] flex items-center justify-center text-slate-500 text-xs shrink-0 font-mono">
                              TOOL
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors line-clamp-1">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="text-amber-400/90">{item.sku}</span>
                              <span>•</span>
                              <span className="truncate">{item.category}</span>
                              {item.isFeatured && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                  FEATURED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {item.price ? `PKR ${item.price.toLocaleString()}` : <span className="text-slate-500">Quote</span>}
                      </td>

                      {/* Views Count */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-sky-400 text-sm">
                        {item.views.toLocaleString()}
                      </td>

                      {/* Add to Cart Count */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                        {item.cartAdds.toLocaleString()}
                      </td>

                      {/* Conversion Rate with Progress Indicator */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-between w-full text-[11px] font-mono font-bold text-emerald-400">
                            <span>{item.conversionRate}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#172030] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              style={{ width: `${Math.min(item.conversionRate * 2.5, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cart Value (Potential Revenue) */}
                      <td className="py-3 px-4 text-right font-mono text-purple-300 hidden md:table-cell">
                        {item.potentialRevenue > 0 ? (
                          `PKR ${item.potentialRevenue.toLocaleString()}`
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Classification Status */}
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {originalProduct && onEditProduct && (
                            <button
                              type="button"
                              onClick={() => onEditProduct(originalProduct)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#1B2438] rounded-lg transition-colors cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {originalProduct && onViewProductDetails && (
                            <button
                              type="button"
                              onClick={() => onViewProductDetails(originalProduct)}
                              className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-[#1B2438] rounded-lg transition-colors cursor-pointer"
                              title="View product modal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Insights & Business Recommendations */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#121826] to-[#151D2E] rounded-xl border border-[#26354E] space-y-2.5">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Conversion Intelligence & Actionable Merchandising Tips</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-[#0B0F18] border border-[#1F293D] rounded-lg space-y-1">
            <strong className="text-amber-300 font-bold block">🔥 Promote Hot Sellers:</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Items with high cart conversion ({kpis.highestConverting?.name || 'Top tools'}) should be featured on the homepage hero banner to maximize wholesale orders.
            </p>
          </div>
          <div className="p-3 bg-[#0B0F18] border border-[#1F293D] rounded-lg space-y-1">
            <strong className="text-sky-300 font-bold block">⚡ Optimize High-View Tools:</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Products with massive views but lower cart additions may benefit from technical specifications, video demos, or bundle discount tags.
            </p>
          </div>
          <div className="p-3 bg-[#0B0F18] border border-[#1F293D] rounded-lg space-y-1">
            <strong className="text-emerald-300 font-bold block">📱 WhatsApp Inquiries:</strong>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Each add-to-cart action prepares the client for direct 1-click WhatsApp order confirmation with SKU references and custom sizing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
