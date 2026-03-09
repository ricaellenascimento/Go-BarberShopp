package br.edu.ufape.gobarber.dto.shop;

import br.edu.ufape.gobarber.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ShopCheckoutRequestDTO {

    @NotEmpty(message = "Carrinho vazio")
    private List<@Valid ShopCheckoutItemDTO> items;

    @NotNull(message = "Metodo de pagamento e obrigatorio")
    private Payment.PaymentMethod paymentMethod;

    private String couponCode;
    private String notes;
}

