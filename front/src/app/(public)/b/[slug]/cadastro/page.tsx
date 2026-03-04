"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { genericaPublic } from "@/api/api";
import { AuthTokenService } from "@/lib/services/authToken";
import { formatPhoneBR, onlyDigits } from "@/lib/utils";
import { toast } from "react-toastify";

export default function CadastroClienteSlugPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const shopName = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "GoBarber";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "phone" ? formatPhoneBR(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    if (form.password.length < 3) {
      toast.error("A senha deve ter pelo menos 3 caracteres");
      return;
    }

    setLoading(true);
    try {
      const response = await genericaPublic({
        metodo: "POST",
        uri: "/public/register",
        data: {
          name: form.name,
          email: form.email,
          phone: onlyDigits(form.phone),
          password: form.password,
        },
      });

      if (response && response.status < 400) {
        const data = response.data;
        const rawToken = (data.token || "").replace(/^Bearer\s+/i, "");
        if (rawToken) {
          const [, payload] = rawToken.split(".");
          const decoded = JSON.parse(atob(payload));
          const currentTime = Math.floor(Date.now() / 1000);
          const expiresIn = decoded.exp - currentTime;

          AuthTokenService.setToken(rawToken, expiresIn);
          AuthTokenService.setUser({
            id: decoded.sub || decoded.id || "",
            nome: data.name || form.name,
            email: form.email,
            roles: [data.role || "CLIENT"],
          });

          toast.success("Conta criada com sucesso! Bem-vindo(a)!");
          router.push(`/b/${slug}/agendar`);
        } else {
          toast.success("Conta criada! Faça login para continuar.");
          router.push("/login");
        }
      } else {
        const msg = response?.data?.error || response?.data?.message || "Erro ao criar conta";
        toast.error(typeof msg === "string" ? msg : "Erro ao criar conta");
      }
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gobarber-gradient px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-5xl sm:text-6xl">💈</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3 sm:mt-4">
            {shopName}
          </h1>
          <p className="text-white/60 mt-2 text-sm sm:text-base">
            Crie sua conta para agendar
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="gobarber-label">Nome Completo *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="gobarber-input"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="gobarber-label">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="gobarber-input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="gobarber-label">Telefone *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="gobarber-input"
                placeholder="(81) 99999-9999"
                required
              />
            </div>

            <div>
              <label className="gobarber-label">Senha *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="gobarber-input"
                placeholder="Mínimo 3 caracteres"
                required
              />
            </div>

            <div>
              <label className="gobarber-label">Confirmar Senha *</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="gobarber-input"
                placeholder="Repita a senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gobarber-btn-primary py-3 text-base sm:text-lg"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="text-center mt-5 sm:mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[#E94560] font-semibold hover:underline">
                Faça login
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link
                href={`/b/${slug}/agendar`}
                className="text-[#1A1A2E] font-semibold hover:underline"
              >
                ← Voltar para agendamento
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
