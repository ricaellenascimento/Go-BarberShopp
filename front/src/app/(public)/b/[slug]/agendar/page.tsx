"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { generica, genericaPublic } from "@/api/api";
import { toast } from "react-toastify";
import {
  FaCut,
  FaCalendarAlt,
  FaClock,
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaStar,
  FaEnvelope,
} from "react-icons/fa";
import { AuthTokenService } from "@/lib/services/authToken";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";

interface BarberService {
  id: number;
  name: string;
  description?: string;
  value?: number;
  time?: string | number;
}

interface BarberInfo {
  idBarber: number;
  name: string;
  contato?: string;
  start?: string;
  end?: string;
  services?: BarberService[];
}

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityData {
  barberId: number;
  barberName: string;
  date: string;
  availableSlots: TimeSlot[];
}

interface BarbershopPublicRef {
  slug?: string;
  active?: boolean;
}

export default function BarbershopBookingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [step, setStep] = useState(1);
  const [barbers, setBarbers] = useState<BarberInfo[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<BarberInfo | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  // Dados de verificação do cliente (email + telefone)
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    loadBarbers();
    checkAuth();
  }, [slug]);

  async function loadLoggedClientInfo() {
    const res = await generica({ metodo: "GET", uri: "/client/logged-client" });
    if (res?.status === 200 && res?.data) {
      if (res.data.email) setClientEmail(String(res.data.email));
      if (res.data.phone) setClientPhone(formatPhoneBR(String(res.data.phone)));
      if (res.data.name) setClientName(String(res.data.name));
    }
  }

  function checkAuth() {
    try {
      const token = AuthTokenService.getAccessToken();
      if (token) {
        setIsLoggedIn(true);
        const user = AuthTokenService.getUser<{ roles?: string[] }>();
        const role = user?.roles?.[0] || null;
        setUserRole(role);
        if (role === "CLIENT") {
          void loadLoggedClientInfo();
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } catch {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }

  async function fetchBarbersBySlug(shopSlug: string): Promise<BarberInfo[]> {
    if (!shopSlug) return [];
    const res = await genericaPublic({
      metodo: "GET",
      uri: `/public/barbershops/${shopSlug}/barbers`,
    });
    const data = res?.data?.content || res?.data || [];
    return Array.isArray(data) ? data : [];
  }

  async function loadBarbers() {
    if (!slug) {
      setBarbers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const testedSlugs = new Set<string>();
      const tryLoad = async (candidateSlug: string) => {
        const normalizedSlug = String(candidateSlug || "").trim();
        if (!normalizedSlug || testedSlugs.has(normalizedSlug)) return null;
        testedSlugs.add(normalizedSlug);

        const result = await fetchBarbersBySlug(normalizedSlug);
        if (result.length > 0) {
          return { slug: normalizedSlug, barbers: result };
        }
        return null;
      };

      let loaded = await tryLoad(slug);

      if (!loaded) {
        const shopsRes = await genericaPublic({
          metodo: "GET",
          uri: "/public/barbershops/search",
          params: { name: "" },
        });
        const shopsData = shopsRes?.data?.content || shopsRes?.data || [];
        const shops: BarbershopPublicRef[] = Array.isArray(shopsData) ? shopsData : [];
        const prioritizedSlugs = [
          ...shops.filter((shop) => shop.active !== false).map((shop) => shop.slug).filter(Boolean),
          ...shops.filter((shop) => shop.active === false).map((shop) => shop.slug).filter(Boolean),
        ] as string[];

        for (const candidateSlug of prioritizedSlugs) {
          loaded = await tryLoad(candidateSlug);
          if (loaded) break;
        }
      }

      if (loaded) {
        setBarbers(loaded.barbers);
        if (loaded.slug !== slug) {
          router.replace(`/b/${loaded.slug}/agendar`);
        }
      } else {
        setBarbers([]);
      }
    } catch {
      setBarbers([]);
      toast.error("Erro ao carregar barbeiros");
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(barberId: number, date: string) {
    setLoadingSlots(true);
    setAvailability(null);
    setSelectedSlot(null);
    try {
      const res = await genericaPublic({
        metodo: "GET",
        uri: `/public/barbers/${barberId}/availability`,
        params: { date },
      });
      if (res?.status === 200) {
        setAvailability(res.data);
      } else {
        toast.error("Erro ao carregar horários disponíveis");
      }
    } catch {
      toast.error("Erro ao carregar horários");
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSelectBarber(barber: BarberInfo) {
    setSelectedBarber(barber);
    setSelectedServices([]);
    setSelectedDate("");
    setSelectedSlot(null);
    setAvailability(null);
    setStep(2);
  }

  function toggleService(id: number) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
    if (selectedBarber) {
      loadAvailability(selectedBarber.idBarber, date);
    }
  }

  async function handleSubmitBooking() {
    const email = clientEmail.trim();
    const phone = onlyDigits(clientPhone);
    const needsContactData = !isLoggedIn || !email || !phone;

    // Validar dados de verificação
    if (needsContactData && (!email || !phone)) {
      toast.error("Preencha seu email e telefone para confirmar.");
      return;
    }

    if (!selectedBarber || selectedServices.length === 0 || !selectedDate || !selectedSlot) {
      toast.error("Preencha todas as informações");
      return;
    }

    setSubmitting(true);
    try {
      const startTime = `${selectedDate}T${selectedSlot.start}:00`;
      const res = await genericaPublic({
        metodo: "POST",
        uri: "/public/booking",
        data: {
          email,
          phone,
          name: clientName.trim() || undefined,
          barberId: selectedBarber.idBarber,
          serviceTypeIds: selectedServices,
          startTime,
        },
      });

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Agendamento solicitado com sucesso! Aguarde confirmação.");
        setStep(5);
      } else {
        const errorMsg = res?.data?.error || res?.data?.message || "Erro ao solicitar agendamento";
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const totalPrice =
    selectedBarber?.services
      ?.filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.value || 0), 0) || 0;
  const needsContactData = !isLoggedIn || !clientEmail.trim() || !clientPhone.trim();

  // Título da barbearia baseado no slug  
  const shopName = slug
    ? slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "GoBarber";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com identidade da barbearia */}
      <header className="gobarber-gradient text-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href={`/b/${slug}`} className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">💈</span>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{shopName}</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {isLoggedIn ? (
              <Link
                href="/meus-agendamentos"
                className="px-3 sm:px-5 py-2 bg-white text-[#1A1A2E] rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
              >
                Minha Conta
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 sm:px-5 py-2 text-white/90 hover:text-white font-medium transition-colors text-sm sm:text-base"
                >
                  Entrar
                </Link>
                <Link
                  href={`/b/${slug}/cadastro`}
                  className="px-3 sm:px-5 py-2 bg-white text-[#1A1A2E] rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Steps indicator — responsivo */}
        <div className="flex items-center justify-center mb-6 sm:mb-10">
          {["Barbeiro", "Serviços", "Horário", "Confirmar"].map((label, i) => (
            <React.Fragment key={i}>
              <div
                className={`flex items-center gap-1 sm:gap-2 ${
                  step > i + 1
                    ? "text-green-600"
                    : step === i + 1
                    ? "text-[#E94560]"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2
                    ${
                      step > i + 1
                        ? "bg-green-600 border-green-600 text-white"
                        : step === i + 1
                        ? "border-[#E94560] text-[#E94560]"
                        : "border-gray-300"
                    }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:block">{label}</span>
              </div>
              {i < 3 && (
                <div
                  className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                    step > i + 1 ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* =================== Step 1: Selecionar Barbeiro =================== */}
        {step === 1 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-4 sm:mb-6">
              Escolha seu Barbeiro
            </h2>
            {loading ? (
              <div className="text-center py-10 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E94560] mx-auto mb-3" />
                Carregando barbeiros...
              </div>
            ) : barbers.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                Nenhum barbeiro disponível
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {barbers.map((barber) => (
                  <button
                    key={barber.idBarber}
                    onClick={() => handleSelectBarber(barber)}
                    className="gobarber-card text-left hover:border-[#E94560]/50 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1A1A2E] rounded-full flex items-center justify-center text-white text-lg sm:text-xl shrink-0">
                        <FaCut />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-[#1A1A2E] group-hover:text-[#E94560] transition-colors truncate">
                          {barber.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {barber.start && barber.end
                            ? `${barber.start} - ${barber.end}`
                            : "Horário a consultar"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {barber.services?.length || 0} serviço(s)
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== Step 2: Selecionar Serviços =================== */}
        {step === 2 && selectedBarber && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-500 hover:text-[#E94560] mb-4 transition-colors text-sm"
            >
              <FaArrowLeft /> Voltar
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-1">
              Serviços de {selectedBarber.name}
            </h2>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
              Selecione os serviços desejados
            </p>

            {!selectedBarber.services || selectedBarber.services.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                Nenhum serviço disponível
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {selectedBarber.services.map((service) => (
                  <label
                    key={service.id}
                    className={`gobarber-card flex items-center justify-between cursor-pointer transition-all
                      ${
                        selectedServices.includes(service.id)
                          ? "border-[#E94560] bg-[#E94560]/5"
                          : "hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-[#E94560] rounded border-gray-300 focus:ring-[#E94560] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-[#1A1A2E] text-sm sm:text-base block truncate">
                          {service.name}
                        </span>
                        {service.description && (
                          <span className="text-xs text-gray-400 block truncate">
                            {service.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {service.value != null && (
                      <span className="font-bold text-[#E94560] text-sm sm:text-base ml-2 shrink-0">
                        R$ {service.value.toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-base sm:text-lg font-bold text-[#1A1A2E]">
                  Total: <span className="text-[#E94560]">R$ {totalPrice.toFixed(2)}</span>
                </div>
                <button onClick={() => setStep(3)} className="gobarber-btn-primary w-full sm:w-auto">
                  Escolher Horário →
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================== Step 3: Data e Horário =================== */}
        {step === 3 && selectedBarber && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-gray-500 hover:text-[#E94560] mb-4 transition-colors text-sm"
            >
              <FaArrowLeft /> Voltar
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-4 sm:mb-6 flex items-center gap-2">
              <FaCalendarAlt className="text-[#E94560]" /> Data e Horário
            </h2>

            <div className="gobarber-card mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="gobarber-input"
              />
            </div>

            {selectedDate && (
              <div className="gobarber-card">
                <h3 className="font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
                  <FaClock className="text-[#E94560]" /> Horários Disponíveis
                </h3>
                {loadingSlots ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E94560] mx-auto mb-2" />
                    Carregando...
                  </div>
                ) : availability && availability.availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availability.availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-2 sm:px-3 py-2 rounded-lg border text-sm font-medium transition-all
                          ${
                            selectedSlot?.start === slot.start
                              ? "bg-[#E94560] text-white border-[#E94560]"
                              : "border-gray-200 hover:border-[#E94560] hover:text-[#E94560]"
                          }`}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum horário disponível nesta data
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 flex justify-end">
                <button onClick={() => setStep(4)} className="gobarber-btn-primary w-full sm:w-auto">
                  Revisar Agendamento →
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================== Step 4: Confirmação =================== */}
        {step === 4 && selectedBarber && (
          <div>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 text-gray-500 hover:text-[#E94560] mb-4 transition-colors text-sm"
            >
              <FaArrowLeft /> Voltar
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-4 sm:mb-6">
              Confirme seu Agendamento
            </h2>

            <div className="gobarber-card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="text-xs text-gray-500">Barbeiro</span>
                  <p className="font-bold text-[#1A1A2E]">{selectedBarber.name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Data</span>
                  <p className="font-bold text-[#1A1A2E]">
                    {selectedDate
                      ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })
                      : ""}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Horário</span>
                  <p className="font-bold text-[#1A1A2E]">{selectedSlot?.start}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Valor Total</span>
                  <p className="font-bold text-[#E94560]">R$ {totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500">Serviços Selecionados</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedBarber.services
                    ?.filter((s) => selectedServices.includes(s.id))
                    .map((s) => (
                      <span
                        key={s.id}
                        className="px-3 py-1 bg-[#E94560]/10 text-[#E94560] rounded-full text-xs sm:text-sm font-medium"
                      >
                        {s.name}
                      </span>
                    ))}
                </div>
              </div>

              {needsContactData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 space-y-4">
                  <p className="text-blue-700 text-sm font-medium">
                    <FaUser className="inline mr-1" />
                    Informe seus dados para confirmar o agendamento:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        <FaEnvelope className="inline mr-1" /> Email *
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="gobarber-input text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        <FaPhone className="inline mr-1" /> Telefone *
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(formatPhoneBR(e.target.value))}
                        placeholder="(81) 99999-9999"
                        className="gobarber-input text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      <FaUser className="inline mr-1" /> Nome (opcional)
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome"
                      className="gobarber-input text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Usamos seu email e telefone apenas para identificar seu agendamento. Sem senha, sem burocracia.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedBarber(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Recomeçar
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="gobarber-btn-primary px-8"
                >
                  {submitting ? "Enviando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== Step 5: Sucesso =================== */}
        {step === 5 && (
          <div className="text-center py-10 sm:py-16">
            <div className="text-5xl sm:text-6xl mb-6">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E] mb-4">
              Solicitação Enviada!
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto mb-8">
              Você receberá um email de confirmação assim que o agendamento for aprovado.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/meus-agendamentos" className="gobarber-btn-outline px-6 py-2 w-full sm:w-auto text-center">
                Voltar ao Início
              </Link>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedBarber(null);
                  setSelectedServices([]);
                  setSelectedDate("");
                  setSelectedSlot(null);
                }}
                className="gobarber-btn-primary px-6 py-2 w-full sm:w-auto"
              >
                Novo Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
