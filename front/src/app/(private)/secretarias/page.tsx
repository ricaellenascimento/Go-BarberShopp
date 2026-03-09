"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaEye, FaCamera, FaUser } from "react-icons/fa";
import { useRoles } from "@/hooks";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface Secretary {
  idSecretary: number;
  name?: string;
  email?: string;
  contact?: string;
  cpf?: string;
  salary?: number;
  admissionDate?: string;
  workload?: number;
  start?: string;
  end?: string;
  address?: { idAddress?: number; street?: string; number?: number; neighborhood?: string; city?: string; state?: string; cep?: string };
}

const initialForm = {
  name: "",
  email: "",
  contact: "",
  cpf: "",
  password: "",
  salary: "",
  admissionDate: "",
  workload: "",
  start: "",
  end: "",
  address: { street: "", number: 0, neighborhood: "", city: "", state: "", cep: "" },
};

export default function SecretariasPage() {
  const { hasRole } = useRoles();
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailSecretary, setDetailSecretary] = useState<Secretary | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loggedSecretary, setLoggedSecretary] = useState<Secretary | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => { loadSecretaries(); if (hasRole("SECRETARY")) loadLoggedSecretary(); }, []);

  async function loadSecretaries() {
    setLoading(true);
    try {
      const response = await generica({ metodo: "GET", uri: "/secretary", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      setSecretaries(Array.isArray(data) ? data : []);
    } catch { toast.error("Erro ao carregar secretárias"); }
    finally { setLoading(false); }
  }

  // GET /secretary/logged-secretary — get logged secretary profile
  async function loadLoggedSecretary() {
    try {
      const res = await generica({ metodo: "GET", uri: "/secretary/logged-secretary" });
      if (res?.data) setLoggedSecretary(res.data);
    } catch { /* not a secretary */ }
  }

  // GET /secretary/{id} — view secretary detail
  async function viewDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/secretary/${id}` });
      setDetailSecretary(res?.data || null);
      loadSecretaryPhoto(id);
    } catch { toast.error("Erro ao carregar detalhe"); }
  }

  // GET /secretary/{id}/profile-photo — get secretary photo
  async function loadSecretaryPhoto(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/secretary/${id}/profile-photo`, responseType: "blob" });
      if (res?.status === 200 && res?.data) {
        const url = URL.createObjectURL(res.data instanceof Blob ? res.data : new Blob([res.data]));
        setProfilePhoto(url);
      } else { setProfilePhoto(null); }
    } catch { setProfilePhoto(null); }
  }

  // GET /secretary/logged-secretary/picture — get logged secretary photo
  async function loadLoggedSecretaryPicture() {
    try {
      const res = await generica({ metodo: "GET", uri: "/secretary/logged-secretary/picture", responseType: "blob" });
      if (res?.status === 200 && res?.data) {
        const url = URL.createObjectURL(res.data instanceof Blob ? res.data : new Blob([res.data]));
        setProfilePhoto(url);
      }
    } catch { /* no photo */ }
  }

  function openCreate() { setForm(initialForm); setEditingId(null); setModalOpen(true); }

  function openEdit(s: Secretary) {
    setForm({
      name: s.name || "",
      email: s.email || "",
      contact: formatPhoneBR(s.contact || ""),
      cpf: s.cpf || "",
      password: "",
      salary: s.salary != null ? String(s.salary) : "",
      admissionDate: s.admissionDate || "",
      workload: s.workload != null ? String(s.workload) : "",
      start: s.start || "",
      end: s.end || "",
      address: {
        street: s.address?.street || "",
        number: s.address?.number || 0,
        neighborhood: s.address?.neighborhood || "",
        city: s.address?.city || "",
        state: s.address?.state || "",
        cep: s.address?.cep || "",
      },
    });
    setEditingId(s.idSecretary);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Nome e email são obrigatórios"); return; }
    setSaving(true);
    // Sanitize CEP: strip non-digits (DB column is varchar(8))
    const sanitizedForm = {
      ...form,
      address: { ...form.address, cep: form.address.cep?.replace(/\D/g, "").substring(0, 8) || "" },
    };
    try {
      if (editingId) {
        // Update usa multipart — enviar como JSON string
        const formData = new FormData();
        const secretaryData = { ...sanitizedForm,
          salary: sanitizedForm.salary ? parseFloat(String(sanitizedForm.salary)) : 0,
          workload: sanitizedForm.workload ? parseInt(String(sanitizedForm.workload), 10) : 0,
          contact: sanitizedForm.contact ? onlyDigits(sanitizedForm.contact) : "",
        };
        if (!secretaryData.password) {
          const { password, ...rest } = secretaryData;
          formData.append("secretary", JSON.stringify(rest));
        } else {
          formData.append("secretary", JSON.stringify(secretaryData));
        }
        if (photoFile) formData.append("profilePhoto", photoFile);
        const res = await generica({
          metodo: "PUT",
          uri: `/secretary/${editingId}`,
          data: formData,
        });
        if (res?.status === 200) { toast.success("Secretária atualizada!"); setModalOpen(false); loadSecretaries(); }
        else toast.error("Erro ao atualizar");
      } else {
        if (!sanitizedForm.password) { toast.error("Senha é obrigatória para novo cadastro"); setSaving(false); return; }
        // POST /secretary (multipart with photo)
        const formData = new FormData();
        const cleanedSecretary = {
          ...sanitizedForm,
          salary: sanitizedForm.salary ? parseFloat(String(sanitizedForm.salary)) : 0,
          workload: sanitizedForm.workload ? parseInt(String(sanitizedForm.workload), 10) : 0,
          contact: sanitizedForm.contact ? onlyDigits(sanitizedForm.contact) : "",
        };
        formData.append("secretary", JSON.stringify(cleanedSecretary));
        if (photoFile) formData.append("profilePhoto", photoFile);
        const res = await generica({
          metodo: "POST",
          uri: "/secretary",
          data: formData,
        });
        if (res?.status === 200 || res?.status === 201) { toast.success("Secretária cadastrada!"); setModalOpen(false); loadSecretaries(); }
        else toast.error(res?.data?.message || "Erro ao cadastrar");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar secretária");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir esta secretária?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({ metodo: "DELETE", uri: `/secretary/${id}` });
      if (res?.status === 200 || res?.status === 204) { toast.success("Secretária excluída!"); loadSecretaries(); }
      else toast.error("Erro ao excluir");
    } catch { toast.error("Erro ao excluir secretária"); }
  }

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Secretárias</h1>
          <button onClick={openCreate} className="gobarber-btn-primary flex items-center gap-2">
            <FaPlus /> Nova Secretária
          </button>
        </div>

        <div className="gobarber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Telefone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">CPF</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : secretaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <FaUserShield className="mx-auto text-4xl mb-3 text-gray-300" />
                    Nenhuma secretária cadastrada
                  </td>
                </tr>
              ) : (
                secretaries.map((s) => (
                  <tr key={s.idSecretary} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{s.name || "—"}</td>
                    <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{s.email || "—"}</td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{s.contact ? formatPhoneBR(s.contact) : "—"}</td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{s.cpf || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => viewDetail(s.idSecretary)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Detalhes"><FaEye /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Editar"><FaEdit /></button>
                        <button onClick={() => handleDelete(s.idSecretary)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Secretária" : "Nova Secretária"}>
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
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: formatPhoneBR(e.target.value) })}
                className="gobarber-input"
                placeholder="(81) 99999-9999"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
              <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })} className="gobarber-input" placeholder="00000000000" maxLength={11} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário *</label>
              <input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="gobarber-input" placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária (h/semana)</label>
              <input type="number" value={form.workload} onChange={(e) => setForm({ ...form, workload: e.target.value })} className="gobarber-input" placeholder="40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início Expediente</label>
              <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="gobarber-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim Expediente</label>
              <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="gobarber-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Admissão</label>
              <input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} className="gobarber-input" />
            </div>
          </div>
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="gobarber-input" required={!editingId} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="gobarber-input" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Endereço</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Rua" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="gobarber-input" />
              <input type="number" placeholder="Número" value={form.address.number || ""} onChange={(e) => setForm({ ...form, address: { ...form.address, number: parseInt(e.target.value) || 0 } })} className="gobarber-input" />
              <input type="text" placeholder="Bairro" value={form.address.neighborhood} onChange={(e) => setForm({ ...form, address: { ...form.address, neighborhood: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="Cidade" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="Estado" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="CEP" maxLength={9} value={form.address.cep} onChange={(e) => { const digits = e.target.value.replace(/\D/g, "").substring(0, 8); const fmt = digits.length > 5 ? digits.substring(0, 5) + "-" + digits.substring(5) : digits; setForm({ ...form, address: { ...form.address, cep: fmt } }); }} className="gobarber-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">{saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhe Secretária */}
      <Modal isOpen={!!detailSecretary} onClose={() => { setDetailSecretary(null); setProfilePhoto(null); }} title="Detalhe da Secretária">
        {detailSecretary && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {profilePhoto ? (
                <img src={profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E94560] to-[#0F3460] flex items-center justify-center text-white text-xl"><FaUser /></div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-[#1A1A2E]">{detailSecretary.name}</h3>
                <p className="text-sm text-gray-500">{detailSecretary.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Telefone</p><p className="font-medium">{detailSecretary.contact ? formatPhoneBR(detailSecretary.contact) : "—"}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">CPF</p><p className="font-medium">{detailSecretary.cpf || "—"}</p></div>
              {detailSecretary.salary != null && (
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Salário</p><p className="font-medium">R$ {Number(detailSecretary.salary).toFixed(2)}</p></div>
              )}
              {detailSecretary.workload != null && (
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Carga Horária</p><p className="font-medium">{detailSecretary.workload}h</p></div>
              )}
              {(detailSecretary.start || detailSecretary.end) && (
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Horário</p><p className="font-medium">{detailSecretary.start || "—"} - {detailSecretary.end || "—"}</p></div>
              )}
              {detailSecretary.admissionDate && (
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Data Admissão</p><p className="font-medium">{detailSecretary.admissionDate}</p></div>
              )}
              {detailSecretary.address && (detailSecretary.address.street || detailSecretary.address.city) && (
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="font-medium">{[detailSecretary.address.street, detailSecretary.address.number ? `nº ${detailSecretary.address.number}` : null, detailSecretary.address.neighborhood, detailSecretary.address.city, detailSecretary.address.state, detailSecretary.address.cep].filter(Boolean).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}
