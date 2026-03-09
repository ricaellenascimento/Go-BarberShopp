package br.edu.ufape.gobarber.dto.shop;

import br.edu.ufape.gobarber.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShopCheckoutResponseDTO {
    private String orderCode;
    private Long paymentId;
    private Long clientId;
    private String clientName;
    private Double subtotal;
    private Double discount;
    private Double total;
    private String couponCode;
    private Payment.PaymentMethod paymentMethod;
    private String paymentStatus;
    private String paymentMessage;
    private String pixCode;
    private String pixQrCode;
    private List<ShopCheckoutItemResultDTO> items;
}
