package br.edu.ufape.gobarber.controller;

import br.edu.ufape.gobarber.dto.shop.ShopCheckoutRequestDTO;
import br.edu.ufape.gobarber.dto.shop.ShopCheckoutResponseDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.service.ShopCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/shop")
@Validated
@RequiredArgsConstructor
public class ShopController {

    private final ShopCheckoutService shopCheckoutService;

    @PostMapping("/checkout")
    public ResponseEntity<ShopCheckoutResponseDTO> checkout(
            @Valid @RequestBody ShopCheckoutRequestDTO request,
            HttpServletRequest httpRequest) throws DataBaseException {
        return ResponseEntity.ok(shopCheckoutService.checkout(request, httpRequest));
    }
}

