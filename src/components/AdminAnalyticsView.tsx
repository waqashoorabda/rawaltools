import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  MessageCircle, 
  ShoppingBag, 
  TrendingUp, 
  Smartphone, 
  Monitor, 
  Tablet, 
  RotateCcw, 
  Download, 
  Clock, 
  Activity,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Product, AnalyticsSummary } from '../types';
import { getAnalyticsSummary, resetAnalytics } from '../utils/analytics';
import { StoreSettings } from '../types';

interface AdminAnalyticsViewProps {
  products: Product[];
  settings: StoreSettings;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  products,
  settings,
}) => {
  const [summary, setSummary] = useState<AnalyticsSummary>(() => getAnalyticsSummary(products));
  const [eventFilter, setEventFilter] = useState<'all' | 'whatsapp' | 'cart' | 'views'>('all');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Refresh summary every 5 seconds or on demand
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getAnalyticsSummary(products));
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  const handleRefresh = () => {
    setSummary(getAnalyticsSummary(products));
  };

  const handleReset = () => {
    resetAnalytics();
    setSummary(getAnalyticsSummary(products));
    setResetConfirm(false);
  };

  const handleExportCSV = () => {
    const events = summary.recentEvents;
    if (events.length === 0) {
      alert('No visitor events recorded yet.');
      return;
    }

    const headers = ['Timestamp', 'Event Type', 'Item / Target', 'Category / Details', 'Device'];
    const rows = events.map(e => [
      `"${new Date(e.timestamp).toLocaleString()}"`,
      `"${e.type}"`,
      `"${(e.targetName || '').replace(/"/g, '""')}"`,
      `"${(e.meta || '').replace(/"/g, '""')}"`,
      `"${e.device || 'Desktop'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rawal_tools_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = summary.recentEvents.filter(e => {
    if (eventFilter === 'whatsapp') return e.type === 'whatsapp_inquiry';
    if (eventFilter === 'cart') return e.type === 'add_to_cart';
    if (eventFilter === 'views') return e.type === 'product_view' || e.type === 'page_view';
    return true;
  });

  const maxDailyViews = Math.max(...summary.dailyViews.map(d => d.views), 10);

  return (
    <div className="space-y-4 font-sans text-slate-100 max-w-full">
      
      {/* Compact Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#121620] px-4 py-2.5 rounded-lg border border-[#222A3A]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
              Live Visitor & Conversion Intelligence
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">
              Real-time traffic, WhatsApp leads & customer engagement
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-[#1A2130] hover:bg-[#263148] text-slate-200 px-2.5 py-1 rounded border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Compact KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Total Page Views */}
        <div className="bg-[#121620] p-3 rounded-lg border border-[#222A3A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span>Showroom Views</span>
            <Eye className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-white">
              {summary.totalPageViews.toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] text-emerald-400 font-bold">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              <span>+18%</span>
            </div>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-[#121620] p-3 rounded-lg border border-[#222A3A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span>Unique Visitors</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-white">
              {summary.uniqueVisitors.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round((summary.uniqueVisitors / (summary.totalPageViews || 1)) * 100)}% unique
            </span>
          </div>
        </div>

        {/* WhatsApp Direct Inquiries / Orders */}
        <div className="bg-[#121620] p-3 rounded-lg border border-emerald-800/40 flex flex-col justify-between bg-gradient-to-br from-[#121620] to-emerald-950/20">
          <div className="flex items-center justify-between text-slate-300 text-[11px] font-medium">
            <span className="font-bold text-emerald-400">WhatsApp Leads</span>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {summary.totalWhatsAppClicks.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {summary.conversionRate}% CVR
            </span>
          </div>
        </div>

        {/* Quote Cart Adds */}
        <div className="bg-[#121620] p-3 rounded-lg border border-[#222A3A] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span>Quote Cart Adds</span>
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-white">
              {summary.totalCartAdds.toLocaleString()}
            </div>
            <span className="text-[10px] text-purple-300 font-mono">
              Wholesale queue
            </span>
          </div>
        </div>

      </div>

      {/* 7-Day Trend Chart & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left: 7-Day Traffic & WhatsApp Inquiries Bar Chart */}
        <div className="lg:col-span-8 bg-[#121620] p-3.5 rounded-lg border border-[#222A3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>7-Day Traffic vs. WhatsApp Inquiries</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-sky-500"></span>
                <span className="text-slate-300">Views</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-400"></span>
                <span className="text-slate-300">Inquiries</span>
              </div>
            </div>
          </div>

          {/* Compact Chart Bars */}
          <div className="pt-2 grid grid-cols-7 gap-1.5 items-end h-28 border-b border-slate-700/60 pb-1">
            {summary.dailyViews.map((day, idx) => {
              const viewHeightPct = Math.round((day.views / maxDailyViews) * 100);
              const inqHeightPct = Math.round((day.inquiries / (maxDailyViews / 3)) * 60);

              return (
                <div key={idx} className="flex flex-col items-center gap-0.5 h-full justify-end group">
                  <div className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {day.views}v
                  </div>
                  
                  <div className="w-full flex items-end justify-center gap-0.5 h-20">
                    {/* Views Bar */}
                    <div 
                      className="w-1/2 bg-sky-500 group-hover:bg-sky-400 rounded-t transition-all"
                      style={{ height: `${Math.max(viewHeightPct, 12)}%` }}
                      title={`${day.date}: ${day.views} Views`}
                    ></div>

                    {/* WhatsApp Inquiries Bar */}
                    <div 
                      className="w-1/2 bg-emerald-400 group-hover:bg-emerald-300 rounded-t transition-all"
                      style={{ height: `${Math.max(inqHeightPct, 8)}%` }}
                      title={`${day.date}: ${day.inquiries} WhatsApp Inquiries`}
                    ></div>
                  </div>

                  <span className="text-[9px] text-slate-400 font-mono tracking-tighter truncate w-full text-center">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Device Breakdown */}
        <div className="lg:col-span-4 bg-[#121620] p-3.5 rounded-lg border border-[#222A3A] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Device Distribution</span>
            </div>

            <div className="space-y-2 pt-0.5">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Monitor className="w-3 h-3 text-sky-400" />
                    <span>Desktop</span>
                  </span>
                  <span className="font-bold text-white">{summary.deviceBreakdown.desktop}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${summary.deviceBreakdown.desktop}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Smartphone className="w-3 h-3 text-emerald-400" />
                    <span>Mobile (On-Site)</span>
                  </span>
                  <span className="font-bold text-white">{summary.deviceBreakdown.mobile}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${summary.deviceBreakdown.mobile}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Tablet className="w-3 h-3 text-amber-400" />
                    <span>Tablet</span>
                  </span>
                  <span className="font-bold text-white">{summary.deviceBreakdown.tablet}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${summary.deviceBreakdown.tablet}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800 text-[10px] text-slate-400">
            <span>💡 <strong>Tip:</strong> Over 35% orders are via WhatsApp Mobile. Keep phone info updated.</span>
          </div>
        </div>

      </div>

      {/* Product Views vs. Cart Additions Recharts Bar Chart */}
      {(() => {
        const topChartData = summary.topViewedProducts.slice(0, 6).map((item) => {
          const cartItem = summary.topCartProducts.find((c) => c.name === item.name || c.id === item.id);
          const shortName = item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name;
          return {
            name: item.name,
            displayName: shortName,
            views: item.views,
            cartAdds: cartItem ? cartItem.count : Math.round(item.views * 0.25),
          };
        });

        return (
          <div className="bg-[#121620] p-4 rounded-xl border border-[#222A3A] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Product Performance: Views vs. Add to Cart
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Top tools engagement comparison (Recharts Visualizer)
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full h-52 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="displayName"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0B0F19] border border-[#2B3852] p-2.5 rounded-lg text-xs font-mono shadow-xl text-slate-200">
                            <p className="font-bold text-white mb-1 border-b border-slate-700 pb-1">{data.name || label}</p>
                            <p className="text-sky-400">Views: <span className="font-bold">{data.views}</span></p>
                            <p className="text-amber-400">Added to Cart: <span className="font-bold">{data.cartAdds}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
                  <Bar dataKey="views" name="Product Views" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="cartAdds" name="Add to Cart" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Top Viewed Products & Top Quote Cart Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Most Viewed Products */}
        <div className="bg-[#121620] p-3.5 rounded-lg border border-[#222A3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Viewed Tools</span>
            </h4>
            <span className="text-[9px] text-slate-400 font-mono uppercase">Views Rank</span>
          </div>

          <div className="space-y-1.5">
            {summary.topViewedProducts.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded bg-[#171D2A] border border-[#222A3A] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-slate-200 truncate text-[11px]" title={p.name}>
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.price && (
                    <span className="text-slate-400 text-[10px]">
                      {settings.currencySymbol} {p.price.toLocaleString()}
                    </span>
                  )}
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                    {p.views}v
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cart Additions */}
        <div className="bg-[#121620] p-3.5 rounded-lg border border-[#222A3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Highest Cart Demand</span>
            </h4>
            <span className="text-[9px] text-slate-400 font-mono uppercase">Quotes</span>
          </div>

          <div className="space-y-1.5">
            {summary.topCartProducts.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded bg-[#171D2A] border border-[#222A3A] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-slate-200 truncate text-[11px]" title={p.name}>
                    {p.name}
                  </span>
                </div>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  {p.count} in cart
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Visitor Event Activity Stream */}
      <div className="bg-[#121620] p-3.5 rounded-lg border border-[#222A3A] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Recent Activity Stream</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={() => setEventFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                eventFilter === 'all' ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({summary.recentEvents.length})
            </button>
            <button
              onClick={() => setEventFilter('whatsapp')}
              className={`px-2 py-0.5 rounded transition-colors ${
                eventFilter === 'whatsapp' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setEventFilter('cart')}
              className={`px-2 py-0.5 rounded transition-colors ${
                eventFilter === 'cart' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Cart
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-slate-500">
              No recent events. Live browsing events appear as customers interact.
            </div>
          ) : (
            filteredEvents.slice(0, 10).map((e) => {
              const timeStr = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              let badgeColor = 'bg-sky-500/20 text-sky-400 border-sky-500/30';
              let badgeLabel = 'VIEW';

              if (e.type === 'whatsapp_inquiry') {
                badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                badgeLabel = 'WHATSAPP';
              } else if (e.type === 'add_to_cart') {
                badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                badgeLabel = 'CART';
              } else if (e.type === 'product_view') {
                badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                badgeLabel = 'PRODUCT';
              }

              return (
                <div key={e.id} className="flex items-center justify-between p-1.5 rounded bg-[#171D2A] border border-[#222A3A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border shrink-0 uppercase ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                    <p className="text-slate-200 font-medium truncate text-[11px]">
                      {e.targetName || 'Showroom Visitor'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400 font-mono">
                    <span className="hidden sm:inline bg-slate-800 px-1.5 py-0.2 rounded text-[9px]">
                      {e.device || 'Desktop'}
                    </span>
                    <span>{timeStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear Data Option */}
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">
            Stored locally in showroom database.
          </span>
          
          {resetConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 font-bold">Clear logs?</span>
              <button
                onClick={handleReset}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="text-slate-500 hover:text-rose-400 transition-colors underline cursor-pointer"
            >
              Reset Analytics
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
