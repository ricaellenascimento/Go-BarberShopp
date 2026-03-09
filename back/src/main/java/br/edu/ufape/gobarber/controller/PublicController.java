package br.edu.ufape.gobarber.controller;

import br.edu.ufape.gobarber.dto.appointment.AvailabilityDTO;
import br.edu.ufape.gobarber.dto.barbershop.BarbershopDTO;
import br.edu.ufape.gobarber.dto.barber.BarberWithServiceDTO;
import br.edu.ufape.gobarber.dto.client.ClientCreateDTO;
import br.edu.ufape.gobarber.dto.user.UserCreateDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.exceptions.InvalidRoleException;
import br.edu.ufape.gobarber.exceptions.UniqueConstraintViolationException;
import br.edu.ufape.gobarber.model.Appointment;
import br.edu.ufape.gobarber.model.Barber;
import br.edu.ufape.gobarber.model.Client;
import br.edu.ufape.gobarber.model.Services;
import br.edu.ufape.gobarber.model.login.User;
import br.edu.ufape.gobarber.security.TokenService;
import br.edu.ufape.gobarber.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final UserService userService;
    private final ClientService clientService;
    private final TokenService tokenService;
    private final BarbershopService barbershopService;
    private final BarberService barberService;
    private final AppointmentService appointmentService;
    private final ServicesService servicesService;

    /**
     * Registro público de cliente.
     * Recebe name, email, phone, password.
     * Cria um User com role CLIENT e um perfil de Client associado.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerClient(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        String password = body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return new ResponseEntity<>(Map.of("error", "Email e senha são obrigatórios"), HttpStatus.BAD_REQUEST);
        }

        log.info("Registro público de cliente: {}", email);

        // 1. Criar o User com role CLIENT
        UserCreateDTO userCreateDTO = new UserCreateDTO();
        userCreateDTO.setLogin(email);
        userCreateDTO.setPassword(password);
        userCreateDTO.setRole("CLIENT");

        try {
            userService.create(userCreateDTO);
        } catch (UniqueConstraintViolationException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.CONFLICT);
        } catch (InvalidRoleException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }

        // 2. Criar o perfil de Client
        try {
            ClientCreateDTO clientDTO = new ClientCreateDTO();
            clientDTO.setName(name != null && !name.isBlank() ? name : email);
            clientDTO.setEmail(email);
            clientDTO.setPhone(phone != null ? phone.replaceAll("\\D", "") : "0000000000");
            clientDTO.setPassword(password);
            clientService.createClient(clientDTO, null);
        } catch (Exception e) {
            log.warn("Perfil de cliente não pôde ser criado (usuário foi criado): {}", e.getMessage());
        }

        // 3. Auto-login: gerar token
        try {
            java.util.Optional<User> userOpt = userService.findByLogin(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String jwt = tokenService.gerarTokenJwt(user);
                String role = user.getRole().getAuthority().replace("ROLE_", "");

                Map<String, String> response = new HashMap<>();
                response.put("token", jwt);
                response.put("role", role);
                response.put("name", name != null ? name : "");

                return new ResponseEntity<>(response, HttpStatus.CREATED);
            }
        } catch (Exception e) {
            log.warn("Auto-login falhou após registro: {}", e.getMessage());
        }

        return new ResponseEntity<>(Map.of("message", "Conta criada com sucesso"), HttpStatus.CREATED);
    }

    // ==================== Barbearias Públicas ====================

    /**
     * Busca barbearias por nome (landing page).
     * GET /public/barbershops/search?name=xxx
     */
    @GetMapping("/barbershops/search")
    public ResponseEntity<List<BarbershopDTO>> searchBarbershops(
            @RequestParam(defaultValue = "") String name) {
        List<BarbershopDTO> results = barbershopService.searchBarbershops(name);
        return ResponseEntity.ok(results);
    }

    /**
     * Lista barbeiros de uma barbearia pelo slug.
     * GET /public/barbershops/{slug}/barbers
     */
    @GetMapping("/barbershops/{slug}/barbers")
    public ResponseEntity<List<BarberWithServiceDTO>> getBarbersBySlug(@PathVariable String slug) {
        try {
            List<Barber> barbers = barbershopService.getBarbersBySlug(slug);
            List<BarberWithServiceDTO> dtos = barbers.stream()
                    .map(b -> {
                        try {
                            return barberService.getBarber(b.getIdBarber());
                        } catch (DataBaseException e) {
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            if (dtos.isEmpty()) {
                return ResponseEntity.ok(barberService.getActiveBarbersForPublic());
            }
            return ResponseEntity.ok(dtos);
        } catch (DataBaseException e) {
            return ResponseEntity.ok(barberService.getActiveBarbersForPublic());
        }
    }

    // ==================== Barbeiros Públicos ====================

    /**
     * Detalhes de um barbeiro pelo ID.
     * GET /public/barbers/{id}
     */
    @GetMapping("/barbers/{id}")
    public ResponseEntity<BarberWithServiceDTO> getBarberById(@PathVariable Integer id) {
        try {
            BarberWithServiceDTO barber = barberService.getBarber(id);
            return ResponseEntity.ok(barber);
        } catch (DataBaseException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Horários disponíveis de um barbeiro em uma data.
     * GET /public/barbers/{barberId}/availability?date=2026-02-20
     */
    @GetMapping("/barbers/{barberId}/availability")
    public ResponseEntity<AvailabilityDTO> getBarberAvailability(
            @PathVariable Integer barberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            AvailabilityDTO availability = appointmentService.getBarberAvailability(barberId, date);
            return ResponseEntity.ok(availability);
        } catch (DataBaseException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==================== Agendamento Público ====================

    /**
     * Cria agendamento público (sem autenticação).
     * POST /public/booking
     */
    @PostMapping("/booking")
    public ResponseEntity<?> createPublicBooking(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            String phone = (String) body.get("phone");
            String name = (String) body.get("name");
            Integer barberId = body.get("barberId") instanceof Number
                    ? ((Number) body.get("barberId")).intValue() : null;
            String startTimeStr = (String) body.get("startTime");

            @SuppressWarnings("unchecked")
            List<Integer> serviceTypeIds = body.get("serviceTypeIds") instanceof List
                    ? ((List<?>) body.get("serviceTypeIds")).stream()
                        .map(s -> s instanceof Number ? ((Number) s).intValue() : Integer.parseInt(s.toString()))
                        .collect(java.util.stream.Collectors.toList())
                    : List.of();

            if (barberId == null || startTimeStr == null || serviceTypeIds.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "barberId, startTime e serviceTypeIds são obrigatórios"));
            }

            // Buscar barbeiro
            Barber barber = barberService.getBarberEntity(barberId);

            // Buscar serviços
            java.util.Set<Services> services = new java.util.HashSet<>();
            for (Integer serviceId : serviceTypeIds) {
                services.add(servicesService.getServiceEntity(serviceId));
            }

            // Calcular duração total dos serviços (em minutos)
            int totalMinutes = services.stream()
                    .mapToInt(s -> s.getTime() != null ? s.getTime().getHour() * 60 + s.getTime().getMinute() : 30)
                    .sum();

            // Calcular preço total
            double totalPrice = services.stream()
                    .mapToDouble(Services::getValue)
                    .sum();

            // Montar appointment
            Appointment appointment = new Appointment();
            appointment.setClientName(name != null ? name : (email != null ? email : "Cliente"));
            appointment.setClientNumber(phone != null ? phone : "");
            appointment.setBarber(barber);
            appointment.setServiceType(services);

            LocalDateTime startTime = LocalDateTime.parse(startTimeStr, 
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            appointment.setStartTime(startTime);
            appointment.setEndTime(startTime.plusMinutes(totalMinutes));
            appointment.setTotalPrice(totalPrice);
            appointment.setStatus(Appointment.AppointmentStatus.PENDING_APPROVAL);

            // Tentar associar cliente existente pelo email
            if (email != null && !email.isBlank()) {
                try {
                    var clientDTO = clientService.findByEmail(email);
                    if (clientDTO != null) {
                        // Buscar a entidade Client
                        Client clientEntity = new Client();
                        clientEntity.setIdClient(clientDTO.getIdClient());
                        appointment.setClient(clientEntity);
                    }
                } catch (Exception ignored) {
                    // Cliente não encontrado, prossegue sem associação
                }
            }

            var saved = appointmentService.savePublicAppointment(appointment);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (DataBaseException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao criar agendamento público: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao criar agendamento: " + e.getMessage()));
        }
    }
}
