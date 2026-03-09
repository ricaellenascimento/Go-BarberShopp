"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import {
  FaUser,
  FaPalette,
  FaShieldAlt,
  FaSave,
  FaBan,
  FaEdit,
  FaPlus,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaCheckCircle,
} from "react-icons/fa";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useRoles } from "@/hooks/useRoles";
import Swal from "sweetalert2";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

type UserRole = "ADMIN" | "BARBER" | "SECRETARY" | "CLIENT";
type ProfileSource = "AUTH" | "BARBER" | "SECRETARY" | "CLIENT";

interface CancellationRule {
  id: number;
  cancelDeadlineHours: number;
  cancellationFeePercentage: number;
  noShowFeePercentage: number;
  maxCancellationsPerMonth: number;
  allowReschedule: boolean;
  rescheduleDeadlineHours: number;
  penaltyAfterMaxCancellations: boolean;
  blockDaysAfterMaxCancellations: number;
  active: boolean;
}

interface ProfileFieldProps {
  label: string;
  value: string;
}

interface ProfileAddressForm {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

interface ProfileEditForm {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  gender: string;
  notes: string;
  receivePromotions: boolean;
  receiveReminders: boolean;
  address: ProfileAddressForm;
}

const EMPTY_ADDRESS_FORM: ProfileAddressForm = {
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  cep: "",
};

const EMPTY_PROFILE_FORM: ProfileEditForm = {
  name: "",
  email: "",
  cpf: "",
  phone: "",
  birthDate: "",
  gender: "",
  notes: "",
  receivePromotions: false,
  receiveReminders: false,
  address: EMPTY_ADDRESS_FORM,
};

const CLIENT_GENDER_OPTIONS = [
  { value: "", label: "Selecione" },
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
  { value: "OTHER", label: "Outro" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  BARBER: "Barbeiro",
  SECRETARY: "Secretaria",
  CLIENT: "Cliente",
};

const PROFILE_SOURCE_LABELS: Record<ProfileSource, string> = {
  AUTH: "Dados basicos",
  BARBER: "Tabela barber",
  SECRETARY: "Tabela secretary",
  CLIENT: "Tabela client",
};

function normalizeRole(role: string | undefined): UserRole {
  if (role === "ADMIN" || role === "BARBER" || role === "SECRETARY" || role === "CLIENT") {
    return role;
  }
  return "CLIENT";
}

function asText(value: unknown, fallback = "-"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function formatDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatCurrency(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(numberValue)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
}

function formatBoolean(value: unknown): string {
  if (typeof value !== "boolean") return "-";
  return value ? "Sim" : "Nao";
}

function formatGender(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "-";
  const normalized = text.toUpperCase();
  if (normalized === "MALE") return "Masculino";
  if (normalized === "FEMALE") return "Feminino";
  if (normalized === "OTHER") return "Outro";
  return text;
}

function formatAddress(address: Record<string, unknown> | undefined): string {
  if (!address) return "-";
  const street = asText(address.street, "");
  const number = asText(address.number, "");
  const neighborhood = asText(address.neighborhood, "");
  const city = asText(address.city, "");
  const state = asText(address.state, "");
  const cep = asText(address.cep, "");

  const parts = [
    street,
    number ? `No ${number}` : "",
    neighborhood,
    city,
    state,
    cep,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "-";
}

function formatPhone(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "-";
  const digits = onlyDigits(text);
  if (!digits) return text;
  return formatPhoneBR(digits);
}

function toDateInputValue(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function mapAddressToForm(address: Record<string, unknown> | undefined): ProfileAddressForm {
  if (!address) return { ...EMPTY_ADDRESS_FORM };
  return {
    street: asText(address.street, ""),
    number: asText(address.number, ""),
    neighborhood: asText(address.neighborhood, ""),
    city: asText(address.city, ""),
    state: asText(address.state, ""),
    cep: asText(address.cep, ""),
  };
}

function buildAddressPayload(address: ProfileAddressForm): Record<string, unknown> | null | undefined {
  const normalized = {
    street: address.street.trim(),
    number: address.number.trim(),
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    cep: onlyDigits(address.cep).slice(0, 8),
  };

  const hasAnyValue = Object.values(normalized).some((value) => value.length > 0);
  if (!hasAnyValue) return undefined;

  if (!normalized.street || !normalized.neighborhood || !normalized.city || !normalized.state) {
    return null;
  }

  const parsedNumber = Number(normalized.number);

  return {
    street: normalized.street,
    number: normalized.number && Number.isFinite(parsedNumber) ? parsedNumber : undefined,
    neighborhood: normalized.neighborhood,
    city: normalized.city,
    state: normalized.state,
    cep: normalized.cep,
  };
}

function createBlobUrl(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart]);
  return URL.createObjectURL(blob);
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={value} className="gobarber-input bg-gray-50" readOnly />
    </div>
  );
}

export default function ConfiguracoesPage() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const { mode, toggleMode } = useThemeContext();
  const { isAdmin } = useRoles();
  const [activeTab, setActiveTab] = useState("perfil");
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<ProfileSource>("AUTH");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileEditForm>({ ...EMPTY_PROFILE_FORM });

  // Cancellation Rules state
  const [rules, setRules] = useState<CancellationRule[]>([]);
  const [editingRule, setEditingRule] = useState<CancellationRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [activeRule, setActiveRule] = useState<CancellationRule | null>(null);
  const [detailRule, setDetailRule] = useState<CancellationRule | null>(null);

  // Security - password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    cancelDeadlineHours: 24,
    cancellationFeePercentage: 0,
    noShowFeePercentage: 100,
    maxCancellationsPerMonth: 3,
    allowReschedule: true,
    rescheduleDeadlineHours: 12,
    penaltyAfterMaxCancellations: true,
    blockDaysAfterMaxCancellations: 7,
  });

  useEffect(() => {
    if (activeTab === "cancelamento" && isAdmin) {
      loadRules();
      loadActiveRule();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === "perfil" && user) {
      loadRoleProfile();
    }
  }, [activeTab, user?.id, user?.email, user?.roles?.join("|")]);

  useEffect(() => {
    return () => {
      if (profilePhoto) {
        URL.revokeObjectURL(profilePhoto);
      }
    };
  }, [profilePhoto]);

  // GET /cancellation-rules/active - load currently active rule
  async function loadActiveRule() {
    try {
      const res = await generica({ metodo: "GET", uri: "/cancellation-rules/active" });
      setActiveRule(res?.data || null);
    } catch {
      setActiveRule(null);
    }
  }

  // GET /cancellation-rules/{id} - view rule detail
  async function viewRuleDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/cancellation-rules/${id}` });
      setDetailRule(res?.data || null);
    } catch {
      toast.error("Erro ao carregar detalhe da regra");
    }
  }

  async function loadRules() {
    try {
      const res = await generica({ metodo: "GET", uri: "/cancellation-rules" });
      setRules(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRules([]);
    }
  }

  function openNewRule() {
    setEditingRule(null);
    setRuleForm({
      cancelDeadlineHours: 24,
      cancellationFeePercentage: 0,
      noShowFeePercentage: 100,
      maxCancellationsPerMonth: 3,
      allowReschedule: true,
      rescheduleDeadlineHours: 12,
      penaltyAfterMaxCancellations: true,
      blockDaysAfterMaxCancellations: 7,
    });
    setShowRuleForm(true);
  }

  function openEditRule(rule: CancellationRule) {
    setEditingRule(rule);
    setRuleForm({
      cancelDeadlineHours: rule.cancelDeadlineHours,
      cancellationFeePercentage: rule.cancellationFeePercentage,
      noShowFeePercentage: rule.noShowFeePercentage,
      maxCancellationsPerMonth: rule.maxCancellationsPerMonth,
      allowReschedule: rule.allowReschedule,
      rescheduleDeadlineHours: rule.rescheduleDeadlineHours,
      penaltyAfterMaxCancellations: rule.penaltyAfterMaxCancellations,
      blockDaysAfterMaxCancellations: rule.blockDaysAfterMaxCancellations,
    });
    setShowRuleForm(true);
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    setSavingRule(true);
    try {
      if (editingRule) {
        await generica({
          metodo: "PUT",
          uri: `/cancellation-rules/${editingRule.id}`,
          data: ruleForm,
        });
        toast.success("Regra atualizada!");
      } else {
        await generica({
          metodo: "POST",
          uri: "/cancellation-rules",
          data: ruleForm,
        });
        toast.success("Regra criada!");
      }
      setShowRuleForm(false);
      loadRules();
    } catch {
      toast.error("Erro ao salvar regra");
    } finally {
      setSavingRule(false);
    }
  }

  async function handleToggleRule(id: number) {
    try {
      await generica({ metodo: "POST", uri: `/cancellation-rules/${id}/toggle` });
      toast.success("Status alterado");
      loadRules();
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  async function handleDeleteRule(id: number) {
    const result = await Swal.fire({
      title: "Excluir regra?",
      text: "Deseja realmente excluir esta regra de cancelamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await generica({ metodo: "DELETE", uri: `/cancellation-rules/${id}` });
      toast.success("Regra excluída");
      loadRules();
    } catch {
      toast.error("Erro ao excluir regra");
    }
  }

  const baseTabs = [
    { key: "perfil", label: "Perfil", icon: <FaUser /> },
    // { key: "aparencia", label: "Aparência", icon: <FaPalette /> },
    { key: "seguranca", label: "Segurança", icon: <FaShieldAlt /> },
  ];

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warn("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warn("As senhas não coincidem");
      return;
    }
    setChangingPassword(true);
    try {
      await generica({
        metodo: "PUT",
        uri: "/auth/change-password",
        data: { currentPassword, newPassword },
      });
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao alterar senha";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  }

  const tabs = isAdmin
    ? [...baseTabs, { key: "cancelamento", label: "Cancelamento", icon: <FaBan /> }]
    : baseTabs;

  const currentRole = normalizeRole(user?.roles?.[0]);
  const profileAddress = asRecord(profileData?.address);
  const profileServices = Array.isArray(profileData?.services)
    ? (profileData?.services as Array<Record<string, unknown>>)
        .map((service) => asText(service.name, ""))
        .filter(Boolean)
        .join(", ")
    : "-";

  const profileName = asText(profileData?.name ?? profileData?.nome ?? user?.nome, "Usuario");
  const profileEmail = asText(profileData?.email ?? user?.email, "");

  function buildProfileForm(data: Record<string, unknown> | null): ProfileEditForm {
    const base = data ?? {};
    const contactValue =
      currentRole === "BARBER"
        ? asText(base.contato, "")
        : currentRole === "SECRETARY"
          ? asText(base.contact, "")
          : asText(base.phone, "");

    return {
      name: asText(base.name ?? user?.nome, ""),
      email: asText(base.email ?? user?.email, ""),
      cpf: asText(base.cpf, ""),
      phone: formatPhoneBR(contactValue),
      birthDate: toDateInputValue(base.birthDate),
      gender: asText(base.gender, ""),
      notes: asText(base.notes, ""),
      receivePromotions: typeof base.receivePromotions === "boolean" ? base.receivePromotions : false,
      receiveReminders: typeof base.receiveReminders === "boolean" ? base.receiveReminders : false,
      address: mapAddressToForm(asRecord(base.address)),
    };
  }

  useEffect(() => {
    if (profileEditMode) return;
    setProfileForm(buildProfileForm(profileData));
  }, [profileData, profileEditMode, currentRole, user?.nome, user?.email]);

  function startProfileEdit() {
    setProfileForm(buildProfileForm(profileData));
    setProfileEditMode(true);
  }

  function cancelProfileEdit() {
    setProfileForm(buildProfileForm(profileData));
    setProfileEditMode(false);
  }

  async function handleSaveProfile() {
    if (currentRole === "ADMIN") return;

    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();
    const sanitizedCpf = onlyDigits(profileForm.cpf);
    const sanitizedPhone = onlyDigits(profileForm.phone);

    if (!trimmedName) {
      toast.warn("Informe o nome");
      return;
    }
    if (!trimmedEmail) {
      toast.warn("Informe o email");
      return;
    }
    if (currentRole === "CLIENT" && sanitizedPhone.length < 10) {
      toast.warn("Informe um telefone valido");
      return;
    }

    const addressPayload = buildAddressPayload(profileForm.address);
    if (addressPayload === null) {
      toast.warn("Preencha endereco completo (rua, bairro, cidade e estado) ou deixe em branco");
      return;
    }

    setProfileSaving(true);
    try {
      if (currentRole === "BARBER") {
        const serviceIds = Array.isArray(profileData?.services)
          ? (profileData?.services as Array<Record<string, unknown>>)
              .map((service) => Number(service.id))
              .filter((id) => Number.isFinite(id))
          : [];

        const barberPayload: Record<string, unknown> = {
          name: trimmedName,
          email: trimmedEmail,
          cpf: sanitizedCpf,
          contato: sanitizedPhone,
          salary: Number(profileData?.salary ?? 0),
          workload: profileData?.workload ?? null,
        };

        const start = asText(profileData?.start, "");
        const end = asText(profileData?.end, "");
        const admissionDate = asText(profileData?.admissionDate, "");

        if (start) barberPayload.start = start;
        if (end) barberPayload.end = end;
        if (admissionDate) barberPayload.admissionDate = admissionDate;
        if (serviceIds.length > 0) barberPayload.idServices = serviceIds;
        if (addressPayload) barberPayload.address = addressPayload;

        const formData = new FormData();
        formData.append("barber", JSON.stringify(barberPayload));
        await generica({ metodo: "PUT", uri: "/barber/logged-barber", data: formData });
      }

      if (currentRole === "SECRETARY") {
        const secretaryPayload: Record<string, unknown> = {
          name: trimmedName,
          email: trimmedEmail,
          cpf: sanitizedCpf,
          contact: sanitizedPhone,
          salary: Number(profileData?.salary ?? 0),
          workload: profileData?.workload ?? null,
        };

        const start = asText(profileData?.start, "");
        const end = asText(profileData?.end, "");
        const admissionDate = asText(profileData?.admissionDate, "");

        if (start) secretaryPayload.start = start;
        if (end) secretaryPayload.end = end;
        if (admissionDate) secretaryPayload.admissionDate = admissionDate;
        if (addressPayload) secretaryPayload.address = addressPayload;

        const formData = new FormData();
        formData.append("secretary", JSON.stringify(secretaryPayload));
        await generica({ metodo: "PUT", uri: "/secretary/logged-secretary", data: formData });
      }

      if (currentRole === "CLIENT") {
        const clientPayload: Record<string, unknown> = {
          name: trimmedName,
          email: trimmedEmail,
          phone: sanitizedPhone,
          cpf: sanitizedCpf || undefined,
          birthDate: profileForm.birthDate || undefined,
          gender: profileForm.gender || undefined,
          notes: profileForm.notes.trim() || undefined,
          receivePromotions: profileForm.receivePromotions,
          receiveReminders: profileForm.receiveReminders,
        };

        const preferredBarberId = Number(profileData?.preferredBarberId);
        if (Number.isFinite(preferredBarberId) && preferredBarberId > 0) {
          clientPayload.preferredBarberId = preferredBarberId;
        }

        const preferredContactMethod = asText(profileData?.preferredContactMethod, "");
        if (preferredContactMethod) {
          clientPayload.preferredContactMethod = preferredContactMethod;
        }

        if (addressPayload) clientPayload.address = addressPayload;

        const formData = new FormData();
        formData.append(
          "client",
          new Blob([JSON.stringify(clientPayload)], { type: "application/json" }),
        );
        await generica({ metodo: "PUT", uri: "/client/logged-client", data: formData });
      }

      auth?.updateUser?.({ nome: trimmedName, email: trimmedEmail });
      toast.success("Perfil atualizado com sucesso");
      setProfileEditMode(false);
      loadRoleProfile();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.response?.data?.error || "Erro ao salvar perfil";
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function loadRoleProfile() {
    if (!user) return;

    setProfileLoading(true);
    setProfileEditMode(false);
    setProfileError(null);
    setProfileSource("AUTH");
    setProfileData({
      name: user.nome,
      email: user.email,
      idUser: user.id,
    });

    setProfilePhoto((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    const role = normalizeRole(user.roles?.[0]);

    try {
      if (role === "BARBER") {
        const barberResponse = await generica({ metodo: "GET", uri: "/barber/logged-barber" });
        if (barberResponse?.status === 200 && barberResponse?.data) {
          setProfileData(barberResponse.data as Record<string, unknown>);
          setProfileSource("BARBER");
        } else {
          setProfileError("Nao foi possivel carregar os dados completos do barbeiro.");
        }

        const barberPhotoResponse = await generica({
          metodo: "GET",
          uri: "/barber/logged-barber/picture",
          responseType: "blob",
        });
        if (barberPhotoResponse?.status === 200 && barberPhotoResponse?.data) {
          const photoUrl = createBlobUrl(barberPhotoResponse.data);
          if (photoUrl) setProfilePhoto(photoUrl);
        }
      }

      if (role === "SECRETARY") {
        const secretaryResponse = await generica({
          metodo: "GET",
          uri: "/secretary/logged-secretary",
        });
        if (secretaryResponse?.status === 200 && secretaryResponse?.data) {
          setProfileData(secretaryResponse.data as Record<string, unknown>);
          setProfileSource("SECRETARY");
        } else {
          setProfileError("Nao foi possivel carregar os dados completos da secretaria.");
        }

        const secretaryPhotoResponse = await generica({
          metodo: "GET",
          uri: "/secretary/logged-secretary/picture",
          responseType: "blob",
        });
        if (secretaryPhotoResponse?.status === 200 && secretaryPhotoResponse?.data) {
          const photoUrl = createBlobUrl(secretaryPhotoResponse.data);
          if (photoUrl) setProfilePhoto(photoUrl);
        }
      }

      if (role === "CLIENT") {
        const clientResponse = await generica({
          metodo: "GET",
          uri: "/client/logged-client",
        });

        if (clientResponse?.status === 200 && clientResponse?.data) {
          const clientData = clientResponse.data as Record<string, unknown>;
          setProfileData(clientData);
          setProfileSource("CLIENT");

          const clientPhotoResponse = await generica({
            metodo: "GET",
            uri: "/client/logged-client/photo",
            responseType: "blob",
          });
          if (clientPhotoResponse?.status === 200 && clientPhotoResponse?.data) {
            const photoUrl = createBlobUrl(clientPhotoResponse.data);
            if (photoUrl) setProfilePhoto(photoUrl);
          }
        } else if (clientResponse?.status && clientResponse.status !== 404) {
          setProfileError("Nao foi possivel carregar os dados completos do cliente.");
        }
      }
    } catch {
      setProfileError("Erro ao carregar dados de perfil.");
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Configurações</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <nav className="gobarber-card p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-[#1A1A2E] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 gobarber-card">
            {activeTab === "perfil" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#1A1A2E]">Dados do Perfil</h2>
                  {!profileLoading && currentRole !== "ADMIN" && (
                    <div className="flex items-center gap-2">
                      {profileEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={cancelProfileEdit}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={profileSaving}
                            className="px-3 py-2 rounded-lg bg-[#E94560] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          >
                            <FaSave />
                            {profileSaving ? "Salvando..." : "Salvar"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startProfileEdit}
                          className="px-3 py-2 rounded-lg bg-[#1A1A2E] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2"
                        >
                          <FaEdit />
                          Editar Perfil
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E94560] to-[#0F3460] flex items-center justify-center text-white text-2xl font-bold">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Foto de perfil"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      profileName.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A2E]">
                      {profileName}
                    </p>
                    <p className="text-sm text-gray-500">{profileEmail}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 bg-[#E94560]/10 text-[#E94560] rounded text-xs font-medium">
                        {ROLE_LABELS[currentRole]}
                      </span>
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {PROFILE_SOURCE_LABELS[profileSource]}
                      </span>
                    </div>
                  </div>
                </div>

                {profileLoading && (
                  <div className="p-4 rounded-lg bg-gray-50 text-sm text-gray-500">
                    Carregando dados do perfil...
                  </div>
                )}

                {profileError && (
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                    {profileError}
                  </div>
                )}

                {!profileLoading && currentRole === "BARBER" && (
                  <>
                    {profileEditMode ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                              type="text"
                              value={profileForm.cpf}
                              maxLength={11}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                            <input
                              type="text"
                              value={profileForm.phone}
                              maxLength={15}
                              placeholder="(81) 99999-9999"
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, phone: formatPhoneBR(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <ProfileField
                            label="Expediente (somente leitura)"
                            value={`${asText(profileData?.start)} as ${asText(profileData?.end)}`}
                          />
                          <ProfileField label="Salario (somente leitura)" value={formatCurrency(profileData?.salary)} />
                          <ProfileField
                            label="Data de admissao (somente leitura)"
                            value={formatDate(profileData?.admissionDate)}
                          />
                          <ProfileField label="Carga horaria (somente leitura)" value={asText(profileData?.workload)} />
                          <ProfileField label="Servicos vinculados (somente leitura)" value={profileServices || "-"} />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <p className="text-sm font-medium text-gray-700">Endereco</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={profileForm.address.street}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, street: e.target.value },
                                }))
                              }
                              placeholder="Rua"
                              className="gobarber-input"
                            />
                            <input
                              type="number"
                              value={profileForm.address.number}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, number: e.target.value },
                                }))
                              }
                              placeholder="Numero"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.neighborhood}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, neighborhood: e.target.value },
                                }))
                              }
                              placeholder="Bairro"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.city}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, city: e.target.value },
                                }))
                              }
                              placeholder="Cidade"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.state}
                              maxLength={2}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, state: e.target.value.toUpperCase() },
                                }))
                              }
                              placeholder="UF"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.cep}
                              maxLength={8}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, cep: onlyDigits(e.target.value).slice(0, 8) },
                                }))
                              }
                              placeholder="CEP"
                              className="gobarber-input"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ProfileField label="Nome" value={asText(profileData?.name, profileName)} />
                          <ProfileField label="E-mail" value={asText(profileData?.email, profileEmail)} />
                          <ProfileField label="CPF" value={asText(profileData?.cpf)} />
                          <ProfileField label="Contato" value={formatPhone(profileData?.contato)} />
                          <ProfileField
                            label="Expediente"
                            value={`${asText(profileData?.start)} as ${asText(profileData?.end)}`}
                          />
                          <ProfileField label="Salario" value={formatCurrency(profileData?.salary)} />
                          <ProfileField
                            label="Data de admissao"
                            value={formatDate(profileData?.admissionDate)}
                          />
                          <ProfileField label="Carga horaria" value={asText(profileData?.workload)} />
                          <ProfileField label="Servicos vinculados" value={profileServices || "-"} />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Endereco</p>
                          <p className="text-sm text-gray-600">{formatAddress(profileAddress)}</p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {!profileLoading && currentRole === "SECRETARY" && (
                  <>
                    {profileEditMode ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                              type="text"
                              value={profileForm.cpf}
                              maxLength={11}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                            <input
                              type="text"
                              value={profileForm.phone}
                              maxLength={15}
                              placeholder="(81) 99999-9999"
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, phone: formatPhoneBR(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <ProfileField
                            label="Expediente (somente leitura)"
                            value={`${asText(profileData?.start)} as ${asText(profileData?.end)}`}
                          />
                          <ProfileField label="Salario (somente leitura)" value={formatCurrency(profileData?.salary)} />
                          <ProfileField
                            label="Data de admissao (somente leitura)"
                            value={formatDate(profileData?.admissionDate)}
                          />
                          <ProfileField label="Carga horaria (somente leitura)" value={asText(profileData?.workload)} />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <p className="text-sm font-medium text-gray-700">Endereco</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={profileForm.address.street}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, street: e.target.value },
                                }))
                              }
                              placeholder="Rua"
                              className="gobarber-input"
                            />
                            <input
                              type="number"
                              value={profileForm.address.number}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, number: e.target.value },
                                }))
                              }
                              placeholder="Numero"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.neighborhood}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, neighborhood: e.target.value },
                                }))
                              }
                              placeholder="Bairro"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.city}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, city: e.target.value },
                                }))
                              }
                              placeholder="Cidade"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.state}
                              maxLength={2}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, state: e.target.value.toUpperCase() },
                                }))
                              }
                              placeholder="UF"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.cep}
                              maxLength={8}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, cep: onlyDigits(e.target.value).slice(0, 8) },
                                }))
                              }
                              placeholder="CEP"
                              className="gobarber-input"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ProfileField label="Nome" value={asText(profileData?.name, profileName)} />
                          <ProfileField label="E-mail" value={asText(profileData?.email, profileEmail)} />
                          <ProfileField label="CPF" value={asText(profileData?.cpf)} />
                          <ProfileField label="Contato" value={formatPhone(profileData?.contact)} />
                          <ProfileField
                            label="Expediente"
                            value={`${asText(profileData?.start)} as ${asText(profileData?.end)}`}
                          />
                          <ProfileField label="Salario" value={formatCurrency(profileData?.salary)} />
                          <ProfileField
                            label="Data de admissao"
                            value={formatDate(profileData?.admissionDate)}
                          />
                          <ProfileField label="Carga horaria" value={asText(profileData?.workload)} />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Endereco</p>
                          <p className="text-sm text-gray-600">{formatAddress(profileAddress)}</p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {!profileLoading && currentRole === "CLIENT" && (
                  <>
                    {profileEditMode ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                            <input
                              type="text"
                              value={profileForm.phone}
                              maxLength={15}
                              placeholder="(81) 99999-9999"
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, phone: formatPhoneBR(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                              type="text"
                              value={profileForm.cpf}
                              maxLength={11}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, cpf: onlyDigits(e.target.value) }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
                            <input
                              type="date"
                              value={profileForm.birthDate}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, birthDate: e.target.value }))
                              }
                              className="gobarber-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Genero</label>
                            <select
                              value={profileForm.gender}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                              className="gobarber-input"
                            >
                              {CLIENT_GENDER_OPTIONS.map((option) => (
                                <option key={option.value || "empty"} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <ProfileField label="Pontos de fidelidade (somente leitura)" value={asText(profileData?.loyaltyPoints)} />
                          <ProfileField label="Tier de fidelidade (somente leitura)" value={asText(profileData?.loyaltyTier)} />
                          <ProfileField label="Total de visitas (somente leitura)" value={asText(profileData?.totalVisits)} />
                          <ProfileField label="Total gasto (somente leitura)" value={formatCurrency(profileData?.totalSpent)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
                          <textarea
                            value={profileForm.notes}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="gobarber-input"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={profileForm.receivePromotions}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  receivePromotions: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 accent-[#E94560]"
                            />
                            Receber promocoes
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={profileForm.receiveReminders}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  receiveReminders: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 accent-[#E94560]"
                            />
                            Receber lembretes
                          </label>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <p className="text-sm font-medium text-gray-700">Endereco</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={profileForm.address.street}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, street: e.target.value },
                                }))
                              }
                              placeholder="Rua"
                              className="gobarber-input"
                            />
                            <input
                              type="number"
                              value={profileForm.address.number}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, number: e.target.value },
                                }))
                              }
                              placeholder="Numero"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.neighborhood}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, neighborhood: e.target.value },
                                }))
                              }
                              placeholder="Bairro"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.city}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, city: e.target.value },
                                }))
                              }
                              placeholder="Cidade"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.state}
                              maxLength={2}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, state: e.target.value.toUpperCase() },
                                }))
                              }
                              placeholder="UF"
                              className="gobarber-input"
                            />
                            <input
                              type="text"
                              value={profileForm.address.cep}
                              maxLength={8}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: { ...prev.address, cep: onlyDigits(e.target.value).slice(0, 8) },
                                }))
                              }
                              placeholder="CEP"
                              className="gobarber-input"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ProfileField label="Nome" value={asText(profileData?.name, profileName)} />
                          <ProfileField label="E-mail" value={asText(profileData?.email, profileEmail)} />
                          <ProfileField label="Telefone" value={formatPhone(profileData?.phone)} />
                          <ProfileField label="CPF" value={asText(profileData?.cpf)} />
                          <ProfileField
                            label="Data de nascimento"
                            value={formatDate(profileData?.birthDate)}
                          />
                          <ProfileField label="Genero" value={formatGender(profileData?.gender)} />
                          <ProfileField label="Pontos de fidelidade" value={asText(profileData?.loyaltyPoints)} />
                          <ProfileField label="Tier de fidelidade" value={asText(profileData?.loyaltyTier)} />
                          <ProfileField label="Total de visitas" value={asText(profileData?.totalVisits)} />
                          <ProfileField label="Total gasto" value={formatCurrency(profileData?.totalSpent)} />
                          <ProfileField
                            label="Recebe promocoes"
                            value={formatBoolean(profileData?.receivePromotions)}
                          />
                          <ProfileField
                            label="Recebe lembretes"
                            value={formatBoolean(profileData?.receiveReminders)}
                          />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Endereco</p>
                          <p className="text-sm text-gray-600">{formatAddress(profileAddress)}</p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {!profileLoading && currentRole === "ADMIN" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField label="Nome" value={profileName} />
                    <ProfileField label="E-mail" value={profileEmail} />
                    <ProfileField label="ID do usuario" value={asText(user?.id)} />
                    <ProfileField label="Perfil de acesso" value={ROLE_LABELS[currentRole]} />
                  </div>
                )}

                <p className="text-sm text-gray-500 italic">
                  Nesta aba, dados pessoais podem ser editados por cliente, barbeiro e secretaria.
                  Campos corporativos (salario, admissao, carga horaria e similares) ficam somente leitura.
                </p>
              </div>
            )}

            {activeTab === "aparencia" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-[#1A1A2E]">
                  Aparência
                </h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-[#1A1A2E]">Modo escuro</p>
                    <p className="text-sm text-gray-500">
                      Alterne entre tema claro e escuro
                    </p>
                  </div>
                  <button
                    onClick={toggleMode}
                    className={`w-14 h-7 rounded-full relative transition-colors ${mode === "dark" ? "bg-[#E94560]" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${mode === "dark" ? "translate-x-7" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>
            )}
            {activeTab === "seguranca" && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h2 className="text-lg font-semibold text-[#1A1A2E]">
                  Segurança
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha atual
                    </label>
                    <input
                      type="password"
                      className="gobarber-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova senha
                    </label>
                    <input
                      type="password"
                      className="gobarber-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar nova senha
                    </label>
                    <input
                      type="password"
                      className="gobarber-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="gobarber-btn-primary flex items-center gap-2"
                >
                  <FaShieldAlt /> {changingPassword ? "Alterando..." : "Alterar Senha"}
                </button>
              </form>
            )}

            {activeTab === "cancelamento" && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#1A1A2E]">Regras de Cancelamento</h2>
                  <button onClick={openNewRule} className="gobarber-btn-primary flex items-center gap-2 text-sm">
                    <FaPlus /> Nova Regra
                  </button>
                </div>

                {/* Active Rule Banner */}
                {activeRule && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-600" />
                      <span className="font-semibold text-green-800">Regra Ativa Atual</span>
                      <span className="text-xs text-gray-400">#{activeRule.id}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="text-gray-500 text-xs">Antecedência:</span> <span className="font-medium">{activeRule.cancelDeadlineHours}h</span></div>
                      <div><span className="text-gray-500 text-xs">Multa:</span> <span className="font-medium">{activeRule.cancellationFeePercentage}%</span></div>
                      <div><span className="text-gray-500 text-xs">Máx./mês:</span> <span className="font-medium">{activeRule.maxCancellationsPerMonth}</span></div>
                      <div><span className="text-gray-500 text-xs">Reagendar:</span> <span className="font-medium">{activeRule.allowReschedule ? "Sim" : "Não"}</span></div>
                    </div>
                  </div>
                )}

                {showRuleForm && (
                  <form onSubmit={handleSaveRule} className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                    <h3 className="font-medium text-[#1A1A2E]">{editingRule ? "Editar Regra" : "Nova Regra"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Antecedência mínima para cancelar (horas)
                        </label>
                        <input
                          type="number" min={0} value={ruleForm.cancelDeadlineHours}
                          onChange={(e) => setRuleForm({ ...ruleForm, cancelDeadlineHours: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Multa por cancelamento (%)
                        </label>
                        <input
                          type="number" min={0} max={100} step={0.1} value={ruleForm.cancellationFeePercentage}
                          onChange={(e) => setRuleForm({ ...ruleForm, cancellationFeePercentage: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Multa por não comparecimento (%)
                        </label>
                        <input
                          type="number" min={0} max={100} step={0.1} value={ruleForm.noShowFeePercentage}
                          onChange={(e) => setRuleForm({ ...ruleForm, noShowFeePercentage: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Máx. cancelamentos por mês
                        </label>
                        <input
                          type="number" min={0} value={ruleForm.maxCancellationsPerMonth}
                          onChange={(e) => setRuleForm({ ...ruleForm, maxCancellationsPerMonth: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Antecedência para reagendamento (horas)
                        </label>
                        <input
                          type="number" min={0} value={ruleForm.rescheduleDeadlineHours}
                          onChange={(e) => setRuleForm({ ...ruleForm, rescheduleDeadlineHours: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dias de bloqueio após exceder máx.
                        </label>
                        <input
                          type="number" min={0} value={ruleForm.blockDaysAfterMaxCancellations}
                          onChange={(e) => setRuleForm({ ...ruleForm, blockDaysAfterMaxCancellations: Number(e.target.value) })}
                          className="gobarber-input" required
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox" checked={ruleForm.allowReschedule}
                          onChange={(e) => setRuleForm({ ...ruleForm, allowReschedule: e.target.checked })}
                          className="w-4 h-4 accent-[#E94560]"
                        />
                        Permitir reagendamento
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox" checked={ruleForm.penaltyAfterMaxCancellations}
                          onChange={(e) => setRuleForm({ ...ruleForm, penaltyAfterMaxCancellations: e.target.checked })}
                          className="w-4 h-4 accent-[#E94560]"
                        />
                        Penalidade após exceder máx. cancelamentos
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={savingRule} className="gobarber-btn-primary flex items-center gap-2">
                        <FaSave /> {savingRule ? "Salvando..." : "Salvar"}
                      </button>
                      <button type="button" onClick={() => setShowRuleForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {rules.length === 0 && !showRuleForm ? (
                  <div className="text-center py-8 text-gray-400">Nenhuma regra de cancelamento cadastrada</div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className={`p-4 rounded-lg border ${rule.active ? "bg-white border-green-200" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {rule.active ? "Ativa" : "Inativa"}
                            </span>
                            <span className="text-xs text-gray-400">#{rule.id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => viewRuleDetail(rule.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Ver detalhe"><FaEye /></button>
                            <button onClick={() => handleToggleRule(rule.id)} className="p-1.5 hover:bg-gray-100 rounded text-lg" title={rule.active ? "Desativar" : "Ativar"}>
                              {rule.active ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-400" />}
                            </button>
                            <button onClick={() => openEditRule(rule)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><FaEdit /></button>
                            <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><FaBan /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Antecedência</p>
                            <p className="font-medium">{rule.cancelDeadlineHours}h</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Multa cancel.</p>
                            <p className="font-medium">{rule.cancellationFeePercentage}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Multa no-show</p>
                            <p className="font-medium">{rule.noShowFeePercentage}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Máx. p/mês</p>
                            <p className="font-medium">{rule.maxCancellationsPerMonth}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Reagendamento</p>
                            <p className="font-medium">{rule.allowReschedule ? `Sim (${rule.rescheduleDeadlineHours}h)` : "Não"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Penalidade</p>
                            <p className="font-medium">{rule.penaltyAfterMaxCancellations ? `Bloq. ${rule.blockDaysAfterMaxCancellations}d` : "Não"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Detalhe Regra (GET /cancellation-rules/{id}) */}
      <Modal isOpen={!!detailRule} onClose={() => setDetailRule(null)} title="Detalhe da Regra de Cancelamento">
        {detailRule && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${detailRule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {detailRule.active ? "Ativa" : "Inativa"}
              </span>
              <span className="text-xs text-gray-400">ID: #{detailRule.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Antecedência para cancelar</p><p className="font-bold">{detailRule.cancelDeadlineHours}h</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Multa cancelamento</p><p className="font-bold text-[#E94560]">{detailRule.cancellationFeePercentage}%</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Multa no-show</p><p className="font-bold text-[#E94560]">{detailRule.noShowFeePercentage}%</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Máx. cancelamentos/mês</p><p className="font-bold">{detailRule.maxCancellationsPerMonth}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Reagendamento</p><p className="font-bold">{detailRule.allowReschedule ? `Sim (${detailRule.rescheduleDeadlineHours}h)` : "Não"}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Penalidade</p><p className="font-bold">{detailRule.penaltyAfterMaxCancellations ? `Bloq. ${detailRule.blockDaysAfterMaxCancellations}d` : "Não"}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </GoBarberLayout>
  );
}

