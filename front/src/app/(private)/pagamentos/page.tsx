"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaSearch,
  FaCreditCard,
  FaMoneyBillWave,
  FaQrcode,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaUndoAlt,
  FaChartBar,
  FaFilter,
  FaDollarSign,
  FaCalendarAlt,
  FaUserTie,
  FaCopy,
} from "react-icons/fa";
import Swal from "sweetalert2";

interface Payment {
  idPayment?: number;
  id?: number;
  appointmentId?: number;
  clientId?: number;
  clientName?: string;
  amount?: number;
  finalAmount?: number;
  discountAmount?: number;
  paymentMethod?: string;
  method?: string;
  status?: string;
  transactionId?: string;
  couponCode?: string;
  couponDiscount?: number;
  loyaltyDiscount?: number;
  barberId?: number;
  barberName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  installments?: number;
  notes?: string;
  paymentDate?: string;
  createdAt?: string;
  cardLastDigits?: string;
  cardBrand?: string;
}

interface Barber { idBarber: number; name?: string; }
interface Client { idClient: number; name?: string; }
interface AppointmentOption {
  id: number;
  clientName?: string;
  clientId?: number;
  totalPrice?: number;
  status?: string;
  startTime?: string;
  barber?: { idBarber?: number; name?: string };
}

const initialForm = {
  appointmentId: "",
  clientId: "",
  amount: "",
  paymentMethod: "",
  couponCode: "",
  loyaltyPointsUsed: 0,
  barberId: "",
  commissionRate: "",
  installments: 1,
  notes: "",
  cardLastDigits: "",
  cardBrand: "",
};

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  // Extended state
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "stats">("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterBarber, setFilterBarber] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [revenueStats, setRevenueStats] = useState<any>({});
  const [revenueByMethod, setRevenueByMethod] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [pixModal, setPixModal] = useState<{ code?: string; qrcode?: string } | null>(null);
  const [barberCommissions, setBarberCommissions] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);

  useEffect(() => { loadPayments(); loadBarbers(); loadClients(); loadAppointmentOptions(); loadPendingCount(); }, []);

  async function refreshCurrentList() {
    if (activeTab === "pending") await loadPendingPayments();
    else await loadPayments();
    await loadPendingCount();
  }

  async function loadPayments() {
    setLoading(true);
    try {
      const response = await generica({ metodo: "GET", uri: "/payment", params: { page: 0, size: 100 } });
      if (!response || response.status >= 400) {
        toast.error(response?.data?.message || "Nao foi possivel carregar pagamentos");
        setPayments([]);
        return;
      }
      const data = response?.data?.content || response?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar pagamentos"); }
    finally { setLoading(false); }
  }

  async function loadBarbers() {
    try {
      const res = await generica({ metodo: "GET", uri: "/barber", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setBarbers(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function loadClients() {
    try {
      const res = await generica({ metodo: "GET", uri: "/client", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function loadAppointmentOptions() {
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments", params: { page: 0, size: 200 } });
      const data = res?.data?.content || res?.data || [];
      const list = Array.isArray(data) ? data : [];
      const valid = list.filter((a: AppointmentOption) => !["REJECTED", "CANCELLED"].includes((a.status || "").toUpperCase()));
      setAppointments(valid);
    } catch { /* silencioso */ }
  }

  function handleAppointmentChange(appointmentIdValue: string) {
    const selected = appointments.find((a) => a.id === Number(appointmentIdValue));
    setForm((prev) => ({
      ...prev,
      appointmentId: appointmentIdValue,
      amount: prev.amount || (selected?.totalPrice != null ? String(selected.totalPrice) : ""),
      clientId: prev.clientId || (selected?.clientId ? String(selected.clientId) : ""),
      barberId: prev.barberId || (selected?.barber?.idBarber ? String(selected.barber.idBarber) : ""),
    }));
  }

  function openCreate() { setForm(initialForm); setModalOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.appointmentId || !form.amount || !form.paymentMethod) {
      toast.error("Selecione agendamento, valor e metodo de pagamento"); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        appointmentId: parseInt(form.appointmentId),
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        installments: form.installments,
        notes: form.notes || undefined,
      };
      if (form.clientId) payload.clientId = parseInt(form.clientId);
      if (form.barberId) payload.barberId = parseInt(form.barberId);
      if (form.commissionRate) payload.commissionRate = parseFloat(form.commissionRate);
      if (form.couponCode) payload.couponCode = form.couponCode;
      if (form.loyaltyPointsUsed) payload.loyaltyPointsUsed = form.loyaltyPointsUsed;
      if (form.cardLastDigits) payload.cardLastDigits = form.cardLastDigits;
      if (form.cardBrand) payload.cardBrand = form.cardBrand;

      const res = await generica({ metodo: "POST", uri: "/payment", data: payload });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Pagamento registrado!");
        setModalOpen(false);
        await refreshCurrentList();
      } else toast.error(res?.data?.message || "Erro ao registrar pagamento");
    } catch { toast.error("Erro ao registrar pagamento"); }
    finally { setSaving(false); }
  }

  async function confirmPayment(id: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/payment/${id}/confirm`, params: { transactionId: `TXN-${Date.now()}` } });
      if (res?.status === 200) { toast.success("Pagamento confirmado!"); await refreshCurrentList(); }
      else toast.error("Erro ao confirmar");
    } catch { toast.error("Erro ao confirmar pagamento"); }
  }

  async function cancelPayment(id: number) {
    const result = await Swal.fire({
      title: "Cancelar pagamento?",
      text: "Deseja realmente cancelar este pagamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, cancelar!",
      cancelButtonText: "Voltar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "POST", uri: `/payment/${id}/cancel` });
      if (res?.status === 200) { toast.success("Pagamento cancelado!"); await refreshCurrentList(); }
      else toast.error("Erro ao cancelar");
    } catch { toast.error("Erro ao cancelar pagamento"); }
  }

  async function refundPayment(id: number) {
    const { value: reason } = await Swal.fire({
      title: "Motivo do reembolso",
      input: "text",
      inputLabel: "Informe o motivo do reembolso",
      inputPlaceholder: "Ex: Cliente solicitou cancelamento",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Reembolsar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => { if (!value) return "O motivo é obrigatório!"; },
    });
    if (!reason) return;
    try {
      const res = await generica({ metodo: "POST", uri: `/payment/${id}/refund`, params: { reason } });
      if (res?.status === 200) { toast.success("Reembolso realizado!"); await refreshCurrentList(); }
      else toast.error("Erro ao reembolsar");
    } catch { toast.error("Erro ao reembolsar"); }
  }

  async function viewPaymentDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/${id}` });
      if (res?.data) setDetailModal(res.data);
    } catch { toast.error("Erro ao carregar detalhes"); }
  }

  async function partialRefund(id: number) {
    const { value: amountStr } = await Swal.fire({
      title: "Reembolso Parcial",
      input: "number",
      inputLabel: "Valor do reembolso (R$)",
      inputPlaceholder: "0.00",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => { if (!value || parseFloat(value) <= 0) return "Informe um valor válido!"; },
    });
    if (!amountStr) return;
    const { value: reason } = await Swal.fire({
      title: "Motivo do reembolso parcial",
      input: "text",
      inputLabel: "Informe o motivo",
      inputValue: "Reembolso parcial",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Reembolsar",
      cancelButtonText: "Cancelar",
    });
    if (reason === undefined) return;
    try {
      const res = await generica({ metodo: "POST", uri: `/payment/${id}/partial-refund`, params: { amount: parseFloat(amountStr), reason: reason || "Reembolso parcial" } });
      if (res?.status === 200) { toast.success("Reembolso parcial realizado!"); await refreshCurrentList(); }
      else toast.error("Erro ao reembolsar parcialmente");
    } catch { toast.error("Erro no reembolso parcial"); }
  }

  async function loadPixCode(id: number) {
    try {
      const [codeRes, qrRes] = await Promise.all([
        generica({ metodo: "GET", uri: `/payment/${id}/pix-code` }).catch(() => null),
        generica({ metodo: "GET", uri: `/payment/${id}/pix-qrcode` }).catch(() => null),
      ]);
      setPixModal({ code: codeRes?.data?.pixCode || codeRes?.data, qrcode: qrRes?.data?.qrCode || qrRes?.data });
    } catch { toast.error("Erro ao carregar PIX"); }
  }

  async function loadByStatus(status: string) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/status/${status}`, params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { loadPayments(); }
    finally { setLoading(false); }
  }

  async function loadByMethod(method: string) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/method/${method}`, params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { loadPayments(); }
    finally { setLoading(false); }
  }

  async function loadByAppointment(appointmentId: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/appointment/${appointmentId}` });
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : (res?.data ? [res.data] : []));
    } catch { /* silencioso */ }
  }

  async function loadByClient(clientId: number) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/client/${clientId}`, params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { loadPayments(); }
    finally { setLoading(false); }
  }

  async function loadByBarber(barberId: number) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/payment/barber/${barberId}`, params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { loadPayments(); }
    finally { setLoading(false); }
  }

  async function loadByPeriod() {
    if (!periodStart || !periodEnd) { toast.error("Informe as datas"); return; }
    setLoading(true);
    try {
      const startDate = `${periodStart}T00:00:00`;
      const endDate = `${periodEnd}T23:59:59`;
      const res = await generica({ metodo: "GET", uri: "/payment/period", params: { startDate, endDate, page: 0, size: 100 } });
      if (!res || res.status >= 400) {
        toast.error(res?.data?.message || "Nao foi possivel filtrar por periodo");
        setPayments([]);
        return;
      }
      const data = res?.data?.content || res?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao filtrar por período"); }
    finally { setLoading(false); }
  }

  async function loadPendingPayments() {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/payment/pending", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      const list = Array.isArray(data) ? data : [];
      setPendingPayments(list);
      setPayments(list);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  async function loadPendingCount() {
    try {
      const res = await generica({ metodo: "GET", uri: "/payment/pending/count" });
      setPendingCount(typeof res?.data === 'number' ? res.data : res?.data?.count || 0);
    } catch { /* silencioso */ }
  }

  async function loadRevenueStats() {
    try {
      const [total, today, month, daily, byMethod, ticket, count] = await Promise.all([
        generica({ metodo: "GET", uri: "/payment/revenue/total" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/revenue/today" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/revenue/month" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/revenue/daily" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/revenue/by-method" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/average-ticket" }).catch(() => null),
        generica({ metodo: "GET", uri: "/payment/count" }).catch(() => null),
      ]);
      setRevenueStats({
        total: total?.data?.total ?? total?.data ?? 0,
        today: today?.data?.total ?? today?.data ?? 0,
        month: month?.data?.total ?? month?.data ?? 0,
      });
      setDailyRevenue(Array.isArray(daily?.data) ? daily.data.slice(-14) : []);
      setRevenueByMethod(Array.isArray(byMethod?.data) ? byMethod.data : Object.entries(byMethod?.data || {}).map(([k, v]) => ({ method: k, total: v })));
      setAvgTicket(typeof ticket?.data === 'number' ? ticket.data : ticket?.data?.averageTicket ?? 0);
      setTotalCount(typeof count?.data === 'number' ? count.data : count?.data?.count ?? 0);
    } catch { /* silencioso */ }
  }

  async function loadBarberRevenue(barberId: number) {
    try {
      const [revRes, commRes] = await Promise.all([
        generica({ metodo: "GET", uri: `/payment/barber/${barberId}/revenue` }).catch(() => null),
        generica({ metodo: "GET", uri: `/payment/barber/${barberId}/commission` }).catch(() => null),
      ]);
      setBarberCommissions([{ barberId, revenue: revRes?.data, commission: commRes?.data }]);
    } catch { /* silencioso */ }
  }

  const getMethodIcon = (method?: string) => {
    switch (method?.toUpperCase()) {
      case "PIX": return <FaQrcode className="text-green-500" />;
      case "CREDIT_CARD": case "DEBIT_CARD": return <FaCreditCard className="text-blue-500" />;
      default: return <FaMoneyBillWave className="text-yellow-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "REFUNDED": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const methodLabel: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartao de Credito",
    DEBIT_CARD: "Cartao de Debito",
    CASH: "Dinheiro",
    BANK_TRANSFER: "Transferencia",
    LOYALTY_POINTS: "Pontos de Fidelidade",
  };

  const filtered = payments.filter(p =>
    !search
    || p.clientName?.toLowerCase().includes(search.toLowerCase())
    || p.barberName?.toLowerCase().includes(search.toLowerCase())
    || p.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const getId = (p: Payment) => p.idPayment || p.id || 0;
  const getOrigin = (p: Payment) => p.appointmentId ? `Agendamento #${p.appointmentId}` : "Loja";
  const getPixImageSrc = (value?: string) => {
    if (!value) return "";
    const normalized = value.trim();
    if (!normalized) return "";
    if (normalized.startsWith("data:image/")) return normalized;
    const isLikelyBase64 = normalized.length > 120 && /^[A-Za-z0-9+/=\r\n]+$/.test(normalized);
    return isLikelyBase64 ? `data:image/png;base64,${normalized}` : "";
  };

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Pagamentos</h1>
          <button onClick={openCreate} className="gobarber-btn-primary flex items-center gap-2">
            <FaPlus /> Novo Pagamento
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab("all"); loadPayments(); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "all" ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Todos</button>
          <button onClick={() => { setActiveTab("pending"); loadPendingPayments(); }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === "pending" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Pendentes {pendingCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-white text-yellow-600 font-bold">{pendingCount}</span>}
          </button>
          <button onClick={() => { setActiveTab("stats"); loadRevenueStats(); }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === "stats" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <FaChartBar /> Receitas
          </button>
        </div>

        {/* Filters */}
        <div className="gobarber-card">
          <div className="flex flex-wrap gap-3 items-center">
            <FaFilter className="text-gray-400" />
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); if (e.target.value) loadByStatus(e.target.value); else loadPayments(); }} className="gobarber-input w-auto text-sm">
              <option value="">Status</option>
              <option value="PENDING">Pendente</option>
              <option value="COMPLETED">Concluido</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="REFUNDED">Reembolsado</option>
            </select>
            <select value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); if (e.target.value) loadByMethod(e.target.value); else loadPayments(); }} className="gobarber-input w-auto text-sm">
              <option value="">Método</option>
              <option value="PIX">PIX</option>
              <option value="CREDIT_CARD">Crédito</option>
              <option value="DEBIT_CARD">Débito</option>
              <option value="CASH">Dinheiro</option>
            </select>
            <select value={filterBarber} onChange={(e) => { setFilterBarber(e.target.value); if (e.target.value) loadByBarber(parseInt(e.target.value)); else loadPayments(); }} className="gobarber-input w-auto text-sm">
              <option value="">Barbeiro</option>
              {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `#${b.idBarber}`}</option>)}
            </select>
            <select value={filterClient} onChange={(e) => { setFilterClient(e.target.value); if (e.target.value) loadByClient(parseInt(e.target.value)); else loadPayments(); }} className="gobarber-input w-auto text-sm">
              <option value="">Cliente</option>
              {clients.map(c => <option key={c.idClient} value={c.idClient}>{c.name || `#${c.idClient}`}</option>)}
            </select>
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="gobarber-input w-auto text-sm" />
              <span className="text-gray-400">—</span>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="gobarber-input w-auto text-sm" />
              <button onClick={loadByPeriod} className="px-3 py-1.5 bg-[#E94560] text-white rounded-lg text-sm">Filtrar</button>
            </div>
          </div>
        </div>

        <div className="gobarber-card">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por cliente ou barbeiro..." value={search} onChange={(e) => setSearch(e.target.value)} className="gobarber-input pl-10" />
          </div>
        </div>

        {activeTab === "stats" ? (
          <div className="space-y-6">
            {/* Revenue cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="gobarber-card text-center">
                <p className="text-xs text-gray-500">Receita Total</p>
                <p className="text-xl font-bold text-green-600">R$ {Number(revenueStats.total || 0).toFixed(2)}</p>
              </div>
              <div className="gobarber-card text-center">
                <p className="text-xs text-gray-500">Receita Hoje</p>
                <p className="text-xl font-bold text-blue-600">R$ {Number(revenueStats.today || 0).toFixed(2)}</p>
              </div>
              <div className="gobarber-card text-center">
                <p className="text-xs text-gray-500">Receita Mês</p>
                <p className="text-xl font-bold text-purple-600">R$ {Number(revenueStats.month || 0).toFixed(2)}</p>
              </div>
              <div className="gobarber-card text-center">
                <p className="text-xs text-gray-500">Ticket Médio</p>
                <p className="text-xl font-bold text-[#E94560]">R$ {Number(avgTicket || 0).toFixed(2)}</p>
              </div>
              <div className="gobarber-card text-center">
                <p className="text-xs text-gray-500">Total Pagamentos</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{totalCount}</p>
              </div>
            </div>

            {/* Revenue by method */}
            {revenueByMethod.length > 0 && (
              <div className="gobarber-card">
                <h3 className="text-base font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2"><FaCreditCard /> Receita por Método</h3>
                <div className="space-y-2">
                  {revenueByMethod.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="flex items-center gap-2">{getMethodIcon(item.method)} {methodLabel[item.method] || item.method || '—'}</span>
                      <span className="font-semibold">R$ {typeof item.total === 'number' ? item.total.toFixed(2) : item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily revenue */}
            {dailyRevenue.length > 0 && (
              <div className="gobarber-card">
                <h3 className="text-base font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2"><FaCalendarAlt /> Receita Diária (Últimos 14 dias)</h3>
                <div className="grid grid-cols-7 gap-2">
                  {dailyRevenue.map((d: any, i: number) => (
                    <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-[10px] text-gray-500">{d.date || d.day || `D${i + 1}`}</p>
                      <p className="text-xs font-bold text-green-600">R$ {typeof d.total === 'number' ? d.total.toFixed(0) : (d.revenue?.toFixed?.(0) ?? d.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barber revenue */}
            <div className="gobarber-card">
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2"><FaUserTie /> Receita/Comissão por Barbeiro</h3>
              <select onChange={(e) => { if (e.target.value) loadBarberRevenue(parseInt(e.target.value)); }} className="gobarber-input w-auto mb-3">
                <option value="">Selecione um barbeiro</option>
                {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `#${b.idBarber}`}</option>)}
              </select>
              {barberCommissions.length > 0 && barberCommissions.map((bc, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Receita</p>
                    <p className="text-lg font-bold text-green-600">R$ {Number(typeof bc.revenue === 'number' ? bc.revenue : bc.revenue?.total || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Comissão</p>
                    <p className="text-lg font-bold text-blue-600">R$ {Number(typeof bc.commission === 'number' ? bc.commission : bc.commission?.total || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="gobarber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Origem</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Método</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum pagamento registrado</td></tr>
              ) : (
                filtered.map((p) => {
                  const pid = getId(p);
                  const method = p.paymentMethod || p.method || "";
                  return (
                    <tr key={pid} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{p.clientName || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{getOrigin(p)}</td>
                      <td className="py-3 px-4 text-[#1A1A2E] font-semibold">R$ {(p.finalAmount ?? p.amount)?.toFixed(2) || "0.00"}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2">{getMethodIcon(method)} {methodLabel[method] || method || "—"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(p.status)}`}>{p.status || "—"}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {(p.paymentDate || p.createdAt) ? new Date(p.paymentDate || p.createdAt!).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => viewPaymentDetail(pid)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Detalhes"><FaEye /></button>
                          {(p.paymentMethod || p.method)?.toUpperCase() === "PIX" && (
                            <button onClick={() => loadPixCode(pid)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="PIX"><FaQrcode /></button>
                          )}
                          {p.status?.toUpperCase() === "PENDING" && (
                            <>
                              <button onClick={() => confirmPayment(pid)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Confirmar"><FaCheckCircle /></button>
                              <button onClick={() => cancelPayment(pid)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar"><FaTimesCircle /></button>
                            </>
                          )}
                          {(p.status?.toUpperCase() === "COMPLETED" || p.status?.toUpperCase() === "CONFIRMED") && (
                            <>
                              <button onClick={() => refundPayment(pid)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Reembolso total"><FaUndoAlt /></button>
                              <button onClick={() => partialRefund(pid)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Reembolso parcial"><FaDollarSign /></button>
                            </>
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
        )}
      </div>

      {/* Modal PIX */}
      <Modal isOpen={!!pixModal} onClose={() => setPixModal(null)} title="Código PIX">
        {pixModal && (
          <div className="space-y-4 text-center">
            {getPixImageSrc(typeof pixModal.qrcode === "string" ? pixModal.qrcode : "") && (
              <div className="flex justify-center">
                <img src={getPixImageSrc(typeof pixModal.qrcode === "string" ? pixModal.qrcode : "")} alt="QR Code PIX" className="w-48 h-48 border rounded-lg" />
              </div>
            )}
            {pixModal.code && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Código Copia e Cola</p>
                <p className="text-sm font-mono break-all">{typeof pixModal.code === 'string' ? pixModal.code : JSON.stringify(pixModal.code)}</p>
                <button onClick={() => { navigator.clipboard.writeText(typeof pixModal.code === 'string' ? pixModal.code : JSON.stringify(pixModal.code)); toast.success("Copiado!"); }} className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm flex items-center gap-1 mx-auto"><FaCopy /> Copiar</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Novo Pagamento */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Pagamento" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="gobarber-input">
                <option value="">Selecione (opcional)</option>
                {clients.map(c => <option key={c.idClient} value={c.idClient}>{c.name || `Cliente #${c.idClient}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro</label>
              <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="gobarber-input">
                <option value="">Selecione (opcional)</option>
                {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `Barbeiro #${b.idBarber}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="gobarber-input" placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="gobarber-input" required>
                <option value="">Selecione</option>
                <option value="PIX">PIX</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="CASH">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agendamento *</label>
              <select
                value={form.appointmentId}
                onChange={(e) => handleAppointmentChange(e.target.value)}
                className="gobarber-input"
                required
              >
                <option value="">Selecione</option>
                {appointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    #{apt.id} - {apt.clientName || "Cliente"} {apt.startTime ? `(${new Date(apt.startTime).toLocaleString("pt-BR")})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupom</label>
              <input type="text" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })} className="gobarber-input" placeholder="Código" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className="gobarber-input" placeholder="Ex: 30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
              <input type="number" min="1" max="12" value={form.installments} onChange={(e) => setForm({ ...form, installments: parseInt(e.target.value) || 1 })} className="gobarber-input" />
            </div>
          </div>

          {(form.paymentMethod === "CREDIT_CARD" || form.paymentMethod === "DEBIT_CARD") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Últimos 4 dígitos</label>
                <input type="text" maxLength={4} value={form.cardLastDigits} onChange={(e) => setForm({ ...form, cardLastDigits: e.target.value.replace(/\D/g, "") })} className="gobarber-input" placeholder="1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira</label>
                <input type="text" value={form.cardBrand} onChange={(e) => setForm({ ...form, cardBrand: e.target.value })} className="gobarber-input" placeholder="Visa, Master..." />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="gobarber-input" rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">{saving ? "Salvando..." : "Registrar Pagamento"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detalhes do Pagamento">
        {detailModal && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500">Cliente</span><p className="font-medium">{detailModal.clientName || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Origem</span><p className="font-medium">{detailModal.appointmentId ? `Agendamento #${detailModal.appointmentId}` : "Loja"}</p></div>
              <div><span className="text-xs text-gray-500">Barbeiro</span><p className="font-medium">{detailModal.barberName || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Valor Bruto</span><p className="font-medium">R$ {detailModal.amount?.toFixed(2) || "0.00"}</p></div>
              <div><span className="text-xs text-gray-500">Valor Final</span><p className="font-medium text-[#E94560]">R$ {(detailModal.finalAmount ?? detailModal.amount)?.toFixed(2) || "0.00"}</p></div>
              <div><span className="text-xs text-gray-500">Método</span><p className="font-medium">{methodLabel[detailModal.paymentMethod || ""] || detailModal.paymentMethod || detailModal.method || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Status</span><p className="font-medium">{detailModal.status || "—"}</p></div>
              {detailModal.transactionId && <div><span className="text-xs text-gray-500">Transação</span><p className="font-medium text-xs font-mono">{detailModal.transactionId}</p></div>}
              {detailModal.couponCode && <div><span className="text-xs text-gray-500">Cupom</span><p className="font-medium">{detailModal.couponCode} (-R$ {detailModal.couponDiscount?.toFixed(2) || "0"})</p></div>}
              {detailModal.commissionRate != null && <div><span className="text-xs text-gray-500">Comissão</span><p className="font-medium">{detailModal.commissionRate}% (R$ {detailModal.commissionAmount?.toFixed(2) || "0"})</p></div>}
              {detailModal.installments != null && detailModal.installments > 1 && <div><span className="text-xs text-gray-500">Parcelas</span><p className="font-medium">{detailModal.installments}x</p></div>}
              {detailModal.cardLastDigits && <div><span className="text-xs text-gray-500">Cartão</span><p className="font-medium">**** {detailModal.cardLastDigits} {detailModal.cardBrand || ""}</p></div>}
              <div><span className="text-xs text-gray-500">Data</span><p className="font-medium">{(detailModal.paymentDate || detailModal.createdAt) ? new Date(detailModal.paymentDate || detailModal.createdAt!).toLocaleString("pt-BR") : "—"}</p></div>
            </div>
            {detailModal.notes && <div><span className="text-xs text-gray-500">Observações</span><p className="text-sm mt-1">{detailModal.notes}</p></div>}
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}



