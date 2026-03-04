"use client";
import { useState, useEffect, useCallback } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import {
  FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff,
  FaSearch, FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaClock, FaUsers, FaTimes, FaEye, FaUserPlus, FaUserMinus, FaFilter
} from "react-icons/fa";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface BarbershopData {
  idBarbershop: number;
  name: string;
  slug: string;
  description: string;
  cnpj: string;
  phone: string;
  email: string;
  logoUrl: string;
  bannerUrl: string;
  openingHours: string;
  active: boolean;
  street: string;
  number: number | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  createdAt: string;
  updatedAt: string;
}

interface BarbershopForm {
  name: string;
  slug: string;
  description: string;
  cnpj: string;
  phone: string;
  email: string;
  logoUrl: string;
  bannerUrl: string;
  openingHours: string;
  street: string;
  number: number | string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

const emptyForm: BarbershopForm = {
  name: "", slug: "", description: "", cnpj: "", phone: "", email: "",
  logoUrl: "", bannerUrl: "", openingHours: "",
  street: "", number: "", neighborhood: "", city: "", state: "", cep: "",
};

export default function BarbeariasPage() {
  const [barbershops, setBarbershops] = useState<BarbershopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BarbershopForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailShop, setDetailShop] = useState<BarbershopData | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [shopClients, setShopClients] = useState<any[]>([]);
  const [newClientId, setNewClientId] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);

  const loadBarbershops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/barbershop" });
      if (res?.data) {
        setBarbershops(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error("Erro ao carregar barbearias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBarbershops(); }, [loadBarbershops]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(shop: BarbershopData) {
    setEditingId(shop.idBarbershop);
    setForm({
      name: shop.name || "",
      slug: shop.slug || "",
      description: shop.description || "",
      cnpj: shop.cnpj || "",
      phone: formatPhoneBR(shop.phone || ""),
      email: shop.email || "",
      logoUrl: shop.logoUrl || "",
      bannerUrl: shop.bannerUrl || "",
      openingHours: shop.openingHours || "",
      street: shop.street || "",
      number: shop.number ?? "",
      neighborhood: shop.neighborhood || "",
      city: shop.city || "",
      state: shop.state || "",
      cep: shop.cep || "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        number: form.number ? Number(form.number) : null,
        cep: form.cep ? form.cep.replace(/\D/g, "").substring(0, 8) : "",
        ...(form.slug?.trim() ? { slug: form.slug.trim() } : {}),
        ...(form.description?.trim() ? { description: form.description.trim() } : {}),
        ...(form.cnpj?.trim() ? { cnpj: form.cnpj.trim() } : {}),
        ...(form.phone?.trim() ? { phone: onlyDigits(form.phone) } : {}),
        ...(form.email?.trim() ? { email: form.email.trim() } : {}),
        ...(form.logoUrl?.trim() ? { logoUrl: form.logoUrl.trim() } : {}),
        ...(form.bannerUrl?.trim() ? { bannerUrl: form.bannerUrl.trim() } : {}),
        ...(form.openingHours?.trim() ? { openingHours: form.openingHours.trim() } : {}),
        ...(form.street?.trim() ? { street: form.street.trim() } : {}),
        ...(form.neighborhood?.trim() ? { neighborhood: form.neighborhood.trim() } : {}),
        ...(form.city?.trim() ? { city: form.city.trim() } : {}),
        ...(form.state?.trim() ? { state: form.state.trim() } : {}),
      };

      if (editingId) {
        const res = await generica({ metodo: "PUT", uri: `/barbershop/${editingId}`, data: payload });
        if (res?.status === 200) {
          toast.success("Barbearia atualizada!");
          setModalOpen(false);
          loadBarbershops();
        } else { toast.error("Erro ao atualizar"); }
      } else {
        const res = await generica({ metodo: "POST", uri: "/barbershop", data: payload });
        if (res?.status === 201 || res?.status === 200) {
          toast.success("Barbearia cadastrada!");
          setModalOpen(false);
          loadBarbershops();
        } else { toast.error("Erro ao cadastrar"); }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir esta barbearia?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/barbershop/${id}` });
      if (res?.status === 200 || res?.status === 204) { toast.success("Barbearia excluída"); loadBarbershops(); }
      else toast.error("Erro ao excluir");
    } catch { toast.error("Erro ao excluir"); }
  }

  async function handleToggle(id: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/barbershop/${id}/toggle` });
      if (res?.status === 200) {
        toast.success("Status atualizado");
        loadBarbershops();
      }
    } catch { toast.error("Erro ao alterar status"); }
  }

  async function loadActiveBarbershops() {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: "/barbershop/active" });
      if (res?.data) setBarbershops(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error("Erro ao carregar barbearias ativas"); }
    finally { setLoading(false); }
  }

  async function viewBarbershopDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/barbershop/${id}` });
      if (res?.data) setDetailShop(res.data);
    } catch { toast.error("Erro ao carregar detalhes"); }
  }

  async function searchByName(name: string) {
    if (!name.trim()) { loadBarbershops(); return; }
    try {
      const res = await generica({ metodo: "GET", uri: "/barbershop/search", params: { name } });
      if (res?.data) setBarbershops(Array.isArray(res.data) ? res.data : []);
    } catch { /* usa filtro local */ }
  }

  async function viewBySlug(slug: string) {
    try {
      const res = await generica({ metodo: "GET", uri: `/barbershop/slug/${slug}` });
      if (res?.data) setDetailShop(res.data);
    } catch { toast.error("Barbearia não encontrada"); }
  }

  async function loadClientBarbershops(clientId: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/barbershop/client/${clientId}` });
      return Array.isArray(res?.data) ? res.data : [];
    } catch { return []; }
  }

  async function addClientToBarbershop(barbershopId: number, clientId: number) {
    try {
      const res = await generica({ metodo: "POST", uri: `/barbershop/${barbershopId}/client/${clientId}` });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Cliente vinculado!");
      } else toast.error("Erro ao vincular cliente");
    } catch { toast.error("Erro ao vincular cliente"); }
  }

  async function removeClientFromBarbershop(barbershopId: number, clientId: number) {
    const result = await Swal.fire({
      title: "Remover cliente?",
      text: "Deseja remover este cliente da barbearia?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/barbershop/${barbershopId}/client/${clientId}` });
      if (res?.status === 200 || res?.status === 204) {
        toast.success("Cliente removido da barbearia");
      } else toast.error("Erro ao remover cliente");
    } catch { toast.error("Erro ao remover cliente"); }
  }

  const filtered = barbershops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <GoBarberLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaStore className="text-yellow-400" /> Barbearias
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as barbearias cadastradas no sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition"
        >
          <FaPlus /> Nova Barbearia
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value.length > 2) searchByName(e.target.value); else if (!e.target.value) loadBarbershops(); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        <button
          onClick={() => { setShowActiveOnly(!showActiveOnly); if (!showActiveOnly) loadActiveBarbershops(); else loadBarbershops(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${showActiveOnly ? "bg-green-600 border-green-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"}`}
        >
          <FaFilter /> Ativas
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <FaStore className="text-5xl mx-auto mb-3 opacity-30" />
          <p>Nenhuma barbearia encontrada</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(shop => (
            <div
              key={shop.idBarbershop}
              className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-yellow-500/50 transition"
            >
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-yellow-600/30 to-gray-900 relative">
                {shop.bannerUrl && (
                  <img src={shop.bannerUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${shop.active ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                    {shop.active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                {/* Logo */}
                <div className="absolute -bottom-6 left-4">
                  <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center overflow-hidden">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-yellow-400 text-xl font-bold">{shop.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 pt-8">
                <h3 className="text-lg font-bold text-white">{shop.name}</h3>
                {shop.description && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{shop.description}</p>
                )}

                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  {(shop.city || shop.neighborhood) && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-yellow-400 flex-shrink-0" />
                      <span>{[shop.neighborhood, shop.city, shop.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-yellow-400 flex-shrink-0" />
                      <span>{formatPhoneBR(shop.phone)}</span>
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-yellow-400 flex-shrink-0" />
                      <span>{shop.email}</span>
                    </div>
                  )}
                  {shop.openingHours && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-yellow-400 flex-shrink-0" />
                      <span>{shop.openingHours}</span>
                    </div>
                  )}
                </div>

                {/* Expandable details */}
                {expandedId === shop.idBarbershop && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-sm text-gray-400">
                    {shop.cnpj && <p><span className="text-gray-500">CNPJ:</span> {shop.cnpj}</p>}
                    {shop.street && <p><span className="text-gray-500">Endereço:</span> {shop.street}{shop.number ? `, ${shop.number}` : ""}</p>}
                    {shop.cep && <p><span className="text-gray-500">CEP:</span> {shop.cep}</p>}
                    <p><span className="text-gray-500">Slug:</span> {shop.slug}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === shop.idBarbershop ? null : shop.idBarbershop)}
                    className="text-xs text-yellow-400 hover:underline"
                  >
                    {expandedId === shop.idBarbershop ? "Menos" : "Mais detalhes"}
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => viewBarbershopDetail(shop.idBarbershop)} title="Detalhes"
                    className="p-2 rounded hover:bg-gray-700 transition text-cyan-400">
                    <FaEye />
                  </button>
                  <button onClick={() => handleToggle(shop.idBarbershop)} title={shop.active ? "Desativar" : "Ativar"}
                    className="p-2 rounded hover:bg-gray-700 transition">
                    {shop.active ? <FaToggleOn className="text-green-400 text-lg" /> : <FaToggleOff className="text-gray-500 text-lg" />}
                  </button>
                  <button onClick={() => openEdit(shop)} title="Editar"
                    className="p-2 rounded hover:bg-gray-700 transition text-blue-400">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(shop.idBarbershop)} title="Excluir"
                    className="p-2 rounded hover:bg-gray-700 transition text-red-400">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Detalhes da Barbearia</h2>
              <button onClick={() => setDetailShop(null)} className="text-gray-400 hover:text-white"><FaTimes size={20} /></button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p><span className="text-gray-500">Nome:</span> {detailShop.name}</p>
              <p><span className="text-gray-500">Slug:</span> {detailShop.slug}</p>
              <p><span className="text-gray-500">CNPJ:</span> {detailShop.cnpj || "—"}</p>
              <p><span className="text-gray-500">Telefone:</span> {detailShop.phone ? formatPhoneBR(detailShop.phone) : "—"}</p>
              <p><span className="text-gray-500">Email:</span> {detailShop.email || "—"}</p>
              <p><span className="text-gray-500">Horário:</span> {detailShop.openingHours || "—"}</p>
              <p><span className="text-gray-500">Endereço:</span> {[detailShop.street, detailShop.number, detailShop.neighborhood, detailShop.city, detailShop.state].filter(Boolean).join(", ") || "—"}</p>
              <p><span className="text-gray-500">CEP:</span> {detailShop.cep || "—"}</p>
              <p><span className="text-gray-500">Status:</span> <span className={detailShop.active ? "text-green-400" : "text-red-400"}>{detailShop.active ? "Ativa" : "Inativa"}</span></p>
              {detailShop.description && <p><span className="text-gray-500">Descrição:</span> {detailShop.description}</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2"><FaUsers /> Gerenciar Clientes</h4>
              <div className="flex gap-2 mb-3">
                <input type="number" placeholder="ID do Cliente" value={newClientId} onChange={e => setNewClientId(e.target.value)} className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm" />
                <button onClick={() => { if (newClientId) { addClientToBarbershop(detailShop.idBarbershop, parseInt(newClientId)); setNewClientId(""); } }} className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"><FaUserPlus /> Vincular</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Editar Barbearia" : "Nova Barbearia"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug (URL)</label>
                  <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                    placeholder="gerado automaticamente"
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                  <input value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: formatPhoneBR(e.target.value)})}
                    maxLength={15}
                    placeholder="(81) 99999-9999"
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Horário de Funcionamento</label>
                  <input value={form.openingHours} onChange={e => setForm({...form, openingHours: e.target.value})}
                    placeholder="Seg-Sex 9h-20h, Sáb 9h-18h"
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">URL do Logo</label>
                  <input value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">URL do Banner</label>
                  <input value={form.bannerUrl} onChange={e => setForm({...form, bannerUrl: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>

              {/* Endereço */}
              <h3 className="text-white font-semibold mt-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-yellow-400" /> Endereço
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Rua</label>
                  <input value={form.street} onChange={e => setForm({...form, street: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Número</label>
                  <input type="number" value={form.number} onChange={e => setForm({...form, number: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bairro</label>
                  <input value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cidade</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Estado</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} maxLength={2}
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CEP</label>
                  <input value={form.cep} onChange={e => { const digits = e.target.value.replace(/\D/g, "").substring(0, 8); const fmt = digits.length > 5 ? digits.substring(0, 5) + "-" + digits.substring(5) : digits; setForm({...form, cep: fmt}); }} maxLength={9} placeholder="00000-000"
                    className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold disabled:opacity-50 transition">
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </GoBarberLayout>
  );
}
