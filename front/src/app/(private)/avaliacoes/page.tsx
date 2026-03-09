"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "react-toastify";
import {
  FaStar,
  FaRegStar,
  FaReply,
  FaEye,
  FaEyeSlash,
  FaTrophy,
  FaChartBar,
  FaThumbsUp,
  FaPlus,
} from "react-icons/fa";

interface Review {
  idReview: number;
  clientId?: number;
  clientName?: string;
  barberId?: number;
  barberName?: string;
  rating?: number;
  comment?: string;
  serviceRating?: number;
  punctualityRating?: number;
  cleanlinessRating?: number;
  valueRating?: number;
  averageRating?: number;
  wouldRecommend?: boolean;
  reply?: string;
  replyDate?: string;
  isVisible?: boolean;
  createdAt?: string;
}

interface Barber {
  idBarber: number;
  name?: string;
}

interface BarberRanking {
  barberId: number;
  barberName: string;
  avgRating: number;
  reviewCount: number;
}

interface AppointmentReviewOption {
  id: number;
  barberId: number;
  barberName: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

function parseDateTime(raw?: string): Date | null {
  if (!raw) return null;
  const value = String(raw).trim();

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

export default function AvaliacoesPage() {
  const { isAdmin, isSecretary, isClient } = useRoles();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews" | "ranking" | "pending" | "barber-detail">("reviews");

  // Stats
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [recRate, setRecRate] = useState<number | null>(null);

  // Ranking
  const [ranking, setRanking] = useState<BarberRanking[]>([]);

  // Pending replies
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);

  // Reply state
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Create review
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointmentOptions, setAppointmentOptions] = useState<AppointmentReviewOption[]>([]);
  const [loggedClientId, setLoggedClientId] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({
    appointmentId: 0,
    barberId: 0,
    rating: 5,
    comment: "",
    serviceRating: 5,
    punctualityRating: 5,
    cleanlinessRating: 5,
    valueRating: 5,
    wouldRecommend: true,
  });
  const [savingReview, setSavingReview] = useState(false);

  // Detail review
  const [detailReview, setDetailReview] = useState<Review | null>(null);

  // Barber detail stats
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [barberReviews, setBarberReviews] = useState<Review[]>([]);
  const [barberTopReviews, setBarberTopReviews] = useState<Review[]>([]);
  const [barberAvg, setBarberAvg] = useState<number | null>(null);
  const [barberCount, setBarberCount] = useState<number | null>(null);
  const [barberDistribution, setBarberDistribution] = useState<any>(null);
  useEffect(() => {
    async function bootstrap() {
      if (!isClient && !isAdmin && !isSecretary) return;

      if (isClient) {
        const clientId = await ensureLoggedClientId();
        if (clientId) {
          await loadClientReviews(clientId);
        } else {
          setReviews([]);
        }
      } else {
        await loadReviews();
        loadStats();
      }
    }

    bootstrap();
  }, [isAdmin, isSecretary, isClient]);

  useEffect(() => {
    if (activeTab === "ranking") loadRanking();
    if (activeTab === "pending") loadPending();
    if (activeTab === "barber-detail" && selectedBarberId) loadBarberDetail(selectedBarberId);
  }, [activeTab]);

  async function viewReviewDetail(id: number) {
    try {
      const res = await generica({ metodo: "GET", uri: `/review/${id}` });
      if (res?.data) setDetailReview(res.data);
    } catch { toast.error("Erro ao carregar detalhes"); }
  }

  async function loadBarberDetail(barberId: number) {
    setSelectedBarberId(barberId);
    try {
      const [reviewsRes, topRes, avgRes, countRes, distRes] = await Promise.all([
        generica({ metodo: "GET", uri: `/review/barber/${barberId}`, params: { page: 0, size: 50 } }).catch(() => null),
        generica({ metodo: "GET", uri: `/review/barber/${barberId}/top`, params: { minRating: 4, page: 0, size: 10 } }).catch(() => null),
        generica({ metodo: "GET", uri: `/review/barber/${barberId}/average` }).catch(() => null),
        generica({ metodo: "GET", uri: `/review/barber/${barberId}/count` }).catch(() => null),
        generica({ metodo: "GET", uri: `/review/barber/${barberId}/distribution` }).catch(() => null),
      ]);
      setBarberReviews(Array.isArray(reviewsRes?.data?.content || reviewsRes?.data) ? (reviewsRes?.data?.content || reviewsRes?.data) : []);
      setBarberTopReviews(Array.isArray(topRes?.data?.content || topRes?.data) ? (topRes?.data?.content || topRes?.data) : []);
      setBarberAvg(typeof avgRes?.data === "number" ? avgRes.data : null);
      setBarberCount(typeof countRes?.data === "number" ? countRes.data : null);
      setBarberDistribution(distRes?.data || null);
    } catch { /* silencioso */ }
  }

