"use client";

import GoBarberLayout from "@/components/Layout/GoBarberLayout";
import Modal from "@/components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { generica } from "@/api/api";
import { toast } from "react-toastify";
import {
  FaShoppingCart,
  FaSearch,
  FaBoxOpen,
  FaStar,
  FaTag,
} from "react-icons/fa";

interface Product {
  id: number;
  name?: string;
  description?: string;
  brand?: string;
  price?: number;
  size?: string;
  quantity?: number; // computed from stock
}

interface CartItem {
  product: Product;
  qty: number;
}

type CheckoutPaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";

export default function LojaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("PIX");
  const [finalizingOrder, setFinalizingOrder] = useState(false);

  // Promotional coupons
  const [activeSales, setActiveSales] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    loadProducts();
    loadActiveSales();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await generica({
        metodo: "GET",
        uri: "/product",
        params: { page: 0, size: 100 },
      });
      const data = response?.data?.content || response?.data || [];
      const prods: Product[] = Array.isArray(data) ? data : [];

      // Fetch stock totals for each product in parallel
      const withStock = await Promise.all(
        prods.map(async (p) => {
          try {
            const sRes = await generica({
              metodo: "GET",
              uri: `/stock/product/${p.id}`,
              params: { page: 0, size: 100 },
            });
            const stockData = sRes?.data?.content || sRes?.data || [];
            const entries = Array.isArray(stockData) ? stockData : [];
            const totalQty = entries.reduce((sum: number, e: any) => sum + (e.quantity || 0), 0);
            return { ...p, quantity: totalQty };
          } catch {
            return { ...p, quantity: 0 };
          }
        })
      );
      setProducts(withStock);
    } catch {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveSales() {
    try {
      const res = await generica({
        metodo: "GET",
        uri: "/sale/valid",
        params: { page: 0, size: 10 },
      });
      const data = res?.data?.content || res?.data || [];
      setActiveSales(Array.isArray(data) ? data : []);
    } catch {}
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.qty >= (product.quantity ?? 0)) {
          toast.warning("Quantidade máxima disponível");
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  // GET /sale/coupon/{coupon} — validate coupon code
  async function validateCoupon() {
    if (!couponCode.trim()) { toast.error("Digite um cupom"); return; }
    setValidatingCoupon(true);
    try {
      const res = await generica({ metodo: "GET", uri: `/sale/coupon/${couponCode.trim()}` });
      if (res?.data) {
        setAppliedCoupon(res.data);
        toast.success(`Cupom "${res.data.coupon || couponCode}" aplicado!`);
      } else {
        toast.error("Cupom inválido");
      }
    } catch {
      toast.error("Cupom não encontrado ou expirado");
    } finally {
      setValidatingCoupon(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
  }

  function updateCartQty(productId: number, qty: number) {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId ? { ...c, qty: Math.min(qty, c.product.quantity ?? qty) } : c
      )
    );
  }

  const cartTotal = cart.reduce((sum, c) => sum + (c.product.price ?? 0) * c.qty, 0);
  // API Sale returns totalPrice (fixed discount amount), not discountPercentage
  const discount = appliedCoupon?.discountPercentage
    ? cartTotal * (appliedCoupon.discountPercentage / 100)
    : appliedCoupon?.totalPrice
      ? Math.min(appliedCoupon.totalPrice, cartTotal)
      : 0;
  const cartFinal = Math.max(cartTotal - discount, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    return (
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );
  });

  const availableProducts = filteredProducts.filter((p) => (p.quantity ?? 0) > 0);
  const unavailableProducts = filteredProducts.filter((p) => (p.quantity ?? 0) === 0);
  async function handleFinalizeCheckout() {
    if (cart.length === 0) { toast.error("Carrinho vazio"); return; }
    setFinalizingOrder(true);
    try {
      const checkoutPayload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.qty,
        })),
        paymentMethod,
        couponCode: appliedCoupon?.coupon || couponCode.trim() || undefined,
      };

      const res = await generica({
        metodo: "POST",
        uri: "/shop/checkout",
        data: checkoutPayload,
      });

      if (res?.status === 200 && res?.data) {
        const paymentMessage = res.data.paymentMessage ? ` ${res.data.paymentMessage}` : "";
        const pixMessage = res.data.pixCode ? ` Codigo PIX: ${res.data.pixCode}` : "";
        const paymentRef = res.data.paymentId ? ` Pagamento #${res.data.paymentId}.` : "";
        const total = Number(res.data.total ?? cartFinal);
        toast.success(
          `Pedido ${res.data.orderCode || ""} registrado! Total: R$ ${total.toFixed(2)}.${paymentMessage}${paymentRef}${pixMessage}`
        );
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode("");
        setCartOpen(false);
        await loadProducts();
      } else {
        const errorMessage =
          res?.data?.message ||
          res?.data?.error ||
          "Nao foi possivel finalizar o pedido";
        toast.error(errorMessage);
      }
    } catch {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setFinalizingOrder(false);
    }
  }

  return (
    <GoBarberLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Loja da Barbearia</h1>
            <p className="text-sm text-gray-500 mt-1">Produtos disponíveis para compra</p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative gobarber-btn-primary flex items-center gap-2"
          >
            <FaShoppingCart />
            Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Active promotions banner */}
        {activeSales.length > 0 && (
          <div className="overflow-x-auto flex gap-3 pb-2">
            {activeSales.map((sale: any) => (
              <div key={sale.id || sale.idSale} className="min-w-[250px] bg-gradient-to-r from-[#E94560] to-[#0F3460] rounded-xl p-4 text-white shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <FaTag /> <span className="text-sm font-medium">{sale.name}</span>
                </div>
                <p className="text-2xl font-bold">R$ {sale.totalPrice?.toFixed(2)}</p>
                {sale.coupon && (
                  <p className="text-xs mt-1 bg-white/20 rounded px-2 py-0.5 inline-block">
                    Cupom: {sale.coupon}
                  </p>
                )}
                {sale.endDate && (
                  <p className="text-xs mt-1 opacity-80">
                    Até {new Date(sale.endDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gobarber-input pl-10"
            placeholder="Buscar produto..."
          />
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gobarber-card animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : availableProducts.length === 0 && unavailableProducts.length === 0 ? (
          <div className="gobarber-card text-center py-12 text-gray-400">
            <FaBoxOpen className="text-4xl mx-auto mb-3" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableProducts.map((p) => (
                <div
                  key={p.id}
                  className="gobarber-card hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-3xl font-bold text-gray-300 group-hover:text-[#E94560] transition">
                      {p.name?.charAt(0)?.toUpperCase() || "P"}
                    </span>
                  </div>
                  <h3 className="font-medium text-[#1A1A2E] truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {p.brand || "Sem marca"} {p.size ? `• ${p.size}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#E94560]">
                      R$ {p.price?.toFixed(2)}
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {p.quantity} disponíveis
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="w-full mt-3 py-2 bg-[#1A1A2E] text-white rounded-lg text-sm font-medium hover:bg-[#0F3460] transition flex items-center justify-center gap-2"
                  >
                    <FaShoppingCart className="text-xs" /> Adicionar
                  </button>
                </div>
              ))}
            </div>

            {unavailableProducts.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-gray-400 mt-6">Esgotados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-50">
                  {unavailableProducts.map((p) => (
                    <div key={p.id} className="gobarber-card">
                      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-3xl font-bold text-gray-200">{p.name?.charAt(0)?.toUpperCase() || "P"}</span>
                      </div>
                      <h3 className="font-medium text-gray-500 truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{p.brand || "Sem marca"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-400">R$ {p.price?.toFixed(2)}</span>
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Esgotado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Product detail modal */}
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name || "Produto"}>
        {selectedProduct && (
          <div className="space-y-4">
            <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
              <span className="text-5xl font-bold text-gray-300">{selectedProduct.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#E94560]">R$ {selectedProduct.price?.toFixed(2)}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${(selectedProduct.quantity ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {(selectedProduct.quantity ?? 0) > 0 ? `${selectedProduct.quantity} em estoque` : "Esgotado"}
              </span>
            </div>
            {selectedProduct.brand && <p className="text-sm text-gray-500">Marca: {selectedProduct.brand}</p>}
            {selectedProduct.size && <p className="text-sm text-gray-500">Tamanho: {selectedProduct.size}</p>}
            {selectedProduct.description && <p className="text-gray-600">{selectedProduct.description}</p>}
            {(selectedProduct.quantity ?? 0) > 0 && (
              <button
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                className="w-full gobarber-btn-primary flex items-center justify-center gap-2"
              >
                <FaShoppingCart /> Adicionar ao Carrinho
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Cart modal */}
      <Modal isOpen={cartOpen} onClose={() => setCartOpen(false)} title="Carrinho">
        <div className="space-y-4">
          {cart.length === 0 ? (
            <p className="text-center py-8 text-gray-400">Carrinho vazio</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">R$ {item.product.price?.toFixed(2)} un.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="w-7 h-7 rounded bg-gray-200 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      className="w-7 h-7 rounded bg-gray-200 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#E94560] w-20 text-right">
                    R$ {((item.product.price ?? 0) * item.qty).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-semibold text-[#1A1A2E]">Subtotal:</span>
                <span className="text-lg font-bold text-gray-600">R$ {cartTotal.toFixed(2)}</span>
              </div>
              {/* Coupon input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="gobarber-input flex-1 text-sm"
                  placeholder="Código do cupom"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button onClick={removeCoupon} className="px-3 py-1 text-red-600 bg-red-50 rounded-lg text-sm">Remover</button>
                ) : (
                  <button onClick={validateCoupon} disabled={validatingCoupon} className="px-3 py-1 bg-[#0F3460] text-white rounded-lg text-sm">
                    {validatingCoupon ? "..." : "Aplicar"}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Desconto ({appliedCoupon.discountPercentage ? `${appliedCoupon.discountPercentage}%` : `R$ ${appliedCoupon.totalPrice?.toFixed(2) || '0.00'}`})</span>
                  <span>-R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1A1A2E]">Total:</span>
                <span className="text-xl font-bold text-[#E94560]">R$ {cartFinal.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as CheckoutPaymentMethod)}
                  className="gobarber-input text-sm"
                >
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartao de Credito</option>
                  <option value="DEBIT_CARD">Cartao de Debito</option>
                  <option value="CASH">Dinheiro</option>
                </select>
                <p className="text-xs text-gray-500">
                  {paymentMethod === "PIX"
                    ? "Ao finalizar, voce recebe o codigo PIX."
                    : "Pagamento sera concluido na retirada do pedido."}
                </p>
              </div>
              <button
                onClick={handleFinalizeCheckout}
                disabled={finalizingOrder}
                className="w-full gobarber-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {finalizingOrder ? "Finalizando..." : "Finalizar Pedido"}
              </button>
              <p className="text-xs text-center text-gray-400">
                O pedido será registrado e você poderá retirá-lo na barbearia.
              </p>
            </>
          )}
        </div>
      </Modal>
    </GoBarberLayout>
  );
}

