"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaClock,
  FaCut,
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
  idBarber?: number;
  name?: string;
}

interface Appointment {
  id: number;
  clientName?: string;
  barber?: BarberInfo;
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

/**
 * Converte "dd/MM/yyyy HH:mm" para Date
 */
function parseDateTime(raw: string): Date | null {
  if (/^\d{4}-/.test(raw)) return new Date(raw);
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
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

  async function resolveBookingSlug() {
    let loggedClientId: number | undefined;

    try {
      const loggedClientRes = await generica({ metodo: "GET", uri: "/client/logged-client" });
      if (loggedClientRes?.status === 200 && loggedClientRes?.data?.idClient) {
        loggedClientId = loggedClientRes.data.idClient;
      }
    } catch {
      // silencioso
    }

    if (loggedClientId) {
      try {
        const clientShopsRes = await generica({ metodo: "GET", uri: `/barbershop/client/${loggedClientId}` });
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
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </GoBarberLayout>
  );
}
