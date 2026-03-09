package br.edu.ufape.gobarber.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShopCheckoutItemResultDTO {
    private Integer productId;
    private String productName;
    private Integer quantityPurchased;
    private Integer remainingStock;
}

