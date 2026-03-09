"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { generica } from "@/api/api";
import Modal from "@/components/Modal/Modal";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaClock,
  FaCut,
  FaRegStar,
  FaStar,
  FaPlus,
  FaTimesCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";

interface ServiceItem {
  id?: number;
  name?: string;
  value?: number;
}

interface BarberInfo {
  id?: number;
  idBarber?: number;
  barberId?: number;
  name?: string;
}

interface Appointment {
  id: number;
  clientName?: string;
  barber?: BarberInfo;
  barberId?: number;
  barberName?: string;
  serviceType?: ServiceItem[];
  serviceNames?: string[];
  startTime?: string;
  endTime?: string;
  totalPrice?: number;
  status?: string;
  rejectionReason?: string;
}

interface BarbershopRef {
  slug?: string;
  active?: boolean;
}

const FALLBACK_SHOP_SLUG = process.env.NEXT_PUBLIC_SHOP_SLUG || "gobarber-principal";

type ReviewFormState = {
  rating: number;
  comment: string;
  serviceRating: number;
  punctualityRating: number;
  cleanlinessRating: number;
  valueRating: number;
  wouldRecommend: boolean;
};

const INITIAL_REVIEW_FORM: ReviewFormState = {
  rating: 5,
  comment: "",
  serviceRating: 5,
  punctualityRating: 5,
  cleanlinessRating: 5,
  valueRating: 5,
  wouldRecommend: true,
};

/**
 * Converte "dd/MM/yyyy HH:mm" para Date
 */
function parseDateTime(raw: string): Date | null {
  if (!raw) return null;
  const value = raw.trim();

  if (/^\d{4}-/.test(value)) {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const normalized = new Date(value.replace(" ", "T"));
    if (!Number.isNaN(normalized.getTime())) return normalized;
  }

  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (br) return new Date(+br[3], +br[2] - 1, +br[1], +br[4], +br[5], +(br[6] || 0));

  const isoLike = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoLike) return new Date(+isoLike[1], +isoLike[2] - 1, +isoLike[3], +isoLike[4], +isoLike[5], +(isoLike[6] || 0));

  return null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-800 border-green-300" },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800 border-red-300" },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-600 border-gray-300" },
  COMPLETED: { label: "Concluído", color: "bg-blue-100 text-blue-800 border-blue-300" },
};

