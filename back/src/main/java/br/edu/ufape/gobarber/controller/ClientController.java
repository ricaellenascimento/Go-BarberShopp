
package br.edu.ufape.gobarber.controller;

import br.edu.ufape.gobarber.doc.ClientControllerDoc;
import br.edu.ufape.gobarber.dto.client.ClientCreateDTO;
import br.edu.ufape.gobarber.dto.client.ClientDTO;
import br.edu.ufape.gobarber.dto.page.PageDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.exceptions.NotFoundException;
import br.edu.ufape.gobarber.model.Barber;
import br.edu.ufape.gobarber.model.Client;
import br.edu.ufape.gobarber.repository.BarberRepository;
import br.edu.ufape.gobarber.repository.ClientRepository;
import br.edu.ufape.gobarber.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/client")
@Validated
@RequiredArgsConstructor
public class ClientController implements ClientControllerDoc {

        private final ClientService clientService;
        private final ClientRepository clientRepository;
        private final BarberRepository barberRepository;

        @Override
        @GetMapping("/top-spenders")
        public ResponseEntity<List<ClientDTO>> getTopSpenders(@RequestParam(defaultValue = "10") int limit) {
            return ResponseEntity.ok(clientService.getTopClients(limit));
        }

    @Override
    @GetMapping("/inactive-clients")
    public ResponseEntity<List<ClientDTO>> getInactiveClients(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(clientService.getInactiveClients(days));
    }

    @Override
    @GetMapping("/{id}/loyalty-discount")
    public ResponseEntity<Double> getLoyaltyDiscount(@PathVariable Long id) throws NotFoundException {
        ClientDTO client = clientService.findById(id);
        if (client == null) {
            throw new NotFoundException("Cliente não encontrado");
        }
        // Desconto baseado no tier: BRONZE=0%, SILVER=5%, GOLD=7%, PLATINUM=10%, DIAMOND=15%
        double discount = switch (client.getLoyaltyTier()) {
            case DIAMOND -> 0.15;
            case PLATINUM -> 0.10;
            case GOLD -> 0.07;
            case SILVER -> 0.05;
            case BRONZE -> 0.0;
        };
        return ResponseEntity.ok(discount);
    }

    @Override
    @GetMapping("/by-loyalty-tier/{tier}")
    public ResponseEntity<List<ClientDTO>> getByLoyaltyTier(@PathVariable Client.LoyaltyTier tier) {
        return ResponseEntity.ok(clientService.getClientsByLoyaltyTier(tier));
    }

    @Override
    @GetMapping("/birthdays/today")
    public ResponseEntity<List<ClientDTO>> getBirthdayClientsToday() {
        return ResponseEntity.ok(clientService.getBirthdayClients());
    }

    @Override
    @GetMapping("/birthdays/month")
    public ResponseEntity<List<ClientDTO>> getBirthdayClientsMonth(@RequestParam(required = false) Integer month) {
        if (month == null) month = java.time.LocalDate.now().getMonthValue();
        return ResponseEntity.ok(clientService.getClientsWithBirthdayInMonth(month));
    }

    @Override
    @GetMapping("/clients-for-promotions")
    public ResponseEntity<List<ClientDTO>> getClientsForPromotions() {
        return ResponseEntity.ok(clientService.getClientsForPromotions());
    }

    @Override
    @GetMapping("/total-clients")
    public ResponseEntity<Long> getTotalClients() {
        return ResponseEntity.ok(clientRepository.count());
    }

    @Override
    @GetMapping("/active-clients")
    public ResponseEntity<Long> getActiveClients() {
        long active = clientRepository.findByActiveTrue(org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
        return ResponseEntity.ok(active);
    }

    @Override
    @GetMapping("/loyalty-distribution")
    public ResponseEntity<?> getLoyaltyDistribution() {
        List<Object[]> stats = clientService.getClientsByLoyaltyTierStats();
        Map<String, Long> distribution = new HashMap<>();
        for (Object[] row : stats) {
            String tier = row[0] != null ? row[0].toString() : "UNKNOWN";
            Long count = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
            distribution.put(tier, count);
        }
        return ResponseEntity.ok(distribution);
    }

    @Override
    @PostMapping("/{id}/preferred-barber/{barberId}")
    public ResponseEntity<ClientDTO> setPreferredBarber(@PathVariable Long id, @PathVariable Long barberId) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        Barber barber = barberRepository.findById(barberId.intValue())
                .orElseThrow(() -> new RuntimeException("Barbeiro não encontrado"));
        client.setPreferredBarber(barber);
        Client saved = clientRepository.save(client);
        return ResponseEntity.ok(ClientDTO.fromEntity(saved));
    }

