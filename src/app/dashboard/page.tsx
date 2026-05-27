'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronDown,
  Printer,
  Calendar,
  AlertCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';
import type { BillingRecord } from '@/lib/sheets-adapter';

export default function Dashboard() {
  // States
  const [tabs, setTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [activeTabOpen, setActiveTabOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [printDate, setPrintDate] = useState<string>('');

  // Set print date on mount (client-side only to prevent hydration mismatch)
  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const formatted = today.toLocaleDateString('id-ID', options);
    const timer = setTimeout(() => {
      setPrintDate(formatted);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch all sheet tabs on mount
  useEffect(() => {
    async function fetchTabs() {
      try {
        setLoading(true);
        const res = await fetch('/api/sheets/tabs');
        const data = await res.json();
        if (data.success && data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs);
          // Set default to first tab (normally the latest month)
          setSelectedTab(data.tabs[0]);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar tab:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTabs();
  }, []);

  // Fetch and normalize rows whenever selectedTab changes
  const fetchRows = async (tabName: string) => {
    if (!tabName) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/sheets/rows?sheet=${encodeURIComponent(tabName)}`);
      const data = await res.json();
      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error(`Gagal mengambil data baris untuk tab ${tabName}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async () => {
    if (!selectedRecord || !selectedTab) return;
    setIsUpdating(true);
    const targetIsPaid = !selectedRecord.isPaid;
    try {
      const res = await fetch('/api/sheets/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetName: selectedTab,
          rowNumber: selectedRecord.rowNumber,
          isPaid: targetIsPaid,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setToast({
          message: targetIsPaid
            ? 'Mantap bro, status pembayaran berhasil diperbarui jadi LUNAS! 🚀'
            : 'Mantap bro, status pembayaran berhasil diubah jadi PENDING! 🕒',
          type: 'success',
        });
        
        // Auto-update active drawer details representation immediately
        setSelectedRecord((prev) => (prev ? { ...prev, isPaid: targetIsPaid } : null));
        
        // Auto-refresh the dashboard records list instantly
        await fetchRows(selectedTab);
      } else {
        setToast({
          message: data.error || 'Waduh, gagal memperbarui status pembayaran. Coba lagi ya!',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setToast({
        message: 'Aduh, koneksi bermasalah. Gagal update status pembayaran!',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (selectedTab) {
      const timer = setTimeout(() => {
        fetchRows(selectedTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedTab]);

  // Calculations
  const totalAmount = records.reduce((acc, r) => acc + (r.amount || 0), 0);
  const paidRecords = records.filter((r) => r.isPaid);
  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalPaidAmount = paidRecords.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, r) => acc + (r.amount || 0), 0);
  const completionPercentage = records.length > 0 ? Math.round((paidRecords.length / records.length) * 100) : 0;

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'paid') {
      return matchesSearch && r.isPaid;
    }
    if (statusFilter === 'unpaid') {
      return matchesSearch && !r.isPaid;
    }
    return matchesSearch;
  });

  // Dynamic grouping by category for UI section styling
  const groupedRecords: Record<string, BillingRecord[]> = {};
  filteredRecords.forEach((r) => {
    const cat = r.category || 'LAIN-LAIN';
    if (!groupedRecords[cat]) {
      groupedRecords[cat] = [];
    }
    groupedRecords[cat].push(r);
  });

  // Helper to format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative print:p-0 print:m-0 print:max-w-none">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-xl border max-w-md w-[calc(100%-2rem)] ${
              toast.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200/50 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-200/50 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </span>
            ) : (
              <span className="p-1.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </span>
            )}
            <span className="font-bold text-slate-800 dark:text-slate-100 flex-1 leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY SCHOOL LETTERHEAD */}
      <div className="hidden print:block mb-8 border-b-4 border-double border-slate-900 pb-4">
        <div className="flex items-center gap-6">
          {/* Logo Placeholder */}
          <div className="w-20 h-20 bg-slate-100 border-2 border-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🏫</span>
          </div>
          
          {/* School Details */}
          <div className="flex-1 text-left">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              SMA NEGERI KAS SEKOLAH
            </h2>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Yayasan Pendidikan Pembangunan Bangsa • Terakreditasi A
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan, 12150
            </p>
            <p className="text-xs text-slate-500">
              Telp: (021) 7654-3210 • Email: info@sman-kassekolah.sch.id • Web: www.sman-kassekolah.sch.id
            </p>
          </div>
        </div>

        {/* Title details */}
        <div className="mt-6 text-center border-t border-slate-200 pt-4">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
            LAPORAN KEUANGAN & PEMBAYARAN TAGIHAN LISTRIK SEKOLAH
          </h3>
          <p className="text-xs font-medium text-slate-650 mt-1">
            Periode Laporan: <span className="font-extrabold text-slate-900">{selectedTab || 'Semua Periode'}</span> | Tanggal Cetak: <span className="font-extrabold text-slate-900">{printDate}</span>
          </p>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 rounded-lg">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Aplikasi Kas Sekolah
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Tagihan Listrik Sekolah ⚡
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau dan kelola pembayaran tagihan listrik & utilitas sekolah dengan mudah.
          </p>
        </div>

        {/* CONTROLS (TAB SELECTOR & SYNC) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Dynamic Tab Selector */}
          <div className="relative print:hidden">
            <button
              onClick={() => setActiveTabOpen(!activeTabOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{selectedTab || 'Pilih Bulan'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {activeTabOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveTabOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden py-1"
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setSelectedTab(tab);
                          setActiveTabOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition ${
                          selectedTab === tab
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Cetak Laporan Button */}
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 text-white rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={() => fetchRows(selectedTab)}
            disabled={loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg disabled:bg-indigo-400 transition flex items-center justify-center gap-2 text-sm font-semibold print:hidden"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* SUMMARY STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Tagihan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-500 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
              Bulan Ini
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Nilai Tagihan
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
            {loading ? '---' : formatIDR(totalAmount)}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Dari total <span className="font-bold text-slate-600 dark:text-slate-300">{records.length}</span> item tagihan
          </p>
        </motion.div>

        {/* Sudah Bayar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-500 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
              {paidRecords.length}/{records.length} Lunas
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dana Sudah Terbayar
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
            {loading ? '---' : formatIDR(totalPaidAmount)}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Status lunas tercatat aman di spreadsheet
          </p>
        </motion.div>

        {/* Belum Bayar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-orange-50 dark:bg-orange-950 text-orange-500 rounded-2xl">
              <Clock className="w-6 h-6" />
            </span>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2.5 py-1 rounded-full">
              {unpaidRecords.length} Pending
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tunggakan Belum Bayar
          </p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
            {loading ? '---' : formatIDR(totalUnpaidAmount)}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Harap segera selesaikan sebelum jatuh tempo
          </p>
        </motion.div>

        {/* Completion Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 rounded-2xl">
              <Zap className="w-6 h-6" />
            </span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {completionPercentage}%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Persentase Kelunasan
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-indigo-500 h-full rounded-full"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Progres penyelesaian tagihan sekolah
          </p>
        </motion.div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="glass-panel p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rincian tagihan atau kategori..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 text-slate-700 dark:text-slate-200 transition"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
          {(['all', 'paid', 'unpaid'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === filter
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {filter === 'all' && 'Semua'}
              {filter === 'paid' && 'Lunas'}
              {filter === 'unpaid' && 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 animate-pulse">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded w-full" />
                <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedRecords).length === 0 ? (
        /* EMPTY STATE */
        <div className="glass-panel p-12 text-center rounded-3xl flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
            Gak ada data tagihan nih
          </h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Coba ketik kata kunci lain atau pilih bulan/sheet yang berbeda di bagian kanan atas.
          </p>
        </div>
      ) : (
        /* BILLING LIST GROUPED BY CATEGORY */
        <div className="space-y-8">
          {Object.entries(groupedRecords).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {category}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                  {items.length} Tagihan
                </span>
              </div>

              {/* Responsive Layout: Table for Desktop, Custom Cards for Mobile */}
              <div className="hidden md:block print:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 text-left">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Row</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Deskripsi</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Jatuh Tempo</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Metode/Toko</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nominal Tagihan</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {items.map((record) => (
                      <tr
                        key={record.rowNumber}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <td className="px-6 py-4.5 text-xs font-mono text-slate-400">
                          #{record.rowNumber}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {record.description}
                            </span>
                            {record.printable && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 dark:text-blue-400 font-bold mt-1">
                                <Printer className="w-3 h-3" /> Cetak Bukti
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-sm text-slate-500 dark:text-slate-400">
                          {record.dueDate || '-'}
                        </td>
                        <td className="px-6 py-4.5 text-sm text-slate-500 dark:text-slate-400">
                          {record.store || '-'}
                        </td>
                        <td className="px-6 py-4.5 text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          {formatIDR(record.amount || 0)}
                        </td>
                        <td className="px-6 py-4.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              record.isPaid
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${record.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {record.isPaid ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right print:hidden" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Row Cards */}
              <div className="block md:hidden print:hidden divide-y divide-slate-100 dark:divide-slate-900">
                {items.map((record) => (
                  <div
                    key={record.rowNumber}
                    onClick={() => setSelectedRecord(record)}
                    className="p-5 active:bg-slate-50 dark:active:bg-slate-900 cursor-pointer flex flex-col gap-3.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-slate-400">Row #{record.rowNumber}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                          {record.description}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          record.isPaid
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {record.isPaid ? 'Lunas' : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-900/50">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">Jatuh Tempo</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{record.dueDate || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">Nominal</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatIDR(record.amount || 0)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      {record.printable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 dark:text-blue-400 font-bold">
                          <Printer className="w-3.5 h-3.5" /> Bukti Cetak
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-0.5">
                        Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* SIGNATURE PLACEHOLDERS - PRINT ONLY */}
      <div className="hidden print:block mt-16 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-12 text-center text-sm print:grid print:grid-cols-2">
          <div>
            <p className="text-slate-600 font-semibold mb-20">Bendahara Sekolah,</p>
            <p className="font-bold text-slate-900">___________________________</p>
            <p className="text-xs text-slate-500 font-mono mt-1">NIP. 19871102 201012 2 003</p>
          </div>
          <div>
            <p className="text-slate-600 font-semibold mb-20">Kepala Sekolah,</p>
            <p className="font-bold text-slate-900">___________________________</p>
            <p className="text-xs text-slate-500 font-mono mt-1">NIP. 19740518 199903 1 002</p>
          </div>
        </div>
      </div>

      {/* AESTHETIC DETAIL MODAL (SIDEBAR SHEET IN DESKTOP, BOTTOM DRAWER IN MOBILE) */}
      <AnimatePresence>
        {selectedRecord && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-black z-40 print:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 shadow-2xl z-50 overflow-y-auto flex flex-col print:hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                    Rincian Google Sheets Row #{selectedRecord.rowNumber}
                  </span>
                  <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 mt-1">
                    Detail Catatan Tagihan
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition"
                >
                  Tutup
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 flex-1 space-y-6">
                {/* Nominal Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30 text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Jumlah Tagihan
                  </span>
                  <h4 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatIDR(selectedRecord.amount || 0)}
                  </h4>
                  <div className="mt-3 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        selectedRecord.isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {selectedRecord.isPaid ? 'Sudah Lunas Terbayar' : 'Menunggu Pembayaran'}
                    </span>
                  </div>
                </div>

                {/* Core Properties */}
                <div className="space-y-4">
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Informasi Utama</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Kategori / Kelompok</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                        {selectedRecord.category || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Jatuh Tempo</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" /> {selectedRecord.dueDate || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Metode / Lokasi</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                        {selectedRecord.store || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Bisa Dicetak?</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                        {selectedRecord.printable ? 'Ya (Bisa Cetak)' : 'Tidak'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Rincian Deskripsi</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                      {selectedRecord.description || '-'}
                    </span>
                  </div>
                </div>

                {/* Raw Google Sheets Columns */}
                <div className="space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kolom Asli Spreadsheet</h5>
                  <div className="border border-slate-100 dark:border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-900">
                    {Object.entries(selectedRecord.raw).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center p-3 text-xs">
                        <span className="font-semibold text-slate-400">{key}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-900 flex gap-3">
                <button
                  onClick={handleTogglePayment}
                  disabled={isUpdating}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition text-center text-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed ${
                    selectedRecord.isPaid
                      ? 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-850'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-850'
                  }`}
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : selectedRecord.isPaid ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>
                    {isUpdating
                      ? 'Memproses...'
                      : selectedRecord.isPaid
                      ? 'Tandai Belum Bayar'
                      : 'Tandai Sudah Lunas'}
                  </span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition flex items-center justify-center"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
