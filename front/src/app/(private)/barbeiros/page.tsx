"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaEye, FaCamera, FaUser, FaLink, FaUnlink } from "react-icons/fa";
import { useRoles } from "@/hooks";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface Barber {
  idBarber: number;
  name?: string;
  email?: string;
  cpf?: string;
  contato?: string;
  start?: string;
  end?: string;
  salary?: number;
  admissionDate?: string;
  workload?: number;
  active?: boolean;
  services?: { id: number; name: string }[];
  address?: { idAddress?: number; street?: string; number?: number; neighborhood?: string; city?: string; state?: string; cep?: string };
}

const initialForm = {
  email: "",
  password: "",
  name: "",
  cpf: "",
  contato: "",
  start: "08:00",
  end: "18:00",
  salary: 0,
  admissionDate: new Date().toISOString().split("T")[0],
  workload: 44,
  address: { street: "", number: 0, neighborhood: "", city: "", state: "", cep: "" },
  idServices: [] as number[],
};

export default function BarbeirosPage() {
  const { hasRole } = useRoles();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Barber | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [availableServices, setAvailableServices] = useState<{ id: number; name: string }[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [barberPhoto, setBarberPhoto] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loggedBarber, setLoggedBarber] = useState<Barber | null>(null);
  const [loggedBarberPic, setLoggedBarberPic] = useState<string | null>(null);

  useEffect(() => {
    loadBarbers();
    loadServices();
    if (hasRole("BARBER")) loadLoggedBarber();
  }, []);

  async function loadBarbers() {
    setLoading(true);
    try {
      const response = await generica({ metodo: "GET", uri: "/barber", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      setBarbers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar barbeiros");
    } finally {
      setLoading(false);
    }
  }

  async function loadServices() {
    try {
      const response = await generica({ metodo: "GET", uri: "/services", params: { page: 0, size: 100 } });
      const data = response?.data?.content || response?.data || [];
      setAvailableServices(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function viewBarberDetail(id: number) {
    setLoadingDetail(true);
    setBarberPhoto(null);
    try {
      const response = await generica({ metodo: "GET", uri: `/barber/${id}` });
      if (response?.data) {
        setDetailModal(response.data);
        loadBarberPhoto(id);
      }
    } catch {
      toast.error("Erro ao carregar detalhes do barbeiro");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function loadBarberPhoto(id: number) {
    try {
      const response = await generica({ metodo: "GET", uri: `/barber/${id}/profile-photo`, responseType: "blob" });
      if (response?.status === 200 && response?.data) {
        const url = URL.createObjectURL(response.data instanceof Blob ? response.data : new Blob([response.data]));
        setBarberPhoto(url);
      } else {
        setBarberPhoto(null);
      }
    } catch { setBarberPhoto(null); }
  }

  async function loadLoggedBarber() {
    try {
      const response = await generica({ metodo: "GET", uri: "/barber/logged-barber" });
      if (response?.data) {
        setLoggedBarber(response.data);
        loadLoggedBarberPicture();
      }
    } catch { /* não é barbeiro logado */ }
  }

  async function loadLoggedBarberPicture() {
    try {
      const response = await generica({ metodo: "GET", uri: "/barber/logged-barber/picture", responseType: "blob" });
      if (response?.status === 200 && response?.data) {
        const url = URL.createObjectURL(response.data instanceof Blob ? response.data : new Blob([response.data]));
        setLoggedBarberPic(url);
      } else {
        setLoggedBarberPic(null);
      }
    } catch { setLoggedBarberPic(null); }
  }

  async function addServiceToBarber(barberId: number, serviceId: number) {
    try {
      const response = await generica({ metodo: "POST", uri: "/barber/service", data: { idBarber: barberId, idServices: [serviceId] } });
      if (response?.status === 200 || response?.status === 201) {
        toast.success("Serviço adicionado ao barbeiro!");
        loadBarbers();
        if (detailModal?.idBarber === barberId) viewBarberDetail(barberId);
      } else {
        toast.error("Erro ao adicionar serviço");
      }
    } catch {
      toast.error("Erro ao adicionar serviço");
    }
  }

  async function removeServiceFromBarber(barberId: number, serviceId: number) {
    const result = await Swal.fire({
      title: "Remover serviço?",
      text: "Deseja remover este serviço do barbeiro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await generica({ metodo: "POST", uri: "/barber/service/remove", params: { barber: barberId, service: serviceId } });
      if (response?.status === 200 || response?.status === 204) {
        toast.success("Serviço removido do barbeiro!");
        loadBarbers();
        if (detailModal?.idBarber === barberId) viewBarberDetail(barberId);
      } else {
        toast.error("Erro ao remover serviço");
      }
    } catch {
      toast.error("Erro ao remover serviço");
    }
  }

  function openCreate() {
    setForm(initialForm);
    setEditingId(null);
    setPhotoFile(null);
    setModalOpen(true);
  }

  function openEdit(barber: Barber) {
    setForm({
      email: barber.email || "",
      password: "",
      name: barber.name || "",
      cpf: barber.cpf || "",
      contato: formatPhoneBR(barber.contato || ""),
      start: barber.start || "08:00",
      end: barber.end || "18:00",
      salary: barber.salary || 0,
      admissionDate: barber.admissionDate || new Date().toISOString().split("T")[0],
      workload: barber.workload || 44,
      address: {
        street: barber.address?.street || "",
        number: barber.address?.number || 0,
        neighborhood: barber.address?.neighborhood || "",
        city: barber.address?.city || "",
        state: barber.address?.state || "",
        cep: barber.address?.cep || "",
      },
      idServices: barber.services?.map((s) => s.id) || [],
    });
    setEditingId(barber.idBarber);
    setPhotoFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.cpf || !form.email) {
      toast.error("Preencha nome, CPF e email");
      return;
    }
    setSaving(true);
    // Sanitize CEP: strip non-digits (DB column is varchar(8))
    const cleanForm = {
      ...form,
      contato: form.contato ? onlyDigits(form.contato) : "",
      address: { ...form.address, cep: form.address.cep?.replace(/\D/g, "").substring(0, 8) || "" },
    };
    try {
      if (editingId) {
        const formData = new FormData();
        const barberBlob = new Blob([JSON.stringify(cleanForm)], { type: "application/json" });
        formData.append("barber", barberBlob);
        if (photoFile) formData.append("profilePhoto", photoFile);
        const response = await generica({ metodo: "PUT", uri: `/barber/${editingId}`, data: formData });
        if (response?.status === 200) {
          toast.success("Barbeiro atualizado!");
          setModalOpen(false);
          loadBarbers();
        } else {
          toast.error("Erro ao atualizar barbeiro");
        }
      } else {
        let response;
        if (photoFile) {
          const formData = new FormData();
          const barberBlob = new Blob([JSON.stringify(cleanForm)], { type: "application/json" });
          formData.append("barber", barberBlob);
          formData.append("profilePhoto", photoFile);
          response = await generica({ metodo: "POST", uri: "/barber", data: formData });
        } else {
          response = await generica({ metodo: "POST", uri: "/barber/create-without-photo", data: cleanForm });
        }
        if (response?.status === 200 || response?.status === 201) {
          toast.success("Barbeiro cadastrado!");
          setModalOpen(false);
          loadBarbers();
        } else {
          toast.error(response?.data?.message || "Erro ao cadastrar barbeiro");
        }
      }
    } catch {
      toast.error("Erro ao salvar barbeiro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Deseja realmente excluir este barbeiro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await generica({ metodo: "DELETE", uri: `/barber/${id}` });
      if (response?.status === 200 || response?.status === 204) {
        toast.success("Barbeiro excluído!");
        loadBarbers();
      } else {
        toast.error("Erro ao excluir barbeiro");
      }
    } catch {
      toast.error("Erro ao excluir barbeiro");
    }
  }

  const filtered = barbers.filter(
    (b) =>
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.cpf?.includes(search)
  );

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Barbeiros</h1>
          <button onClick={openCreate} className="gobarber-btn-primary flex items-center gap-2">
            <FaPlus /> Novo Barbeiro
          </button>
        </div>

        <div className="gobarber-card">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar barbeiros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="gobarber-input pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="gobarber-card animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              Nenhum barbeiro encontrado
            </div>
          ) : (
            filtered.map((barber) => (
              <div key={barber.idBarber} className="gobarber-card hover:border-[#E94560]/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#1A1A2E] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {barber.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A2E]">{barber.name || "Sem nome"}</h3>
                    <p className="text-sm text-gray-500">{barber.email || ""}</p>
                  </div>
                </div>
                {barber.contato && (
                  <p className="text-sm text-gray-600 mb-3">📞 {formatPhoneBR(barber.contato)}</p>
                )}
                {barber.services && barber.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {barber.services.slice(0, 3).map((s) => (
                      <span key={s.id} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">
                        {s.name}
                      </span>
                    ))}
                    {barber.services.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                        +{barber.services.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${barber.active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {barber.active !== false ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => viewBarberDetail(barber.idBarber)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Visualizar">
                      <FaEye />
                    </button>
                    <button onClick={() => openEdit(barber)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Editar">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(barber.idBarber)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Barbeiro" : "Novo Barbeiro"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="gobarber-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
              <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })} className="gobarber-input" maxLength={11} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="gobarber-input" required />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="gobarber-input" required={!editingId} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
              <input
                type="text"
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: formatPhoneBR(e.target.value) })}
                className="gobarber-input"
                maxLength={15}
                placeholder="(81) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salário</label>
              <input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })} className="gobarber-input" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária (h/sem)</label>
              <input type="number" value={form.workload} onChange={(e) => setForm({ ...form, workload: parseInt(e.target.value) || 0 })} className="gobarber-input" />
            </div>
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Endereço</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Rua" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="gobarber-input" />
              <input type="number" placeholder="Número" value={form.address.number || ""} onChange={(e) => setForm({ ...form, address: { ...form.address, number: parseInt(e.target.value) || 0 } })} className="gobarber-input" />
              <input type="text" placeholder="Bairro" value={form.address.neighborhood} onChange={(e) => setForm({ ...form, address: { ...form.address, neighborhood: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="Cidade" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="gobarber-input" />
              <input type="text" placeholder="Estado (UF)" maxLength={2} value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value.toUpperCase() } })} className="gobarber-input" />
              <input type="text" placeholder="CEP" maxLength={9} value={form.address.cep} onChange={(e) => { const digits = e.target.value.replace(/\D/g, "").substring(0, 8); const fmt = digits.length > 5 ? digits.substring(0, 5) + "-" + digits.substring(5) : digits; setForm({ ...form, address: { ...form.address, cep: fmt } }); }} className="gobarber-input" />
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm">
                <FaCamera className="text-gray-500" />
                {photoFile ? photoFile.name : "Selecionar foto"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              </label>
              {photoFile && <button type="button" onClick={() => setPhotoFile(null)} className="text-red-500 text-sm">Remover</button>}
            </div>
          </div>

          {availableServices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serviços</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableServices.map((s) => (
                  <label key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${form.idServices.includes(s.id) ? "bg-[#E94560] text-white border-[#E94560]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.idServices.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, idServices: [...form.idServices, s.id] });
                        } else {
                          setForm({ ...form, idServices: form.idServices.filter((id) => id !== s.id) });
                        }
                      }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="gobarber-btn-primary">
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes */}
      <Modal isOpen={!!detailModal} onClose={() => { setDetailModal(null); setBarberPhoto(null); }} title="Detalhes do Barbeiro">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {barberPhoto ? (
                <img src={barberPhoto} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-[#E94560]" />
              ) : (
                <div className="w-20 h-20 bg-[#1A1A2E] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  <FaUser />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">{detailModal.name}</h3>
                <p className="text-sm text-gray-500">{detailModal.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><strong>CPF:</strong> {detailModal.cpf}</p>
              <p><strong>Contato:</strong> {detailModal.contato ? formatPhoneBR(detailModal.contato) : "—"}</p>
              <p><strong>Salário:</strong> R$ {detailModal.salary?.toFixed(2) || "0.00"}</p>
              <p><strong>Expediente:</strong> {detailModal.start || "—"} às {detailModal.end || "—"}</p>
              <p><strong>Admissão:</strong> {detailModal.admissionDate || "—"}</p>
              <p><strong>Carga Horária:</strong> {detailModal.workload || "—"}h/sem</p>
            </div>
            {detailModal.address && (detailModal.address.street || detailModal.address.city) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Endereço</p>
                <p className="font-medium text-sm">
                  {[detailModal.address.street, detailModal.address.number ? `nº ${detailModal.address.number}` : null, detailModal.address.neighborhood, detailModal.address.city, detailModal.address.state, detailModal.address.cep].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm">Serviços vinculados:</strong>
              </div>
              {detailModal.services && detailModal.services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detailModal.services.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                      {s.name}
                      <button onClick={() => removeServiceFromBarber(detailModal.idBarber, s.id)} className="text-red-400 hover:text-red-600 ml-1" title="Remover serviço">
                        <FaUnlink size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Nenhum serviço vinculado</p>
              )}
              {availableServices.filter(s => !detailModal.services?.some(ds => ds.id === s.id)).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Adicionar serviço:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableServices.filter(s => !detailModal.services?.some(ds => ds.id === s.id)).map(s => (
                      <button key={s.id} onClick={() => addServiceToBarber(detailModal.idBarber, s.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                        <FaLink size={10} /> {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}