    @Override
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClientDTO> create(
            @RequestPart("client") ClientCreateDTO dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo) throws DataBaseException {
        ClientDTO created = clientService.create(dto, photo);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/create-without-photo")
    public ResponseEntity<ClientDTO> createWithoutPhoto(@Valid @RequestBody ClientCreateDTO dto)
            throws DataBaseException {
        ClientDTO created = clientService.create(dto, null);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @Override
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClientDTO> update(
            @PathVariable Long id,
            @RequestPart("client") ClientCreateDTO dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo)
            throws NotFoundException, DataBaseException {
        ClientDTO updated = clientService.update(id, dto, photo);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(value = "/logged-client", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClientDTO> updateLoggedClient(
            HttpServletRequest request,
            @RequestPart("client") ClientCreateDTO dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo)
            throws DataBaseException {
        ClientDTO loggedClient = clientService.getClient(request);
        ClientDTO updated = clientService.update(loggedClient.getIdClient(), dto, photo);
        return ResponseEntity.ok(updated);
    }

    @Override
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws NotFoundException, DataBaseException {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> findById(@PathVariable Long id) throws NotFoundException {
        return ResponseEntity.ok(clientService.findById(id));
    }

    @GetMapping("/logged-client")
    public ResponseEntity<ClientDTO> getLoggedClientInfo(HttpServletRequest request) throws DataBaseException {
        return ResponseEntity.ok(clientService.getClient(request));
    }

    @GetMapping("/logged-client/photo")
    public ResponseEntity<byte[]> getLoggedClientPhoto(HttpServletRequest request) throws DataBaseException {
        byte[] photo = clientService.getProfilePhoto(request);
        if (photo == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(photo);
    }

    @Override
    @GetMapping
    public ResponseEntity<PageDTO<ClientDTO>> findAll(Pageable pageable) {
        Page<ClientDTO> page = clientService.findAll(pageable);
        PageDTO<ClientDTO> pageDTO = PageDTO.fromPage(page);
        return ResponseEntity.ok(pageDTO);
    }

    @Override
    @GetMapping("/email/{email}")
    public ResponseEntity<ClientDTO> findByEmail(@PathVariable String email) throws NotFoundException {
        return ResponseEntity.ok(clientService.findByEmail(email));
    }

    @Override
    @GetMapping("/phone/{phone}")
    public ResponseEntity<ClientDTO> findByPhone(@PathVariable String phone) throws NotFoundException {
        return ResponseEntity.ok(clientService.findByPhone(phone));
    }

    @Override
    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<ClientDTO> findByCpf(@PathVariable String cpf) throws NotFoundException {
        return ResponseEntity.ok(clientService.findByCpf(cpf));
    }

    @Override
    @GetMapping("/search")
    public ResponseEntity<List<ClientDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(clientService.searchByName(name));
    }

    @Override
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id) throws NotFoundException {
        byte[] photo = clientService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(photo);
    }

    @Override
    @PutMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> updatePhoto(
            @PathVariable Long id,
            @RequestPart("photo") MultipartFile photo) throws NotFoundException, DataBaseException {
        clientService.updatePhoto(id, photo);
        return ResponseEntity.ok().build();
    }

    @Override
    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) throws NotFoundException {
        clientService.deletePhoto(id);
        return ResponseEntity.ok().build();
    }

    // === Programa de Fidelidade ===

    @Override
    @PostMapping("/{id}/loyalty/add")
    public ResponseEntity<ClientDTO> addLoyaltyPoints(
            @PathVariable Long id,
            @RequestParam int points,
            @RequestParam(required = false) String reason) throws NotFoundException {
        return ResponseEntity.ok(clientService.addLoyaltyPoints(id, points, reason));
    }

    @Override
    @PostMapping("/{id}/loyalty/redeem")
    public ResponseEntity<ClientDTO> redeemLoyaltyPoints(
            @PathVariable Long id,
            @RequestParam int points) throws NotFoundException {
        return ResponseEntity.ok(clientService.redeemLoyaltyPoints(id, points));
    }

    @Override
    @PostMapping("/{id}/visit")
    public ResponseEntity<ClientDTO> registerVisit(
            @PathVariable Long id,
            @RequestParam double amount) throws NotFoundException {
        return ResponseEntity.ok(clientService.registerVisit(id, amount));
    }

    @GetMapping("/top-clients")
    public ResponseEntity<List<ClientDTO>> getTopClients(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(clientService.getTopClients(limit));
    }

    @GetMapping("/vip")
    public ResponseEntity<List<ClientDTO>> getVipClients() {
        return ResponseEntity.ok(clientService.getVipClients());
    }

    @GetMapping("/birthdays")
    public ResponseEntity<List<ClientDTO>> getBirthdaysThisMonth() {
        return ResponseEntity.ok(clientService.getClientsWithBirthdayThisMonth());
    }

    @Override
    @GetMapping("/preferred-barber/{barberId}")
    public ResponseEntity<List<ClientDTO>> getClientsByPreferredBarber(@PathVariable Long barberId) {
        List<ClientDTO> clients = clientService.getClientsByPreferredBarber(barberId);
        return ResponseEntity.ok(clients);
    }
}
