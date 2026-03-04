"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaEye, FaCamera, FaStar, FaGift, FaBirthdayCake, FaCrown, FaChartBar, FaUserCheck, FaUserTimes, FaHeart, FaHistory } from "react-icons/fa";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface Client {
  idClient: number;
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  active?: boolean;
  birthDate?: string;
  gender?: string;
  notes?: string;
  totalVisits?: number;
  totalSpent?: number;
  address?: { idAddress?: number; street?: string; number?: number; neighborhood?: string; city?: string; state?: string; cep?: string };
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birthDate: "",
  gender: "",
  notes: "",
  password: "",
  address: { street: "", number: 0, neighborhood: "", city: "", state: "", cep: "" },
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<{idBarber: number; name?: string}[]>([]);
  const [stats, setStats] = useState<{total: number; active: number; distribution: any}>({total: 0, active: 0, distribution: null});
  const [loyaltyModal, setLoyaltyModal] = useState<{clientId: number; action: string} | null>(null);
  const [loyaltyAmount, setLoyaltyAmount] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState({type: "name", value: ""});

  useEffect(() => { loadClients(); loadBarbers(); loadStats(); }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const response = await generica({ metodo: "GET", uri: "/client", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar clientes"); }
    finally { setLoading(false); }
  }

  async function loadBarbers() {
    try {
      const res = await generica({ metodo: "GET", uri: "/barber", params: { page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setBarbers(Array.isArray(data) ? data : []);
    } catch { /* */ }
  }

  async function loadStats() {
    try {
      const [totalRes, activeRes, distRes] = await Promise.all([
        generica({ metodo: "GET", uri: "/client/total-clients" }).catch(() => null),
        generica({ metodo: "GET", uri: "/client/active-clients" }).catch(() => null),
        generica({ metodo: "GET", uri: "/client/loyalty-distribution" }).catch(() => null),
      ]);
      setStats({
        total: typeof totalRes?.data === 'number' ? totalRes.data : totalRes?.data?.total ?? 0,
        active: typeof activeRes?.data === 'number' ? activeRes.data : activeRes?.data?.total ?? 0,
        distribution: distRes?.data || null,
      });
    } catch { /* */ }
  }

  async function viewClientDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/client/${id}` });
      if (res?.data) { setDetailModal(res.data); loadClientPhoto(id); }
    } catch { toast.error("Erro ao carregar detalhes"); }
  }

  async function loadClientPhoto(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/client/${id}/photo`, responseType: "blob" });
      if (res?.status === 200 && res?.data) {
        const url = typeof res.data === 'string' ? res.data : URL.createObjectURL(res.data instanceof Blob ? res.data : new Blob([res.data]));
        setClientPhoto(url);
      } else { setClientPhoto(null); }
    } catch { setClientPhoto(null); }
  }

  async function searchByEmail(email: string) {
    try {
      const res = await generica({ metodo: "GET", uri: `/client/email/${encodeURIComponent(email)}` });
      if (res?.data) setClients(Array.isArray(res.data) ? res.data : [res.data]);
    } catch { toast.error("Cliente não encontrado"); }
  }

  async function searchByPhone(phone: string) {
    const sanitizedPhone = onlyDigits(phone);
    if (!sanitizedPhone) {
      loadClients();
      return;
    }
    try {
      const res = await generica({ metodo: "GET", uri: `/client/phone/${sanitizedPhone}` });
      if (res?.data) setClients(Array.isArray(res.data) ? res.data : [res.data]);
    } catch { toast.error("Cliente não encontrado"); }
  }

  async function searchByCpf(cpf: string) {
    try {
      const res = await generica({ metodo: "GET", uri: `/client/cpf/${cpf}` });
      if (res?.data) setClients(Array.isArray(res.data) ? res.data : [res.data]);
    } catch { toast.error("Cliente não encontrado"); }
  }

  async function searchGeneral(query: string) {
    try {
      const res = await generica({ metodo: "GET", uri: "/client/search", params: { name: query, page: 0, size: 100 } });
      const data = res?.data?.content || res?.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch { loadClients(); }
  }

  async function handleAdvancedSearch() {
    if (!advancedSearch.value.trim()) { loadClients(); return; }
    switch (advancedSearch.type) {
      case "email": searchByEmail(advancedSearch.value); break;
      case "phone": searchByPhone(advancedSearch.value); break;
      case "cpf": searchByCpf(advancedSearch.value); break;
      default: searchGeneral(advancedSearch.value); break;
    }
  }

  async function loadTopClients() { try { const r = await generica({ metodo: "GET", uri: "/client/top-clients" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadVipClients() { try { const r = await generica({ metodo: "GET", uri: "/client/vip" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadTopSpenders() { try { const r = await generica({ metodo: "GET", uri: "/client/top-spenders" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadInactive() { try { const r = await generica({ metodo: "GET", uri: "/client/inactive-clients" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadBirthdays() { try { const r = await generica({ metodo: "GET", uri: "/client/birthdays" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadBirthdaysToday() { try { const r = await generica({ metodo: "GET", uri: "/client/birthdays/today" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadBirthdaysMonth() { try { const r = await generica({ metodo: "GET", uri: "/client/birthdays/month" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadByTier(tier: string) { try { const r = await generica({ metodo: "GET", uri: `/client/by-loyalty-tier/${tier}` }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadForPromotions() { try { const r = await generica({ metodo: "GET", uri: "/client/clients-for-promotions" }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }
  async function loadByPreferredBarber(barberId: number) { try { const r = await generica({ metodo: "GET", uri: `/client/preferred-barber/${barberId}` }); setClients(Array.isArray(r?.data) ? r.data : []); } catch { /* */ } }

  async function addLoyaltyPoints(clientId: number, points: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/client/${clientId}/loyalty/add`, params: { points } });
      if (res?.status === 200) { toast.success("Pontos adicionados!"); setLoyaltyModal(null); loadClients(); }
      else toast.error("Erro ao adicionar pontos");
    } catch { toast.error("Erro ao adicionar pontos"); }
  }

  async function redeemLoyaltyPoints(clientId: number, points: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/client/${clientId}/loyalty/redeem`, params: { points } });
      if (res?.status === 200) { toast.success("Pontos resgatados!"); setLoyaltyModal(null); loadClients(); }
      else toast.error(res?.data?.message || "Erro ao resgatar pontos");
    } catch { toast.error("Erro ao resgatar pontos"); }
  }

  async function registerVisit(clientId: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/client/${clientId}/visit`, params: { amount: 0 } });
      if (res?.status === 200) toast.success("Visita registrada!");
      else toast.error("Erro ao registrar visita");
    } catch { toast.error("Erro ao registrar visita"); }
  }

  async function setPreferredBarber(clientId: number, barberId: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/client/${clientId}/preferred-barber/${barberId}` });
      if (res?.status === 200) toast.success("Barbeiro preferido definido!");
      else toast.error("Erro");
    } catch { toast.error("Erro ao definir barbeiro preferido"); }
  }

  async function getLoyaltyDiscount(clientId: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/client/${clientId}/loyalty-discount` });
      if (res?.data != null) toast.info(`Desconto fidelidade: ${typeof res.data === 'number' ? `${res.data}%` : JSON.stringify(res.data)}`);
    } catch { /* */ }
  }

  async function updateClientPhoto(clientId: number, file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await generica({ metodo: "PUT", uri: `/client/${clientId}/photo`, data: formData });
      if (res?.status === 200) { toast.success("Foto atualizada!"); loadClientPhoto(clientId); }
      else toast.error("Erro ao atualizar foto");
    } catch { toast.error("Erro ao atualizar foto"); }
  }

  async function deleteClientPhoto(clientId: number) {
    const result = await Swal.fire({
      title: "Remover foto?",
      text: "Deseja remover a foto deste cliente?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/client/${clientId}/photo` });
      if (res?.status === 200 || res?.status === 204) { toast.success("Foto removida!"); setClientPhoto(null); }
      else toast.error("Erro ao remover foto");
    } catch { toast.error("Erro ao remover foto"); }
  }

  function openCreate() { setForm(initialForm); setEditingId(null); setModalOpen(true); }

  function openEdit(c: Client) {
    setForm({
      name: c.name || "", email: c.email || "", phone: formatPhoneBR(c.phone || ""), cpf: c.cpf || "",
      birthDate: c.birthDate || "", gender: c.gender || "", notes: c.notes || "", password: "",
      address: {
        street: c.address?.street || "",
        number: c.address?.number || 0,
        neighborhood: c.address?.neighborhood || "",
        city: c.address?.city || "",
        state: c.address?.state || "",
        cep: c.address?.cep || "",
      },
    });
    setEditingId(c.idClient);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Preencha o nome"); return; }
    setSaving(true);
    // Sanitize address CEP: strip non-digits (DB column is varchar(8))
    const sanitizedAddress = form.address
      ? { ...form.address, cep: form.address.cep?.replace(/\D/g, "").substring(0, 8) || "" }
      : form.address;
    try {
      if (editingId) {
        const cleanedUpdateForm = {
          ...form,
          phone: form.phone ? onlyDigits(form.phone) : "",
          gender: form.gender || undefined,
          address: (sanitizedAddress?.street || sanitizedAddress?.city) ? sanitizedAddress : undefined,
        };
        const fd = new FormData();
        fd.append("client", new Blob([JSON.stringify(cleanedUpdateForm)], { type: "application/json" }));
        if (photoFile) fd.append("photo", photoFile);
        const res = await generica({ metodo: "PUT", uri: `/client/${editingId}`, data: fd });
        if (res?.status === 200) { toast.success("Cliente atualizado!"); setModalOpen(false); loadClients(); }
        else toast.error("Erro ao atualizar cliente");
      } else {
        const cleanedForm = {
          ...form,
          phone: form.phone ? onlyDigits(form.phone) : "",
          gender: form.gender || undefined,
          address: (sanitizedAddress?.street || sanitizedAddress?.city) ? sanitizedAddress : undefined,
        };
        const res = await generica({ metodo: "POST", uri: "/client/create-without-photo", data: cleanedForm });
        if (res?.status === 200 || res?.status === 201) {
          toast.success("Cliente cadastrado!");
          // Upload photo if selected
          if (photoFile && res.data?.idClient) {
            await updateClientPhoto(res.data.idClient, photoFile);
          }
          setModalOpen(false); loadClients();
        }
        else toast.error(res?.data?.message || "Erro ao cadastrar cliente");
      }
    } catch { toast.error("Erro ao salvar cliente"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir este cliente?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/client/${id}` });
      if (res?.status === 200 || res?.status === 204) { toast.success("Cliente excluído!"); loadClients(); }
      else toast.error("Erro ao excluir cliente");
    } catch { toast.error("Erro ao excluir cliente"); }
  }

  const filtered = clients.filter(
    (c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.cpf?.includes(search)
  );

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Clientes</h1>
          <button onClick={openCreate} className="gobarber-btn-primary flex items-center gap-2">
            <FaPlus /> Novo Cliente
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="gobarber-card text-center">
            <p className="text-xl font-bold text-[#1A1A2E]">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Clientes</p>
          </div>
          <div className="gobarber-card text-center">
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Ativos</p>
          </div>
          {stats.distribution && (
            <div className="gobarber-card text-center col-span-2">
              <p className="text-xs text-gray-500 mb-1">Distribuição Fidelidade</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.entries(stats.distribution).map(([tier, count]) => (
                  <span key={tier} className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{tier}: {String(count)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todos", fn: loadClients },
            { key: "vip", label: "VIP", icon: <FaCrown />, fn: loadVipClients },
            { key: "top", label: "Top Clientes", icon: <FaStar />, fn: loadTopClients },
            { key: "spenders", label: "Top Gastos", icon: <FaChartBar />, fn: loadTopSpenders },
            { key: "inactive", label: "Inativos", icon: <FaUserTimes />, fn: loadInactive },
            { key: "bday-today", label: "Aniversário Hoje", icon: <FaBirthdayCake />, fn: loadBirthdaysToday },
            { key: "bday-month", label: "Aniversário Mês", fn: loadBirthdaysMonth },
            { key: "bday-all", label: "Aniversários", fn: loadBirthdays },
            { key: "promo", label: "Para Promoções", icon: <FaGift />, fn: loadForPromotions },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); tab.fn(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${activeTab === tab.key ? "bg-[#1A1A2E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
          <select onChange={(e) => { if (e.target.value) loadByTier(e.target.value); }} className="gobarber-input w-auto text-xs">
            <option value="">Por Tier</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </select>
          <select onChange={(e) => { if (e.target.value) loadByPreferredBarber(parseInt(e.target.value)); }} className="gobarber-input w-auto text-xs">
            <option value="">Por Barbeiro Preferido</option>
            {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `#${b.idBarber}`}</option>)}
          </select>
        </div>

        {/* Advanced Search */}
        <div className="gobarber-card">
          <div className="flex gap-2">
            <select value={advancedSearch.type} onChange={(e) => setAdvancedSearch({...advancedSearch, type: e.target.value})} className="gobarber-input w-auto text-sm">
              <option value="name">Nome</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
              <option value="cpf">CPF</option>
            </select>
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Buscar por ${advancedSearch.type}...`}
                value={advancedSearch.value}
                onChange={(e) =>
                  setAdvancedSearch({
                    ...advancedSearch,
                    value: advancedSearch.type === "phone" ? formatPhoneBR(e.target.value) : e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdvancedSearch()}
                className="gobarber-input pl-10"
              />
            </div>
            <button onClick={handleAdvancedSearch} className="px-4 py-2 bg-[#E94560] text-white rounded-lg text-sm">Buscar</button>
          </div>
        </div>

        <div className="gobarber-card">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar clientes por nome, email ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="gobarber-input pl-10" />
          </div>
        </div>

        <div className="gobarber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Nome</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600 hidden md:table-cell">Telefone</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Fidelidade</th>
                <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum cliente encontrado</td></tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.idClient} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 sm:px-4 font-medium">
                      <div>{client.name || "—"}</div>
                      <div className="text-xs text-gray-400 sm:hidden">{client.email || ""}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-600 hidden sm:table-cell">{client.email || "—"}</td>
                    <td className="py-3 px-3 sm:px-4 text-gray-600 hidden md:table-cell">{client.phone ? formatPhoneBR(client.phone) : "—"}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">{client.loyaltyPoints ?? 0} pts</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => viewClientDetail(client.idClient)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><FaEye /></button>
                        <button onClick={() => openEdit(client)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"><FaEdit /></button>
                        <button onClick={() => { setLoyaltyModal({ clientId: client.idClient, action: "add" }); setLoyaltyAmount(""); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Adicionar pontos"><FaStar /></button>
                        <button onClick={() => registerVisit(client.idClient)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Registrar visita"><FaHistory /></button>
                        <button onClick={() => getLoyaltyDiscount(client.idClient)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Ver desconto"><FaGift /></button>
                        <button onClick={() => handleDelete(client.idClient)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Cliente" : "Novo Cliente"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="gobarber-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="gobarber-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhoneBR(e.target.value) })}
                className="gobarber-input"
                maxLength={15}
                placeholder="(81) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
              <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })} className="gobarber-input" maxLength={11} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="gobarber-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="gobarber-input">
                <option value="">Selecione</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Feminino</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha (opcional)</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="gobarber-input" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="gobarber-input" rows={2} />
          </div>
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Endereço</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Rua" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="gobarber-input" />
              <input type="number" placeholder="Número" value={form.address.number || ""} onChange={(e) => setForm({ ...form, address: { ...form.address, number: parseInt(e.target.value) || 0 } })} className="gobarber-input" />
              <input type="text" placeholder="Bairro" value={form.address.neighborhood} onChange={(e) => setForm({ ...form, address: { ...form.address, neighborhood: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="Cidade" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="UF" maxLength={2} value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value.toUpperCase() } })} className="gobarber-input" />
              <input type="text" placeholder="CEP" maxLength={9} value={form.address.cep} onChange={(e) => { const digits = e.target.value.replace(/\D/g, "").substring(0, 8); const fmt = digits.length > 5 ? digits.substring(0, 5) + "-" + digits.substring(5) : digits; setForm({ ...form, address: { ...form.address, cep: fmt } }); }} className="gobarber-input" />
            </div>
          </fieldset>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="gobarber-input text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">{saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detailModal} onClose={() => { setDetailModal(null); setClientPhoto(null); }} title="Detalhes do Cliente">
        {detailModal && (
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {clientPhoto ? <img src={clientPhoto} alt="" className="w-full h-full object-cover" /> : <FaCamera className="text-gray-400 text-2xl" />}
              </div>
              <div className="flex gap-2">
                <label className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs cursor-pointer">
                  <FaCamera className="inline mr-1" /> Alterar
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) updateClientPhoto(detailModal.idClient, e.target.files[0]); }} />
                </label>
                {clientPhoto && <button onClick={() => deleteClientPhoto(detailModal.idClient)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs">Remover</button>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500">Nome</span><p className="font-medium">{detailModal.name}</p></div>
              <div><span className="text-xs text-gray-500">Email</span><p className="font-medium">{detailModal.email}</p></div>
              <div><span className="text-xs text-gray-500">Telefone</span><p className="font-medium">{detailModal.phone ? formatPhoneBR(detailModal.phone) : "—"}</p></div>
              <div><span className="text-xs text-gray-500">CPF</span><p className="font-medium">{detailModal.cpf || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Nascimento</span><p className="font-medium">{detailModal.birthDate || "—"}</p></div>
              <div><span className="text-xs text-gray-500">Status</span><p className="font-medium">{detailModal.active !== false ? "Ativo" : "Inativo"}</p></div>
              <div><span className="text-xs text-gray-500">Fidelidade</span><p className="font-medium">{detailModal.loyaltyPoints ?? 0} pts ({detailModal.loyaltyTier || "BRONZE"})</p></div>
              <div><span className="text-xs text-gray-500">Visitas</span><p className="font-medium">{detailModal.totalVisits ?? 0}</p></div>
              <div><span className="text-xs text-gray-500">Total Gasto</span><p className="font-medium text-[#E94560]">R$ {detailModal.totalSpent?.toFixed(2) || "0.00"}</p></div>
            </div>
            {detailModal.notes && <div><span className="text-xs text-gray-500">Observações</span><p className="text-sm mt-1">{detailModal.notes}</p></div>}
            {(detailModal as any).address && ((detailModal as any).address.street || (detailModal as any).address.city) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Endereço</p>
                <p className="font-medium text-sm">
                  {[(detailModal as any).address.street, (detailModal as any).address.number ? `nº ${(detailModal as any).address.number}` : null, (detailModal as any).address.neighborhood, (detailModal as any).address.city, (detailModal as any).address.state, (detailModal as any).address.cep].filter(Boolean).join(", ")}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              <button onClick={() => { setLoyaltyModal({ clientId: detailModal.idClient, action: "add" }); setLoyaltyAmount(""); }} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs flex items-center gap-1"><FaStar /> + Pontos</button>
              <button onClick={() => { setLoyaltyModal({ clientId: detailModal.idClient, action: "redeem" }); setLoyaltyAmount(""); }} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs flex items-center gap-1"><FaGift /> Resgatar</button>
              <button onClick={() => registerVisit(detailModal.idClient)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs flex items-center gap-1"><FaHistory /> Visita</button>
              <button onClick={() => getLoyaltyDiscount(detailModal.idClient)} className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs flex items-center gap-1"><FaGift /> Desconto</button>
            </div>
            {/* Preferred barber */}
            <div className="pt-3 border-t">
              <label className="text-xs text-gray-500 block mb-1">Barbeiro Preferido</label>
              <select onChange={(e) => { if (e.target.value) setPreferredBarber(detailModal.idClient, parseInt(e.target.value)); }} className="gobarber-input text-sm w-auto">
                <option value="">Definir barbeiro preferido</option>
                {barbers.map(b => <option key={b.idBarber} value={b.idBarber}>{b.name || `#${b.idBarber}`}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Fidelidade */}
      <Modal isOpen={!!loyaltyModal} onClose={() => setLoyaltyModal(null)} title={loyaltyModal?.action === "add" ? "Adicionar Pontos" : "Resgatar Pontos"}>
        {loyaltyModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de pontos</label>
              <input type="number" min="1" value={loyaltyAmount} onChange={(e) => setLoyaltyAmount(e.target.value)} className="gobarber-input" placeholder="Ex: 100" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setLoyaltyModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={() => {
                const pts = parseInt(loyaltyAmount);
                if (!pts || pts <= 0) { toast.error("Informe a quantidade"); return; }
                if (loyaltyModal.action === "add") addLoyaltyPoints(loyaltyModal.clientId, pts);
                else redeemLoyaltyPoints(loyaltyModal.clientId, pts);
              }} className="gobarber-btn-primary">
                {loyaltyModal.action === "add" ? "Adicionar" : "Resgatar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}
