"use client";

import React, { useState, useContext, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import type { RoleKey } from "@/types/menu";
import {
  FaCalendarAlt,
  FaCut,
  FaUsers,
  FaBoxes,
  FaStar,
  FaChartBar,
  FaCreditCard,
  FaBell,
  FaClock,
  FaTags,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserTie,
  FaHome,
  FaClipboardList,
  FaUserShield,
  FaCalendarCheck,
  FaStore,
  FaMapMarkerAlt,
} from "react-icons/fa";

interface MenuEntry {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: RoleKey[];
}

const allMenuItems: MenuEntry[] = [
  // Admin / Secretária / Barbeiro — painel de gestão
  { path: "/dashboard",        label: "Dashboard",          icon: <FaHome />,           roles: ["ADMIN", "SECRETARY", "BARBER"] },
  { path: "/agendamentos",     label: "Agendamentos",       icon: <FaCalendarAlt />,    roles: ["ADMIN", "SECRETARY", "BARBER"] },
  { path: "/agenda-barbeiro",  label: "Agenda Barbeiro",    icon: <FaCalendarCheck />,  roles: ["ADMIN", "BARBER"] },
  { path: "/barbeiros",        label: "Barbeiros",          icon: <FaCut />,            roles: ["ADMIN", "SECRETARY"] },
  { path: "/secretarias",      label: "Secretárias",        icon: <FaUserShield />,     roles: ["ADMIN"] },
  { path: "/clientes",         label: "Clientes",           icon: <FaUsers />,          roles: ["ADMIN", "SECRETARY"] },
  { path: "/servicos",         label: "Serviços",           icon: <FaUserTie />,        roles: ["ADMIN"] },
  { path: "/produtos",         label: "Produtos & Estoque", icon: <FaBoxes />,          roles: ["ADMIN"] },
  { path: "/avaliacoes",       label: "Avaliações",         icon: <FaStar />,           roles: ["ADMIN", "BARBER", "CLIENT"] },
  { path: "/pagamentos",       label: "Pagamentos",         icon: <FaCreditCard />,     roles: ["ADMIN", "SECRETARY"] },
  { path: "/promocoes",        label: "Promoções & Cupons", icon: <FaTags />,           roles: ["ADMIN"] },
  { path: "/lista-espera",     label: "Lista de Espera",    icon: <FaClock />,          roles: ["ADMIN", "SECRETARY"] },
  { path: "/notificacoes",     label: "Notificações",       icon: <FaBell />,           roles: ["ADMIN", "SECRETARY", "BARBER", "CLIENT"] },
  { path: "/relatorios",       label: "Relatórios",         icon: <FaChartBar />,       roles: ["ADMIN"] },
  { path: "/barbearias",       label: "Barbearias",         icon: <FaStore />,          roles: ["ADMIN"] },
  { path: "/enderecos",         label: "Endereços",          icon: <FaMapMarkerAlt />,   roles: ["ADMIN", "SECRETARY"] },
  // Cliente — visão simplificada
  { path: "/meus-agendamentos", label: "Meus Agendamentos", icon: <FaClipboardList />,  roles: ["CLIENT"] },
  { path: "/loja",              label: "Loja",               icon: <FaStore />,          roles: ["CLIENT"] },
  { path: "/configuracoes",     label: "Configurações",      icon: <FaCog />,            roles: ["ADMIN", "SECRETARY", "BARBER", "CLIENT"] },
];

interface GoBarberLayoutProps {
  children: React.ReactNode;
}

export default function GoBarberLayout({ children }: GoBarberLayoutProps) {
  const pathname = usePathname();
  const auth = useContext(AuthContext);
  const { roles, canAccess, isClient } = useRoles();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtra itens do menu de acordo com as roles do usuário
  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      // ADMIN vê tudo (exceto itens exclusivos de CLIENT)
      if (roles.includes("ADMIN")) {
        return !item.roles.every((r) => r === "CLIENT");
      }
      return item.roles.some((r) => roles.includes(r));
    });
  }, [roles]);

  const handleLogout = async () => {
    await auth?.logout();
    window.location.href = "/login";
  };

  const currentTitle =
    menuItems.find((item) => pathname?.startsWith(item.path))?.label ||
    "GoBarber";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A1A2E] text-white 
                     transform transition-transform duration-300 ease-in-out flex flex-col
                     ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-2xl">💈</span>
            <span className="text-xl font-bold">GoBarber</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname?.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${
                        isActive
                          ? "bg-[#E94560] text-white shadow-lg shadow-[#E94560]/30"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#E94560] flex items-center justify-center text-sm font-bold">
              {auth?.user?.nome?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {auth?.user?.nome || "Usuário"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {(() => {
                  const r = auth?.user?.roles?.[0];
                  if (r === "ADMIN") return "Administrador";
                  if (r === "BARBER") return "Barbeiro";
                  if (r === "SECRETARY") return "Secretária";
                  if (r === "CLIENT") return "Cliente";
                  return r || "";
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-white/70 
                       hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <FaSignOutAlt />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 shrink-0"
            >
              <FaBars className="text-xl" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-[#1A1A2E] truncate">
              {currentTitle}
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              href="/notificacoes"
              className="relative p-2 text-gray-500 hover:text-[#1A1A2E] rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaBell className="text-lg" />
            </Link>
            {!isClient && (
              <Link
                href="/configuracoes"
                className="p-2 text-gray-500 hover:text-[#1A1A2E] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaCog className="text-lg" />
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