export default function MeusAgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [bookingSlug, setBookingSlug] = useState(FALLBACK_SHOP_SLUG);
  const [loggedClientId, setLoggedClientId] = useState<number | null>(null);
  const [reviewedAppointments, setReviewedAppointments] = useState<Set<number>>(new Set());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(INITIAL_REVIEW_FORM);

  useEffect(() => {
    loadMyAppointments();
    resolveBookingSlug();
  }, []);

  async function loadMyAppointments() {
    setLoading(true);
    try {
      const res = await generica({
        metodo: "GET",
        uri: "/appointments/my",
        params: { page: 0, size: 100 },
      });
      const d = res?.data?.content || res?.data || [];
      setAppointments(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }

  async function loadClientReviews(clientId: number) {
    try {
      const res = await generica({
        metodo: "GET",
        uri: `/review/client/${clientId}`,
        params: { page: 0, size: 200 },
      });
      const data = res?.data?.content || res?.data || [];
      if (!Array.isArray(data)) {
        setReviewedAppointments(new Set());
        return;
      }

      const reviewed = new Set<number>();
      data.forEach((review: any) => {
        const appointmentId = Number(review?.appointmentId);
        if (Number.isInteger(appointmentId) && appointmentId > 0) {
          reviewed.add(appointmentId);
        }
      });
      setReviewedAppointments(reviewed);
    } catch {
      setReviewedAppointments(new Set());
    }
  }

  async function resolveBookingSlug() {
    let resolvedClientId: number | undefined;

    try {
      const loggedClientRes = await generica({ metodo: "GET", uri: "/client/logged-client" });
      if (loggedClientRes?.status === 200 && loggedClientRes?.data?.idClient) {
        resolvedClientId = Number(loggedClientRes.data.idClient);
        setLoggedClientId(resolvedClientId);
      }
    } catch {
      // silencioso
    }

    if (resolvedClientId) {
      await loadClientReviews(resolvedClientId);
      try {
        const clientShopsRes = await generica({ metodo: "GET", uri: `/barbershop/client/${resolvedClientId}` });
        const clientShops: BarbershopRef[] = Array.isArray(clientShopsRes?.data) ? clientShopsRes.data : [];
        const clientSlug =
          clientShops.find((shop) => !!shop.slug && shop.active !== false)?.slug ||
          clientShops.find((shop) => !!shop.slug)?.slug;

        if (clientSlug) {
          setBookingSlug(clientSlug);
          return;
        }
      } catch {
        // silencioso
      }
    }

    try {
      const activeShopsRes = await generica({ metodo: "GET", uri: "/barbershop/active" });
      const activeShops: BarbershopRef[] = Array.isArray(activeShopsRes?.data) ? activeShopsRes.data : [];
      const activeSlug = activeShops.find((shop) => !!shop.slug)?.slug;
      if (activeSlug) {
        setBookingSlug(activeSlug);
      }
    } catch {
      // silencioso: mantém fallback
    }
  }

  async function handleCancel(id: number) {
    const result = await Swal.fire({
      title: "Cancelar agendamento?",
      text: "Deseja realmente cancelar este agendamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E94560",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, cancelar!",
      cancelButtonText: "Voltar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await generica({
        metodo: "POST",
        uri: `/appointments/my/${id}/cancel`,
      });
      if (res?.status === 200) {
        toast.success("Agendamento cancelado");
        loadMyAppointments();
      } else {
        toast.error("Erro ao cancelar");
      }
    } catch {
      toast.error("Erro ao cancelar agendamento");
    }
  }

  function isReviewEligible(appointment: Appointment, referenceDate: Date) {
    const status = (appointment.status || "").toUpperCase();
    if (status === "CANCELLED" || status === "REJECTED") return false;
    if (status === "COMPLETED") return true;

    const compareDate = appointment.endTime
      ? parseDateTime(appointment.endTime)
      : appointment.startTime
        ? parseDateTime(appointment.startTime)
        : null;

    return !compareDate || compareDate < referenceDate;
  }

  function getBarberId(appointment: Appointment | null | undefined): number | null {
    if (!appointment) return null;
    const value =
      appointment.barber?.idBarber ??
      appointment.barber?.id ??
      appointment.barber?.barberId ??
      appointment.barberId;
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
  }

  function getBarberName(appointment: Appointment | null | undefined): string {
    if (!appointment) return "Barbeiro";
    if (appointment.barberName?.trim()) return appointment.barberName.trim();
    if (appointment.barber?.name?.trim()) return appointment.barber.name.trim();
    const barberId = getBarberId(appointment);
    return barberId ? `Barbeiro #${barberId}` : "Barbeiro";
  }

  function openReviewModal(appointment: Appointment) {
    if (reviewedAppointments.has(appointment.id)) {
      toast.info("Este agendamento ja foi avaliado.");
      return;
    }

    setReviewTarget(appointment);
    setReviewForm(INITIAL_REVIEW_FORM);
    setReviewModalOpen(true);
  }

  async function submitAppointmentReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewTarget) return;

    const reviewedAppointmentId = reviewTarget.id;
    let barberId = getBarberId(reviewTarget);

    if (!barberId) {
      try {
        const detailRes = await generica({ metodo: "GET", uri: `/appointments/${reviewedAppointmentId}` });
        const detailed = detailRes?.data as Appointment | undefined;
        barberId = getBarberId(detailed);
      } catch {
        // silencioso
      }
    }

    if (!barberId) {
      toast.error("Nao foi possivel identificar o barbeiro deste atendimento.");
      return;
    }

    let clientId = loggedClientId;
    if (!clientId) {
      try {
        const loggedClientRes = await generica({ metodo: "GET", uri: "/client/logged-client" });
        if (loggedClientRes?.status === 200 && loggedClientRes?.data?.idClient) {
          clientId = Number(loggedClientRes.data.idClient);
          setLoggedClientId(clientId);
        }
      } catch {
        // silencioso
      }
    }

    if (!clientId) {
      toast.error("Nao foi possivel identificar o cliente autenticado.");
      return;
    }

    setSavingReview(true);
    try {
      const payload = {
        ...reviewForm,
        clientId,
        barberId,
        appointmentId: reviewedAppointmentId,
      };
      const res = await generica({
        metodo: "POST",
        uri: "/review",
        data: payload,
      });

      if (res?.status === 200 || res?.status === 201) {
        toast.success("Avaliacao enviada com sucesso!");
        setReviewedAppointments((prev) => {
          const next = new Set(prev);
          next.add(reviewedAppointmentId);
          return next;
        });
        setReviewModalOpen(false);
        setReviewTarget(null);
      } else if (res?.status === 409) {
        toast.info("Este agendamento ja foi avaliado.");
        setReviewedAppointments((prev) => {
          const next = new Set(prev);
          next.add(reviewedAppointmentId);
          return next;
        });
        setReviewModalOpen(false);
        setReviewTarget(null);
      } else {
        const msg = res?.data?.message || res?.data?.error;
        toast.error(msg || "Erro ao enviar avaliacao");
      }
    } catch {
      toast.error("Erro ao enviar avaliacao");
    } finally {
      setSavingReview(false);
    }
  }

  const StarSelector = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            {star <= value ? (
              <FaStar className="text-yellow-400 text-lg" />
            ) : (
              <FaRegStar className="text-gray-300 text-lg" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const now = new Date();

  const filtered = appointments.filter((a) => {
    const dt = a.startTime ? parseDateTime(a.startTime) : null;
    if (tab === "upcoming") {
      return dt && dt >= now && a.status !== "CANCELLED" && a.status !== "REJECTED";
    }
    return !dt || dt < now || a.status === "CANCELLED" || a.status === "REJECTED";
  });

  return (
    <GoBarberLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">Meus Agendamentos</h1>
            <p className="text-gray-500 text-sm mt-1">Acompanhe suas solicitações e agende novos horários</p>
          </div>
          <Link
            href={`/b/${bookingSlug}/agendar`}
            className="gobarber-btn-primary flex items-center gap-2 w-fit"
          >
            <FaPlus /> Novo Agendamento
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab("upcoming")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === "upcoming" ? "border-[#E94560] text-[#E94560]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Próximos
          </button>
          <button
            onClick={() => setTab("past")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === "past" ? "border-[#E94560] text-[#E94560]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Histórico
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E94560] mx-auto mb-3" />
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaCalendarAlt className="mx-auto text-4xl mb-3" />
            <p className="text-lg font-medium">
              {tab === "upcoming" ? "Nenhum agendamento próximo" : "Nenhum registro no histórico"}
            </p>
            {tab === "upcoming" && (
              <Link href={`/b/${bookingSlug}/agendar`} className="text-[#E94560] font-semibold mt-2 inline-block hover:underline">
                Agendar agora →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
              .sort((a, b) => {
                const da = a.startTime ? parseDateTime(a.startTime)?.getTime() || 0 : 0;
                const db = b.startTime ? parseDateTime(b.startTime)?.getTime() || 0 : 0;
                return tab === "upcoming" ? da - db : db - da;
              })
              .map((a) => {
                const dt = a.startTime ? parseDateTime(a.startTime) : null;
                const endDt = a.endTime ? parseDateTime(a.endTime) : null;
                const barber = a.barberName || a.barber?.name || "";
                const services: string[] =
                  a.serviceNames || a.serviceType?.map((s) => s.name || "").filter(Boolean) as string[] || [];
                const st = STATUS_MAP[a.status || ""] || { label: a.status || "", color: "bg-gray-100 text-gray-600" };
                const canCancel =
                  (a.status === "PENDING_APPROVAL" || a.status === "CONFIRMED") && dt && dt > now;
                const canReview = isReviewEligible(a, now);
                const alreadyReviewed = reviewedAppointments.has(a.id);

                return (
                  <div key={a.id} className="gobarber-card">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Data/hora */}
                        <div className="flex items-center gap-2 text-sm">
                          <FaCalendarAlt className="text-[#E94560] shrink-0" />
                          <span className="font-semibold text-[#1A1A2E]">
                            {dt ? dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" }) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaClock className="shrink-0" />
                          <span>
                            {dt ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            {endDt ? ` - ${endDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                          </span>
                        </div>

                        {/* Barbeiro */}
                        {barber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaCut className="shrink-0" />
                            <span>{barber}</span>
                          </div>
                        )}

                        {/* Serviços */}
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {services.map((s, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Motivo de rejeição */}
                        {a.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Motivo: {a.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Status + ações */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${st.color}`}>
                          {st.label}
                        </span>
                        {a.totalPrice != null && (
                          <span className="text-sm font-bold text-[#E94560]">
                            R$ {a.totalPrice.toFixed(2)}
                          </span>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(a.id)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
                          >
                            <FaTimesCircle /> Cancelar
                          </button>
                        )}
                        {canReview && !alreadyReviewed && (
                          <button
                            onClick={() => openReviewModal(a)}
                            className="text-xs text-[#E94560] hover:text-[#c73b54] flex items-center gap-1 mt-1"
                          >
                            <FaStar /> Avaliar atendimento
                          </button>
                        )}
                        {canReview && alreadyReviewed && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200 mt-1">
                            Avaliado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          if (savingReview) return;
          setReviewModalOpen(false);
          setReviewTarget(null);
        }}
        title="Avaliar atendimento"
      >
        {reviewTarget && (
          <form onSubmit={submitAppointmentReview} className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Agendamento</p>
              <p className="text-sm font-medium text-[#1A1A2E]">
                #{reviewTarget.id} - {getBarberName(reviewTarget)}
              </p>
            </div>

            <StarSelector
              label="Nota geral *"
              value={reviewForm.rating}
              onChange={(value) => setReviewForm((prev) => ({ ...prev, rating: value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <StarSelector
                label="Servico"
                value={reviewForm.serviceRating}
                onChange={(value) => setReviewForm((prev) => ({ ...prev, serviceRating: value }))}
              />
              <StarSelector
                label="Pontualidade"
                value={reviewForm.punctualityRating}
                onChange={(value) => setReviewForm((prev) => ({ ...prev, punctualityRating: value }))}
              />
              <StarSelector
                label="Limpeza"
                value={reviewForm.cleanlinessRating}
                onChange={(value) => setReviewForm((prev) => ({ ...prev, cleanlinessRating: value }))}
              />
              <StarSelector
                label="Custo-beneficio"
                value={reviewForm.valueRating}
                onChange={(value) => setReviewForm((prev) => ({ ...prev, valueRating: value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="gobarber-input"
                rows={3}
                placeholder="Como foi seu atendimento?"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reviewForm.wouldRecommend}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, wouldRecommend: e.target.checked }))}
                className="w-4 h-4 accent-[#E94560]"
              />
              Eu recomendaria este barbeiro
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setReviewModalOpen(false);
                  setReviewTarget(null);
                }}
                disabled={savingReview}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingReview}
                className="gobarber-btn-primary disabled:opacity-60"
              >
                {savingReview ? "Enviando..." : "Enviar avaliacao"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </GoBarberLayout>
  );
}
