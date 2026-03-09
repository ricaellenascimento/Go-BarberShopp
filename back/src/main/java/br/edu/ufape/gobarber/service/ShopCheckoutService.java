package br.edu.ufape.gobarber.service;

import br.edu.ufape.gobarber.dto.client.ClientDTO;
import br.edu.ufape.gobarber.dto.shop.ShopCheckoutItemDTO;
import br.edu.ufape.gobarber.dto.shop.ShopCheckoutItemResultDTO;
import br.edu.ufape.gobarber.dto.shop.ShopCheckoutRequestDTO;
import br.edu.ufape.gobarber.dto.shop.ShopCheckoutResponseDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.model.Client;
import br.edu.ufape.gobarber.model.Payment;
import br.edu.ufape.gobarber.model.Product;
import br.edu.ufape.gobarber.model.ProductStock;
import br.edu.ufape.gobarber.model.Sale;
import br.edu.ufape.gobarber.repository.ClientRepository;
import br.edu.ufape.gobarber.repository.PaymentRepository;
import br.edu.ufape.gobarber.repository.ProductStockRepository;
import br.edu.ufape.gobarber.repository.SaleRepository;
import br.edu.ufape.gobarber.util.PixQrCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShopCheckoutService {

    private final ProductService productService;
    private final ProductStockRepository productStockRepository;
    private final ClientService clientService;
    private final ClientRepository clientRepository;
    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(rollbackFor = Exception.class)
    public ShopCheckoutResponseDTO checkout(ShopCheckoutRequestDTO request, HttpServletRequest httpRequest)
            throws DataBaseException {
        ClientDTO client = clientService.getClient(httpRequest);
        Client clientEntity = clientRepository.findById(client.getIdClient())
                .orElseThrow(() -> new DataBaseException("Cliente do pedido nao encontrado."));

        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Carrinho vazio.");
        }

        Map<Integer, Integer> groupedItems = groupItemsByProduct(request.getItems());
        List<ShopCheckoutItemResultDTO> itemResults = new ArrayList<>();
        double subtotal = 0.0;

        for (Map.Entry<Integer, Integer> entry : groupedItems.entrySet()) {
            Integer productId = entry.getKey();
            Integer requestedQty = entry.getValue();

            Product product = productService.getProductById(productId);
            List<ProductStock> stockEntries = productStockRepository.findByProductIdForUpdate(productId);

            int availableQty = stockEntries.stream()
                    .map(ProductStock::getQuantity)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();

            if (availableQty < requestedQty) {
                throw new IllegalArgumentException(
                        String.format("Estoque insuficiente para %s. Disponivel: %d.", product.getName(), availableQty));
            }

            int pendingDebit = requestedQty;
            for (ProductStock stock : stockEntries) {
                if (pendingDebit <= 0) {
                    break;
                }

                int currentQty = stock.getQuantity() == null ? 0 : stock.getQuantity();
                if (currentQty <= 0) {
                    continue;
                }

                int debit = Math.min(currentQty, pendingDebit);
                stock.setQuantity(currentQty - debit);
                pendingDebit -= debit;
            }

            if (pendingDebit > 0) {
                throw new IllegalStateException("Falha ao debitar estoque para o produto " + product.getName());
            }

            productStockRepository.saveAll(stockEntries);

            subtotal += product.getPrice() * requestedQty;
            itemResults.add(
                    ShopCheckoutItemResultDTO.builder()
                            .productId(productId)
                            .productName(product.getName())
                            .quantityPurchased(requestedQty)
                            .remainingStock(availableQty - requestedQty)
                            .build()
            );
        }

        String normalizedCoupon = normalizeCoupon(request.getCouponCode());
        double discount = calculateDiscount(normalizedCoupon, subtotal);
        double total = Math.max(subtotal - discount, 0.0);
        PaymentResolution payment = resolvePayment(request.getPaymentMethod());
        String orderCode = generateOrderCode();

        Payment savedPayment = saveShopPayment(
                clientEntity,
                request,
                orderCode,
                normalizedCoupon,
                subtotal,
                discount,
                payment,
                itemResults
        );

        return ShopCheckoutResponseDTO.builder()
                .orderCode(orderCode)
                .paymentId(savedPayment.getIdPayment())
                .clientId(client.getIdClient())
                .clientName(client.getName())
                .subtotal(roundCurrency(subtotal))
                .discount(roundCurrency(discount))
                .total(roundCurrency(total))
                .couponCode(normalizedCoupon)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(payment.status)
                .paymentMessage(payment.message)
                .pixCode(payment.pixCode)
                .pixQrCode(payment.pixQrCode)
                .items(itemResults)
                .build();
    }

    private Payment saveShopPayment(
            Client client,
            ShopCheckoutRequestDTO request,
            String orderCode,
            String couponCode,
            double subtotal,
            double discount,
            PaymentResolution payment,
            List<ShopCheckoutItemResultDTO> itemResults
    ) {
        Payment record = new Payment();
        record.setClient(client);
        record.setAmount(roundCurrency(subtotal));
        record.setCouponCode(couponCode);
        record.setCouponDiscount(roundCurrency(discount));
        record.setLoyaltyDiscount(0.0);
        record.setPaymentMethod(request.getPaymentMethod());
        record.setStatus(Payment.PaymentStatus.PENDING);
        record.setInstallments(1);
        record.setCommissionRate(0.0);
        record.setPixCode(payment.pixCode);
        record.setPixQrCode(payment.pixQrCode);
        record.setNotes(buildShopNotes(orderCode, itemResults, request.getNotes()));
        record.calculateFinalAmount();
        record.calculateCommission();
        return paymentRepository.save(record);
    }

    private String buildShopNotes(
            String orderCode,
            List<ShopCheckoutItemResultDTO> items,
            String checkoutNotes
    ) {
        StringJoiner itemSummary = new StringJoiner(", ");
        for (ShopCheckoutItemResultDTO item : items) {
            String label = item.getProductName() != null ? item.getProductName() : ("Produto#" + item.getProductId());
            itemSummary.add(label + " x" + item.getQuantityPurchased());
        }
        String notes = "Pedido Loja " + orderCode + " | Itens: " + itemSummary;
        if (checkoutNotes != null && !checkoutNotes.trim().isEmpty()) {
            notes += " | Obs: " + checkoutNotes.trim();
        }
        return notes;
    }

    private Map<Integer, Integer> groupItemsByProduct(List<ShopCheckoutItemDTO> items) {
        Map<Integer, Integer> grouped = new LinkedHashMap<>();
        for (ShopCheckoutItemDTO item : items) {
            if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Item invalido no carrinho.");
            }
            grouped.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }
        return grouped;
    }

    private String normalizeCoupon(String couponCode) {
        if (couponCode == null) {
            return null;
        }
        String normalized = couponCode.trim().toUpperCase();
        return normalized.isEmpty() ? null : normalized;
    }

    private double calculateDiscount(String couponCode, double subtotal) {
        if (couponCode == null) {
            return 0.0;
        }

        Sale sale = saleRepository.findByCoupon(couponCode)
                .orElseThrow(() -> new IllegalArgumentException("Cupom invalido."));

        LocalDate today = LocalDate.now();
        if (sale.getStartDate() != null && sale.getStartDate().isAfter(today)) {
            throw new IllegalArgumentException("Cupom ainda nao esta ativo.");
        }
        if (sale.getEndDate() != null && sale.getEndDate().isBefore(today)) {
            throw new IllegalArgumentException("Cupom expirado.");
        }

        return Math.min(sale.getTotalPrice(), subtotal);
    }

    private PaymentResolution resolvePayment(Payment.PaymentMethod method) {
        if (method == null) {
            throw new IllegalArgumentException("Metodo de pagamento e obrigatorio.");
        }

        switch (method) {
            case PIX:
                String pixCode = generatePixCode();
                return new PaymentResolution(
                        "PENDING_PAYMENT",
                        "Pagamento via PIX. Use o codigo para concluir o pagamento antes da retirada.",
                        pixCode,
                        generatePixQrCode(pixCode)
                );
            case CASH:
                return new PaymentResolution(
                        "PENDING_PICKUP",
                        "Pagamento em dinheiro na retirada.",
                        null,
                        null
                );
            case CREDIT_CARD:
                return new PaymentResolution(
                        "PENDING_CARD",
                        "Pagamento no cartao de credito sera realizado na retirada.",
                        null,
                        null
                );
            case DEBIT_CARD:
                return new PaymentResolution(
                        "PENDING_CARD",
                        "Pagamento no cartao de debito sera realizado na retirada.",
                        null,
                        null
                );
            case BANK_TRANSFER:
                return new PaymentResolution(
                        "PENDING_TRANSFER",
                        "Finalize a transferencia bancaria e apresente o comprovante na retirada.",
                        null,
                        null
                );
            default:
                throw new IllegalArgumentException("Metodo de pagamento nao suportado para compras na Loja.");
        }
    }

    private String generateOrderCode() {
        return "SHOP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String generatePixCode() {
        return "PIX-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24).toUpperCase();
    }

    private String generatePixQrCode(String payload) {
        return PixQrCodeUtil.toBase64Png(payload);
    }

    private double roundCurrency(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static class PaymentResolution {
        private final String status;
        private final String message;
        private final String pixCode;
        private final String pixQrCode;

        private PaymentResolution(String status, String message, String pixCode, String pixQrCode) {
            this.status = status;
            this.message = message;
            this.pixCode = pixCode;
            this.pixQrCode = pixQrCode;
        }
    }
}
