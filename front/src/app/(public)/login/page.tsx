"use client";

import React, { useState, useContext, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "@/contexts/AuthContext";
import { AuthTokenService } from "@/lib/services/authToken";
import { toast } from "react-toastify";
import { FaUser, FaCut, FaArrowLeft } from "react-icons/fa";

type LoginMode = "cliente" | "staff";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("modo") === "staff" ? "staff" : "cliente";

  const auth = useContext(AuthContext);
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      await auth?.login({ email, senha });
      toast.success("Login realizado com sucesso!");
      const storedUser = AuthTokenService.getUser<{ roles?: string[] }>();
      const role = storedUser?.roles?.[0];

      if (mode === "cliente" || role === "CLIENT") {
        router.push("/meus-agendamentos");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gobarber-gradient px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl">💈</span>
          <h1 className="text-3xl font-bold text-white mt-4">GoBarber</h1>
          <p className="text-white/60 mt-2">Entre na sua conta</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs Cliente / Equipe */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setMode("cliente")}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                mode === "cliente"
                  ? "bg-white text-[#E94560] border-b-2 border-[#E94560]"
                  : "bg-gray-50 text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaUser />
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setMode("staff")}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                mode === "staff"
                  ? "bg-white text-[#1A1A2E] border-b-2 border-[#1A1A2E]"
                  : "bg-gray-50 text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaCut />
              Equipe / Staff
            </button>
          </div>

          <div className="p-8">
            {/* Subtítulo contextual */}
            <p className="text-sm text-gray-500 mb-5 text-center">
              {mode === "cliente"
                ? "Acesse seus agendamentos e histórico"
                : "Acesse o painel administrativo da barbearia"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="gobarber-label">
                  {mode === "cliente" ? "Email" : "Email ou Login"}
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === "cliente" ? "seu@email.com" : "admin@gobarber.com"}
                  className="gobarber-input"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="gobarber-label">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="gobarber-input"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-lg font-semibold rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === "cliente"
                    ? "bg-[#E94560] hover:bg-[#d73a52]"
                    : "bg-[#1A1A2E] hover:bg-[#2a2a4e]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {mode === "cliente" && (
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Não tem uma conta?{" "}
                  <Link
                    href="/register"
                    className="text-[#E94560] font-medium hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </p>
                <p className="text-gray-400 text-xs mt-3">
                  Ou agende sem cadastro pela{" "}
                  <Link
                    href={`/b/${process.env.NEXT_PUBLIC_SHOP_SLUG || "gobarber-principal"}/agendar`}
                    className="text-[#E94560] hover:underline"
                  >
                    página de agendamento
                  </Link>
                </p>
              </div>
            )}

            {mode === "staff" && (
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-xs">
                  Acesso restrito para administradores, barbeiros e secretárias.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Voltar */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-white/60 text-sm hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <FaArrowLeft /> Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center gobarber-gradient">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
