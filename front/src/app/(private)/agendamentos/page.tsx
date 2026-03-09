"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaEye, FaCheck, FaTimes, FaClock, FaHistory, FaCalendarCheck, FaUserClock } from "react-icons/fa";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface Appointment {
  id: number;
  clientName?: string;
  clientNumber?: string;
  barberName?: string;
  barberId?: number;
  barber?: { id?: number; idBarber?: number; name?: string };
  serviceName?: string;
  serviceTypeIds?: number[];
  serviceType?: { id?: number; name?: string }[];
  services?: { id?: number; name?: string }[];
  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  rejectionReason?: string;
  totalPrice?: number;
  clientId?: number;
}

interface Barber { idBarber: number; name?: string; }
interface Service { id: number; name?: string; }

const initialForm = { clientName: "", clientNumber: "", barberId: "", serviceTypeIds: [] as number[], startTime: "" };
const initialRequestForm = { clientName: "", clientNumber: "", barberId: "", serviceTypeIds: [] as number[], startTime: "" };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-700" },
  PENDING_APPROVAL: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
  COMPLETED: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
};

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Appointment | null>(null);
  const [rejectModal, setRejectModal] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "future" | "history">("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState(initialRequestForm);

  useEffect(() => { loadAppointments(); loadPendingAppointments(); loadBarbers(); loadServices(); }, []);

  async function loadAppointments() {
    setLoading(true);
    try {
      const response = await generica({ metodo: "GET", uri: "/appointments", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar agendamentos"); }
    finally { setLoading(false); }
  }

  async function loadPendingAppointments() {
    try {
      const response = await generica({ metodo: "GET", uri: "/appointments/pending", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      const pending = Array.isArray(data) ? data : [];
      setPendingAppointments(pending);
      setPendingCount(pending.length);
    } catch { /* silencioso - pode não ter permissão */ }
  }

  async function loadBarbers() {
    try {
      const res = await generica({ metodo: "GET", uri: "/barber", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setBarbers(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function loadServices() {
    try {
      const res = await generica({ metodo: "GET", uri: "/services", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setServices(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  function openCreate() { setForm(initialForm); setEditingId(null); setModalOpen(true); }

  function openEdit(a: Appointment) {
    setForm({
      clientName: a.clientName || "",
      clientNumber: formatPhoneBR(a.clientNumber || ""),
      barberId: String(a.barberId || a.barber?.id || a.barber?.idBarber || ""),
      serviceTypeIds: a.serviceTypeIds || a.serviceType?.map(s => s.id!).filter(Boolean) || a.services?.map(s => s.id!).filter(Boolean) || [],
      startTime: a.startTime || (a.date && a.time ? `${a.date}T${a.time}` : ""),
    });
    setEditingId(a.id);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const barberId = parseInt(form.barberId);
    if (!form.clientName || !barberId || form.serviceTypeIds.length === 0 || !form.startTime) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    const payload = { ...form, barberId, clientNumber: form.clientNumber ? onlyDigits(form.clientNumber) : "" };
    setSaving(true);
    try {
      if (editingId) {
        const res = await generica({ metodo: "PUT", uri: `/appointments/${editingId}`, data: payload });
        if (res?.status === 200 || res?.status === 204) { toast.success("Agendamento atualizado!"); setModalOpen(false); loadAppointments(); }
        else toast.error("Erro ao atualizar agendamento");
      } else {
        const res = await generica({ metodo: "POST", uri: "/appointments", data: payload });
        if (res?.status === 200 || res?.status === 201) { toast.success("Agendamento criado!"); setModalOpen(false); loadAppointments(); }
        else toast.error(res?.data?.message || "Erro ao criar agendamento");
      }
    } catch { toast.error("Erro ao salvar agendamento"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir este agendamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/appointments/${id}` });
      if (res?.status === 200 || res?.status === 204) { toast.success("Agendamento excluído!"); loadAppointments(); loadPendingAppointments(); }
      else toast.error("Erro ao excluir agendamento");
    } catch { toast.error("Erro ao excluir agendamento"); }
  }

  async function handleApprove(id: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/appointments/${id}/approve` });
      if (res?.status === 200) {
        toast.success("Agendamento aprovado! Cliente será notificado por email.");
        loadAppointments();
        loadPendingAppointments();
      } else {
        toast.error(res?.data?.message || "Erro ao aprovar agendamento");
      }
    } catch { toast.error("Erro ao aprovar agendamento"); }
  }

  function openRejectModal(apt: Appointment) {
    setRejectModal(apt);
    setRejectReason("");
  }

  async function handleReject() {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    try {
      const res = await generica({
        metodo: "POST",
        uri: `/appointments/${rejectModal.id}/reject`,
        data: { reason: rejectReason },
      });
      if (res?.status === 200) {
        toast.success("Agendamento rejeitado. Cliente será notificado.");
        setRejectModal(null);
        loadAppointments();
        loadPendingAppointments();
      } else {
        toast.error(res?.data?.message || "Erro ao rejeitar agendamento");
      }
    } catch { toast.error("Erro ao rejeitar agendamento"); }
  }

  async function viewAppointmentDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/appointments/${id}` });
      if (res?.data) setDetailModal(res.data);
    } catch { toast.error("Erro ao carregar detalhes"); }
  }

  async function loadBarberAppointments(barberId: number) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/appointments/barber/${barberId}`, params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar agendamentos do barbeiro"); }
    finally { setLoading(false); }
  }

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments/history", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { /* fallback para lista normal */ loadAppointments(); }
    finally { setLoading(false); }
  }

  async function loadBarberHistory(barberId: number) {
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments/history/barber", params: { barberId, page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function loadFuture() {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments/future", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { /* fallback */ loadAppointments(); }
    finally { setLoading(false); }
  }

  async function loadFutureBarber(barberId: number) {
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments/future/barber", params: { barberId, page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function loadFutureBarberOwn() {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/appointments/future/barber/own", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const barberId = parseInt(requestForm.barberId);
    const clientName = requestForm.clientName.trim();
    const clientNumber = onlyDigits(requestForm.clientNumber);
    const startTime = requestForm.startTime.length === 16 ? `${requestForm.startTime}:00` : requestForm.startTime;
    if (!clientName || !clientNumber || !barberId || requestForm.serviceTypeIds.length === 0 || !startTime) {
      toast.error("Preencha todos os campos"); return;
    }
    setSaving(true);
    try {
      const res = await generica({
        metodo: "POST",
        uri: "/appointments/request",
        data: {
          clientName,
          clientNumber,
          barberId,
          serviceTypeIds: requestForm.serviceTypeIds,
          startTime,
        },
      });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Solicitação enviada!");
        setRequestForm(initialRequestForm);
        setRequestModalOpen(false);
        loadAppointments();
      } else toast.error(res?.data?.message || res?.data?.error || "Erro ao solicitar");
    } catch { toast.error("Erro ao solicitar agendamento"); }
    finally { setSaving(false); }
  }

  function toggleService(id: number) {
    setForm(prev => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter(s => s !== id)
        : [...prev.serviceTypeIds, id],
    }));
  }

  const displayList = activeTab === "pending" ? pendingAppointments : appointments;

  const filtered = displayList.filter(a =>
    !search || [a.clientName, a.barber?.name, a.serviceName].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function handleTabChange(tab: typeof activeTab) {
    setActiveTab(tab);
    if (tab === "all") loadAppointments();
    else if (tab === "pending") loadPendingAppointments();
    else if (tab === "future") loadFuture();
    else if (tab === "history") loadHistory();
  }

  function formatDateTime(a: Appointment) {
    if (a.startTime) {
      // Handle both "dd/MM/yyyy HH:mm" and ISO formats
      if (a.startTime.includes("/")) return a.startTime;
      const d = new Date(a.startTime);
      return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `${a.date || "—"} ${a.time || ""}`;
  }

  function getStatusBadge(status?: string) {
    const s = STATUS_MAP[status || ""] || { label: status || "—", color: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.color}`}>{s.label}</span>;
  }

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Agendamentos</h1>
          <button onClick={openCreate} className="gobarber-btn-primary flex items-center gap-2">
            <FaPlus /> Novo Agendamento
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${activeTab === "all" ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Todos
          </button>
          <button
            onClick={() => handleTabChange("pending")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === "pending" ? "bg-[#E94560] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <FaClock /> Pendentes
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === "pending" ? "bg-white text-[#E94560]" : "bg-[#E94560] text-white"}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("future")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === "future" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <FaCalendarCheck /> Futuros
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === "history" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <FaHistory /> Histórico
          </button>
          <button
            onClick={() => { setRequestForm(initialRequestForm); setRequestModalOpen(true); }}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2 ml-auto"
          >
            <FaUserClock /> Solicitar
          </button>
        </div>

        {/* Filtro por barbeiro */}
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Filtrar por barbeiro:</label>
          <select
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!v) { if (activeTab === "future") loadFuture(); else if (activeTab === "history") loadHistory(); else loadAppointments(); }
              else { if (activeTab === "future") loadFutureBarber(v); else if (activeTab === "history") loadBarberHistory(v); else loadBarberAppointments(v); }
            }}
            className="gobarber-input w-auto"
          >
            <option value="">Todos</option>
            {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `Barbeiro #${b.idBarber}`}</option>)}
          </select>
        </div>

        <div className="gobarber-card">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar agendamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="gobarber-input pl-10" />
          </div>
        </div>

        <div className="gobarber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600 hidden sm:table-cell">Barbeiro</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600 hidden md:table-cell">Serviço</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Data/Hora</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">
                  {activeTab === "pending" ? "Nenhum agendamento pendente" : "Nenhum agendamento encontrado"}
                </td></tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className={`border-b border-gray-100 hover:bg-gray-50 
                    ${apt.status === "PENDING_APPROVAL" ? "bg-yellow-50/50" : ""}`}>
                    <td className="py-3 px-3 sm:px-4">
                      <div>{apt.clientName || "—"}</div>
                      <div className="text-xs text-gray-400 sm:hidden">{apt.barber?.name || ""}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">{apt.barber?.name || "—"}</td>
                    <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                      {apt.serviceType?.map(s => s.name).join(", ") || apt.serviceName || apt.services?.map(s => s.name).join(", ") || "—"}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{formatDateTime(apt)}</td>
                    <td className="py-3 px-3 sm:px-4">{getStatusBadge(apt.status)}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewAppointmentDetail(apt.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver detalhes"><FaEye /></button>
                        {apt.status === "PENDING_APPROVAL" && (
                          <>
                            <button onClick={() => handleApprove(apt.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprovar">
                              <FaCheck />
                            </button>
                            <button onClick={() => openRejectModal(apt)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rejeitar">
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {apt.status !== "PENDING_APPROVAL" && (
                          <>
                            <button onClick={() => openEdit(apt)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Editar"><FaEdit /></button>
                            <button onClick={() => handleDelete(apt.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir"><FaTrash /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Agendamento" : "Novo Agendamento"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="gobarber-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.clientNumber}
                onChange={(e) => setForm({ ...form, clientNumber: formatPhoneBR(e.target.value) })}
                className="gobarber-input"
                maxLength={15}
                placeholder="(81) 99999-9999"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro *</label>
            <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="gobarber-input" required>
              <option value="">Selecione um barbeiro</option>
              {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `Barbeiro #${b.idBarber}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviços *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {services.length === 0 ? (
                <p className="text-gray-400 text-sm col-span-2">Nenhum serviço disponível</p>
              ) : services.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.serviceTypeIds.includes(s.id)} onChange={() => toggleService(s.id)} className="rounded border-gray-300" />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora *</label>
            <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="gobarber-input" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">{saving ? "Salvando..." : editingId ? "Atualizar" : "Agendar"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Detalhes do Agendamento">
        {detailModal && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500">Cliente</span><p className="font-medium">{detailModal.clientName || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Barbeiro</span><p className="font-medium">{detailModal.barber?.name || "—"}</p></div>
              <div>
                <span className="text-xs text-gray-500">Serviços</span>
                <p className="font-medium">
                  {detailModal.serviceType?.map(s => s.name).join(", ") || detailModal.serviceName || detailModal.services?.map(s => s.name).join(", ") || "—"}
                </p>
              </div>
              <div><span className="text-xs text-gray-500">Início</span><p className="font-medium">{formatDateTime(detailModal)}</p></div>
              {detailModal.endTime && (
                <div><span className="text-xs text-gray-500">Término</span><p className="font-medium">{detailModal.endTime.includes("/") ? detailModal.endTime : new Date(detailModal.endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div>
              )}
              <div><span className="text-xs text-gray-500">Status</span><p className="font-medium">{getStatusBadge(detailModal.status)}</p></div>
              <div><span className="text-xs text-gray-500">Telefone</span><p className="font-medium">{detailModal.clientNumber ? formatPhoneBR(detailModal.clientNumber) : "—"}</p></div>
              {detailModal.totalPrice != null && (
                <div><span className="text-xs text-gray-500">Valor Total</span><p className="font-medium text-[#E94560]">R$ {detailModal.totalPrice.toFixed(2)}</p></div>
              )}
              {detailModal.rejectionReason && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-500">Motivo da Rejeição</span>
                  <p className="font-medium text-red-600">{detailModal.rejectionReason}</p>
                </div>
              )}
            </div>

            {detailModal.status === "PENDING_APPROVAL" && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => { handleApprove(detailModal.id); setDetailModal(null); }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <FaCheck /> Aprovar
                </button>
                <button
                  onClick={() => { setDetailModal(null); openRejectModal(detailModal); }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                >
                  <FaTimes /> Rejeitar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Solicitação (Cliente) */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => { setRequestForm(initialRequestForm); setRequestModalOpen(false); }}
        title="Solicitar Agendamento"
      >
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
            <input
              type="text"
              value={requestForm.clientName}
              onChange={(e) => setRequestForm({ ...requestForm, clientName: e.target.value })}
              className="gobarber-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone do Cliente *</label>
            <input
              type="tel"
              value={requestForm.clientNumber}
              onChange={(e) => setRequestForm({ ...requestForm, clientNumber: formatPhoneBR(e.target.value) })}
              className="gobarber-input"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro *</label>
            <select value={requestForm.barberId} onChange={(e) => setRequestForm({ ...requestForm, barberId: e.target.value })} className="gobarber-input" required>
              <option value="">Selecione um barbeiro</option>
              {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `Barbeiro #${b.idBarber}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviços *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {services.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={requestForm.serviceTypeIds.includes(s.id)} onChange={() => setRequestForm(prev => ({ ...prev, serviceTypeIds: prev.serviceTypeIds.includes(s.id) ? prev.serviceTypeIds.filter(x => x !== s.id) : [...prev.serviceTypeIds, s.id] }))} className="rounded border-gray-300" />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora *</label>
            <input type="datetime-local" value={requestForm.startTime} onChange={(e) => setRequestForm({ ...requestForm, startTime: e.target.value })} className="gobarber-input" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setRequestForm(initialRequestForm); setRequestModalOpen(false); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">{saving ? "Enviando..." : "Solicitar"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Rejeição */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeitar Agendamento">
        {rejectModal && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Você está rejeitando o agendamento de <strong>{rejectModal.clientName}</strong> em <strong>{formatDateTime(rejectModal)}</strong>.
                O cliente será notificado por email.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Rejeição *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="gobarber-input min-h-[100px]"
                placeholder="Informe o motivo da rejeição (será enviado ao cliente)..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                Confirmar Rejeição
              </button>
            </div>
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}