  async function loadClientReviews(clientId: number) {
    setLoading(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/review/client/${clientId}`, params: { page: 0, size: 50 } });
      const data = res?.data?.content || res?.data || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function ensureLoggedClientId(): Promise<number | null> {
    if (loggedClientId && Number.isInteger(loggedClientId) && loggedClientId > 0) {
      return loggedClientId;
    }
    try {
      const res = await generica({ metodo: "GET", uri: "/client/logged-client" });
      const id = Number(res?.data?.idClient);
      if (Number.isInteger(id) && id > 0) {
        setLoggedClientId(id);
        return id;
      }
      return null;
    } catch {
      return null;
    }
  }

  function formatAppointmentOptionLabel(option: AppointmentReviewOption): string {
    const dt = parseDateTime(option.startTime || option.endTime);
    const dateLabel = dt
      ? `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      : "Data indisponivel";
    return `#${option.id} - ${option.barberName} - ${dateLabel}`;
  }

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await generica({
        metodo: "GET",
        uri: "/review",
        params: { page: 0, size: 50 },
      });
      const data = response?.data?.content || response?.data || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const [avgRes, recRes] = await Promise.all([
        generica({ metodo: "GET", uri: "/review/stats/average" }),
        generica({ metodo: "GET", uri: "/review/stats/recommendation-rate" }),
      ]);
      setAvgRating(typeof avgRes?.data === "number" ? avgRes.data : null);
      setRecRate(typeof recRes?.data === "number" ? recRes.data : null);
    } catch {}
  }

  async function loadRanking() {
    try {
      const res = await generica({ metodo: "GET", uri: "/review/ranking/barbers" });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRanking(
        data.map((r: any) => ({
          barberId: r[0] || r.barberId,
          barberName: r[1] || r.barberName || "Barbeiro",
          avgRating: r[2] || r.avgRating || 0,
          reviewCount: r[3] || r.reviewCount || 0,
        }))
      );
    } catch {
      setRanking([]);
    }
  }

  async function loadPending() {
    try {
      const res = await generica({ metodo: "GET", uri: "/review/pending-reply" });
      setPendingReviews(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setPendingReviews([]);
    }
  }

  async function handleReply(reviewId: number) {
    if (!replyText.trim()) { toast.error("Digite uma resposta"); return; }
    setSendingReply(true);
    try {
      await generica({
        metodo: "POST",
        uri: `/review/${reviewId}/reply`,
        data: { reply: replyText },
      });
      toast.success("Resposta enviada!");
      setReplyingId(null);
      setReplyText("");
      loadReviews();
      if (activeTab === "pending") loadPending();
    } catch {
      toast.error("Erro ao enviar resposta");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleToggleVisibility(review: Review) {
    const endpoint = review.isVisible ? "hide" : "show";
    try {
      await generica({ metodo: "POST", uri: `/review/${review.idReview}/${endpoint}` });
      toast.success(review.isVisible ? "Avaliação ocultada" : "Avaliação visível");
      loadReviews();
    } catch {
      toast.error("Erro ao alterar visibilidade");
    }
  }

  async function openCreateModal() {
    let options: Barber[] = [];
    let availableAppointments: AppointmentReviewOption[] = [];

    if (isClient) {
      try {
        const clientId = await ensureLoggedClientId();
        const [appointmentsRes, reviewsRes] = await Promise.all([
          generica({ metodo: "GET", uri: "/appointments/my", params: { page: 0, size: 200 } }).catch(() => null),
          clientId
            ? generica({ metodo: "GET", uri: `/review/client/${clientId}`, params: { page: 0, size: 200 } }).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (clientId) {
          loadClientReviews(clientId);
        }

        const reviewedRaw = reviewsRes?.data?.content || reviewsRes?.data || [];
        const reviewedAppointmentIds = new Set<number>();
        if (Array.isArray(reviewedRaw)) {
          reviewedRaw.forEach((review: any) => {
            const appointmentId = Number(review?.appointmentId);
            if (Number.isInteger(appointmentId) && appointmentId > 0) {
              reviewedAppointmentIds.add(appointmentId);
            }
          });
        }

        const appointmentsRaw = appointmentsRes?.data?.content || appointmentsRes?.data || [];
        if (Array.isArray(appointmentsRaw)) {
          const now = new Date();
          const dedup = new Map<number, AppointmentReviewOption>();

          appointmentsRaw.forEach((apt: any) => {
            const appointmentId = Number(apt?.id ?? apt?.idAppointment);
            const barberId = Number(apt?.barber?.idBarber ?? apt?.barber?.id ?? apt?.barberId);
            if (!Number.isInteger(appointmentId) || appointmentId <= 0) return;
            if (!Number.isInteger(barberId) || barberId <= 0) return;
            if (reviewedAppointmentIds.has(appointmentId)) return;

            const status = String(apt?.status || "").toUpperCase();
            if (status === "CANCELLED" || status === "REJECTED") return;

            const compareDate = parseDateTime(apt?.endTime || apt?.startTime);
            const eligible = status === "COMPLETED" || !compareDate || compareDate < now;
            if (!eligible) return;

            const barberName = apt?.barber?.name || apt?.barberName || `Barbeiro #${barberId}`;
            dedup.set(appointmentId, {
              id: appointmentId,
              barberId,
              barberName,
              startTime: apt?.startTime,
              endTime: apt?.endTime,
              status,
            });
          });

          availableAppointments = Array.from(dedup.values()).sort((a, b) => {
            const da = parseDateTime(a.startTime || a.endTime)?.getTime() || 0;
            const db = parseDateTime(b.startTime || b.endTime)?.getTime() || 0;
            return db - da;
          });
        }

        const uniqueBarbers = new Map<number, Barber>();
        availableAppointments.forEach((apt) => {
          if (!uniqueBarbers.has(apt.barberId)) {
            uniqueBarbers.set(apt.barberId, { idBarber: apt.barberId, name: apt.barberName });
          }
        });
        options = Array.from(uniqueBarbers.values());
      } catch {
        // silencioso
      }
    }

    if (!isClient && options.length === 0) {
      try {
        const res = await generica({ metodo: "GET", uri: "/barber", params: { page: 0, size: 100 } });
        const data = res?.data?.content || res?.data || [];
        options = Array.isArray(data) ? data : [];
      } catch {
        // silencioso
      }
    }

    setAppointmentOptions(availableAppointments);
    setBarbers(options);

    if (isClient && availableAppointments.length === 0) {
      toast.info("Voce nao possui atendimentos elegiveis para avaliacao.");
      return;
    }

    if (!isClient && options.length === 0) {
      toast.info("Nao foi possivel listar barbeiros para avaliacao.");
    }

    const firstAppointment = availableAppointments[0];
    setReviewForm({
      appointmentId: firstAppointment?.id || 0,
      barberId: firstAppointment?.barberId || options[0]?.idBarber || 0,
      rating: 5,
      comment: "",
      serviceRating: 5,
      punctualityRating: 5,
      cleanlinessRating: 5,
      valueRating: 5,
      wouldRecommend: true,
    });
    setCreateModalOpen(true);
  }

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault();
    setSavingReview(true);
    try {
      let resolvedBarberId = Number(reviewForm.barberId);
      let resolvedAppointmentId: number | undefined;

      if (isClient) {
        const selectedAppointmentId = Number(reviewForm.appointmentId);
        if (!Number.isInteger(selectedAppointmentId) || selectedAppointmentId <= 0) {
          toast.error("Selecione o atendimento avaliado.");
          setSavingReview(false);
          return;
        }
        const selected = appointmentOptions.find((option) => option.id === selectedAppointmentId);
        if (!selected) {
          toast.error("Atendimento invalido para avaliacao.");
          setSavingReview(false);
          return;
        }
        resolvedBarberId = selected.barberId;
        resolvedAppointmentId = selectedAppointmentId;
      }

      if (!Number.isInteger(resolvedBarberId) || resolvedBarberId <= 0) {
        toast.error("Selecione um barbeiro");
        setSavingReview(false);
        return;
      }

      const clientId = await ensureLoggedClientId();
      if (!clientId) {
        toast.error("Nao foi possivel identificar o cliente logado.");
        setSavingReview(false);
        return;
      }
      const body: Record<string, any> = {
        clientId,
        barberId: resolvedBarberId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        serviceRating: reviewForm.serviceRating,
        punctualityRating: reviewForm.punctualityRating,
        cleanlinessRating: reviewForm.cleanlinessRating,
        valueRating: reviewForm.valueRating,
        wouldRecommend: reviewForm.wouldRecommend,
      };
      if (resolvedAppointmentId) {
        body.appointmentId = resolvedAppointmentId;
      }

      const res = await generica({ metodo: "POST", uri: "/review", data: body });
      if (res?.status === 200 || res?.status === 201) {
        toast.success("Avaliacao enviada!");
        setCreateModalOpen(false);
        if (resolvedAppointmentId) {
          setAppointmentOptions((prev) => prev.filter((option) => option.id !== resolvedAppointmentId));
        }
        if (isClient && clientId) {
          loadClientReviews(clientId);
        } else {
          loadReviews();
          loadStats();
        }
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

  const renderStars = (rating: number = 0, size = "text-base") =>
    Array.from({ length: 5 }, (_, i) =>
      i < rating ? (
        <FaStar key={i} className={`text-yellow-400 ${size}`} />
      ) : (
        <FaRegStar key={i} className={`text-gray-300 ${size}`} />
      )
    );

  const StarSelector = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)} className="p-1">
            {s <= value ? <FaStar className="text-yellow-400 text-lg" /> : <FaRegStar className="text-gray-300 text-lg" />}
          </button>
        ))}
      </div>
    </div>
  );

  const selectedAppointment = appointmentOptions.find((option) => option.id === Number(reviewForm.appointmentId));
  const reviewList = activeTab === "pending" ? pendingReviews : reviews;
  const tabs = isClient
    ? [{ key: "reviews" as const, label: "Minhas" }]
    : [
        { key: "reviews" as const, label: "Todas" },
        { key: "ranking" as const, label: "Ranking" },
        { key: "barber-detail" as const, label: "Por Barbeiro" },
        ...(isAdmin || isSecretary ? [{ key: "pending" as const, label: "Pendentes" }] : []),
      ];

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Avaliações</h1>
          {isClient && (
            <button onClick={openCreateModal} className="gobarber-btn-primary flex items-center gap-2">
              <FaPlus /> Nova Avaliação
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="gobarber-card flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-100"><FaStar className="text-yellow-600 text-lg" /></div>
            <div>
              <p className="text-xs text-gray-500">Média Geral</p>
              <p className="text-xl font-bold text-[#1A1A2E]">{avgRating?.toFixed(1) || "—"}</p>
            </div>
          </div>
          <div className="gobarber-card flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100"><FaThumbsUp className="text-green-600 text-lg" /></div>
            <div>
              <p className="text-xs text-gray-500">Recomendariam</p>
              <p className="text-xl font-bold text-[#1A1A2E]">{recRate != null ? `${recRate.toFixed(0)}%` : "—"}</p>
            </div>
          </div>
          <div className="gobarber-card flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100"><FaChartBar className="text-blue-600 text-lg" /></div>
            <div>
              <p className="text-xs text-gray-500">Total de Avaliações</p>
              <p className="text-xl font-bold text-[#1A1A2E]">{reviews.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-[#E94560] text-[#E94560]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.key === "pending" && pendingReviews.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{pendingReviews.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Ranking tab */}
        {activeTab === "ranking" ? (
          <div className="space-y-3">
            {ranking.length === 0 ? (
              <div className="gobarber-card text-center py-8 text-gray-400">Sem dados ainda</div>
            ) : (
              ranking.map((r, idx) => (
                <div key={r.barberId} className="gobarber-card flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-700" : "bg-gray-300"
                  }`}>
                    {idx < 3 ? <FaTrophy /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1A1A2E]">{r.barberName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(Math.round(r.avgRating), "text-sm")}</div>
                      <span className="text-sm text-gray-500">{r.avgRating.toFixed(1)} ({r.reviewCount} avaliações)</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedBarberId(r.barberId); setActiveTab("barber-detail"); loadBarberDetail(r.barberId); }} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">Ver detalhes</button>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "barber-detail" ? (
          <div className="space-y-4">
            <div className="gobarber-card">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecione um barbeiro</label>
              <div className="flex gap-2">
                <select value={selectedBarberId || ""} onChange={e => { const id = Number(e.target.value); if (id) loadBarberDetail(id); }} className="gobarber-input flex-1">
                  <option value="">Selecione...</option>
                  {ranking.map(r => <option key={r.barberId} value={r.barberId}>{r.barberName}</option>)}
                </select>
              </div>
            </div>
            {selectedBarberId && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="gobarber-card text-center"><p className="text-xl font-bold text-[#E94560]">{barberAvg?.toFixed(1) || "—"}</p><p className="text-xs text-gray-500">Média</p></div>
                  <div className="gobarber-card text-center"><p className="text-xl font-bold text-[#1A1A2E]">{barberCount ?? "—"}</p><p className="text-xs text-gray-500">Total Avaliações</p></div>
                  <div className="gobarber-card text-center"><p className="text-xl font-bold text-green-600">{barberTopReviews.length}</p><p className="text-xs text-gray-500">Top Avaliações</p></div>
                  <div className="gobarber-card text-center">
                    {barberDistribution ? (
                      <div className="space-y-1">
                        {[5,4,3,2,1].map(star => (
                          <div key={star} className="flex items-center gap-1 text-xs">
                            <span className="w-3">{star}</span><FaStar className="text-yellow-400 text-[10px]" />
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5"><div className="bg-yellow-400 h-1.5 rounded-full" style={{width: `${(barberDistribution[star] || barberDistribution[String(star)] || 0) / Math.max(barberCount || 1, 1) * 100}%`}} /></div>
                            <span className="w-5 text-right">{barberDistribution[star] || barberDistribution[String(star)] || 0}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400">Distribuição</p>}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700">Avaliações do barbeiro:</h4>
                {barberReviews.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma avaliação</p>
                ) : barberReviews.map(review => (
                  <div key={review.idReview} className="gobarber-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{review.clientName || "Cliente"}</span>
                      <div className="flex">{renderStars(review.rating, "text-sm")}</div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    <button onClick={() => viewReviewDetail(review.idReview)} className="text-xs text-blue-600 hover:underline mt-1">Ver detalhes</button>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* Reviews list */
          <div className="space-y-4">
            {loading && activeTab === "reviews" ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="gobarber-card animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))
            ) : reviewList.length === 0 ? (
              <div className="gobarber-card text-center py-12 text-gray-400">
                {activeTab === "pending" ? "Nenhuma avaliação pendente de resposta" : "Nenhuma avaliação ainda"}
              </div>
            ) : (
              reviewList.map((review) => (
                <div key={review.idReview} className={`gobarber-card ${review.isVisible === false ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#1A1A2E]">{review.clientName || "Cliente"}</h3>
                      <p className="text-sm text-gray-500">Barbeiro: {review.barberName || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                      {(isAdmin || isSecretary) && (
                        <button
                          onClick={() => handleToggleVisibility(review)}
                          className={`p-1.5 rounded ${review.isVisible ? "text-gray-400 hover:bg-gray-100" : "text-yellow-600 hover:bg-yellow-50"}`}
                          title={review.isVisible ? "Ocultar" : "Exibir"}
                        >
                          {review.isVisible ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-ratings */}
                  {(review.serviceRating || review.punctualityRating || review.cleanlinessRating || review.valueRating) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                      {review.serviceRating && <div><span className="text-gray-500">Serviço:</span> <span className="font-medium">{review.serviceRating}/5</span></div>}
                      {review.punctualityRating && <div><span className="text-gray-500">Pontualidade:</span> <span className="font-medium">{review.punctualityRating}/5</span></div>}
                      {review.cleanlinessRating && <div><span className="text-gray-500">Limpeza:</span> <span className="font-medium">{review.cleanlinessRating}/5</span></div>}
                      {review.valueRating && <div><span className="text-gray-500">Custo-benefício:</span> <span className="font-medium">{review.valueRating}/5</span></div>}
                    </div>
                  )}

                  {review.comment && <p className="text-gray-600 mb-3">{review.comment}</p>}
                  {review.wouldRecommend && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-2">
                      <FaThumbsUp className="text-xs" /> Recomenda
                    </span>
                  )}

                  {review.reply ? (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Resposta:</p>
                      <p className="text-sm text-gray-600">{review.reply}</p>
                      {review.replyDate && (
                        <p className="text-xs text-gray-400 mt-1">{new Date(review.replyDate).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                  ) : (isAdmin || isSecretary) ? (
                    replyingId === review.idReview ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="gobarber-input flex-1"
                          placeholder="Digite sua resposta..."
                        />
                        <button
                          onClick={() => handleReply(review.idReview)}
                          disabled={sendingReply}
                          className="gobarber-btn-primary text-sm"
                        >
                          {sendingReply ? "..." : "Enviar"}
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                          className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReplyingId(review.idReview); setReplyText(""); }}
                        className="text-sm text-[#E94560] hover:underline flex items-center gap-1 mt-2"
                      >
                        <FaReply /> Responder
                      </button>
                    )
                  ) : null}

                  {review.createdAt && (
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal detalhe avaliação */}
      <Modal isOpen={!!detailReview} onClose={() => setDetailReview(null)} title="Detalhes da Avaliação">
        {detailReview && (
          <div className="space-y-3">
            <p><strong>Cliente:</strong> {detailReview.clientName || "—"}</p>
            <p><strong>Barbeiro:</strong> {detailReview.barberName || "—"}</p>
            <div className="flex items-center gap-2"><strong>Nota Geral:</strong> <div className="flex">{renderStars(detailReview.rating)}</div></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {detailReview.serviceRating && <p>Serviço: {detailReview.serviceRating}/5</p>}
              {detailReview.punctualityRating && <p>Pontualidade: {detailReview.punctualityRating}/5</p>}
              {detailReview.cleanlinessRating && <p>Limpeza: {detailReview.cleanlinessRating}/5</p>}
              {detailReview.valueRating && <p>Custo-benefício: {detailReview.valueRating}/5</p>}
            </div>
            {detailReview.comment && <p><strong>Comentário:</strong> {detailReview.comment}</p>}
            {detailReview.reply && <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm font-medium text-gray-500">Resposta:</p><p className="text-sm">{detailReview.reply}</p></div>}
            {detailReview.createdAt && <p className="text-xs text-gray-400">{new Date(detailReview.createdAt).toLocaleDateString("pt-BR")}</p>}
          </div>
        )}
      </Modal>

      {/* Modal criar avaliação */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Nova Avaliação">
        <form onSubmit={handleCreateReview} className="space-y-4">
          {isClient ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atendimento *</label>
                <select
                  value={reviewForm.appointmentId}
                  onChange={(e) => {
                    const appointmentId = Number(e.target.value);
                    const option = appointmentOptions.find((item) => item.id === appointmentId);
                    setReviewForm({
                      ...reviewForm,
                      appointmentId,
                      barberId: option?.barberId || 0,
                    });
                  }}
                  className="gobarber-input"
                  required
                >
                  <option value={0}>Selecione...</option>
                  {appointmentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {formatAppointmentOptionLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro</label>
                <input
                  type="text"
                  value={selectedAppointment?.barberName || "Selecione um atendimento"}
                  className="gobarber-input bg-gray-50"
                  readOnly
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro *</label>
              <select
                value={reviewForm.barberId}
                onChange={(e) => setReviewForm({ ...reviewForm, barberId: Number(e.target.value) })}
                className="gobarber-input"
                required
              >
                <option value={0}>Selecione...</option>
                {barbers.map((b) => (
                  <option key={b.idBarber} value={b.idBarber}>{b.name || `Barbeiro #${b.idBarber}`}</option>
                ))}
              </select>
            </div>
          )}
          <StarSelector label="Avaliação Geral *" value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
          <div className="grid grid-cols-2 gap-4">
            <StarSelector label="Serviço" value={reviewForm.serviceRating} onChange={(v) => setReviewForm({ ...reviewForm, serviceRating: v })} />
            <StarSelector label="Pontualidade" value={reviewForm.punctualityRating} onChange={(v) => setReviewForm({ ...reviewForm, punctualityRating: v })} />
            <StarSelector label="Limpeza" value={reviewForm.cleanlinessRating} onChange={(v) => setReviewForm({ ...reviewForm, cleanlinessRating: v })} />
            <StarSelector label="Custo-benefício" value={reviewForm.valueRating} onChange={(v) => setReviewForm({ ...reviewForm, valueRating: v })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentário</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="gobarber-input"
              rows={3}
              placeholder="Conte como foi sua experiência..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reviewForm.wouldRecommend}
              onChange={(e) => setReviewForm({ ...reviewForm, wouldRecommend: e.target.checked })}
              className="w-4 h-4 accent-[#E94560]"
            />
            Eu recomendaria este barbeiro
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={savingReview} className="gobarber-btn-primary">
              {savingReview ? "Enviando..." : "Enviar Avaliação"}
            </button>
          </div>
        </form>
      </Modal>
    </GoBarberLayout>
  );
}
