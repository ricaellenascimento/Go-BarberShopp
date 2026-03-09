package br.edu.ufape.gobarber.service;

import br.edu.ufape.gobarber.dto.payment.PaymentCreateDTO;
import br.edu.ufape.gobarber.dto.payment.PaymentDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.exceptions.ResourceNotFoundException;
import br.edu.ufape.gobarber.model.*;
import br.edu.ufape.gobarber.repository.*;
import br.edu.ufape.gobarber.util.PixQrCodeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final BarberRepository barberRepository;
    private final SaleRepository saleRepository;

    @Transactional
    public PaymentDTO createPayment(PaymentCreateDTO dto) throws DataBaseException {
        if (dto.getAppointmentId() == null) {
            throw new IllegalArgumentException("Agendamento e obrigatorio para registrar pagamento.");
        }

        Payment payment = new Payment();

        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setNotes(dto.getNotes());
        payment.setInstallments(dto.getInstallments() != null ? dto.getInstallments() : 1);

        // Appointment
        if (dto.getAppointmentId() != null) {
            Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agendamento não encontrado"));
            payment.setAppointment(appointment);
        }

        // Client
        if (dto.getClientId() != null) {
            Client client = clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));
            payment.setClient(client);

            // Desconto de fidelidade
            double loyaltyDiscount = dto.getAmount() * client.getLoyaltyDiscount();
            payment.setLoyaltyDiscount(loyaltyDiscount);
        }

        // Barber
        if (dto.getBarberId() != null) {
            Barber barber = barberRepository.findById(dto.getBarberId())
                    .orElseThrow(() -> new ResourceNotFoundException("Barbeiro não encontrado"));
            payment.setBarber(barber);
            
            // Comissão (padrão 30% se não especificado)
            double commissionRate = dto.getCommissionRate() != null ? dto.getCommissionRate() : 30.0;
            payment.setCommissionRate(commissionRate);
        }

        // Cupom
        if (dto.getCouponCode() != null && !dto.getCouponCode().isEmpty()) {
            Sale sale = saleRepository.findByCoupon(dto.getCouponCode())
                    .orElseThrow(() -> new DataBaseException("Cupom inválido"));
            
            // Verificar se cupom está válido
            LocalDateTime now = LocalDateTime.now();
            if (sale.getEndDate().isBefore(now.toLocalDate())) {
                throw new DataBaseException("Cupom expirado");
            }
            
            payment.setCouponCode(dto.getCouponCode());
            // Calcula desconto baseado no valor total da promoção
            double couponDiscount = sale.getTotalPrice(); // Valor do desconto
            payment.setCouponDiscount(couponDiscount);
        }

        // Dados do cartão
        if (dto.getCardLastDigits() != null) {
            payment.setCardLastDigits(dto.getCardLastDigits());
            payment.setCardBrand(dto.getCardBrand());
        }

        // Calcula valor final
        payment.calculateFinalAmount();
        payment.calculateCommission();

        // Gera código PIX se necessário
        if (dto.getPaymentMethod() == Payment.PaymentMethod.PIX) {
            String pixCode = generatePixCode();
            payment.setPixCode(pixCode);
            payment.setPixQrCode(generatePixQrCode(pixCode));
        }

        // Status inicial
        if (dto.getPaymentMethod() == Payment.PaymentMethod.CASH) {
            // Pagamento em dinheiro é confirmado imediatamente
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            payment.setPaymentDate(LocalDateTime.now());
            payment.setTransactionId(UUID.randomUUID().toString());
            
            // Registra pontos de fidelidade
            if (payment.getClient() != null) {
                int pointsEarned = (int) (payment.getFinalAmount() / 10);
                payment.setLoyaltyPointsEarned(pointsEarned);
                payment.getClient().addLoyaltyPoints(pointsEarned);
                payment.getClient().registerVisit(payment.getFinalAmount());
                clientRepository.save(payment.getClient());
            }
        } else {
            payment.setStatus(Payment.PaymentStatus.PENDING);
        }

        Payment saved = paymentRepository.save(payment);
        return PaymentDTO.fromEntity(saved);
    }

    @Transactional
    public PaymentDTO confirmPayment(Long paymentId, String transactionId) throws DataBaseException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new DataBaseException("Pagamento já foi processado");
        }

        payment.confirm(transactionId);

        // Registra pontos de fidelidade
        if (payment.getClient() != null) {
            int pointsEarned = (int) (payment.getFinalAmount() / 10);
            payment.setLoyaltyPointsEarned(pointsEarned);
            payment.getClient().addLoyaltyPoints(pointsEarned);
            payment.getClient().registerVisit(payment.getFinalAmount());
            clientRepository.save(payment.getClient());
        }

        return PaymentDTO.fromEntity(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentDTO cancelPayment(Long paymentId) throws DataBaseException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));

        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            throw new DataBaseException("Pagamento já concluído, use reembolso");
        }

        payment.cancel();
        return PaymentDTO.fromEntity(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentDTO refundPayment(Long paymentId) throws DataBaseException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));

        if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new DataBaseException("Apenas pagamentos concluídos podem ser reembolsados");
        }

        // Reverte pontos de fidelidade
        if (payment.getClient() != null && payment.getLoyaltyPointsEarned() > 0) {
            payment.getClient().addLoyaltyPoints(-payment.getLoyaltyPointsEarned());
            clientRepository.save(payment.getClient());
        }

        payment.refund();
        return PaymentDTO.fromEntity(paymentRepository.save(payment));
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));
        return PaymentDTO.fromEntity(payment);
    }

    public Page<PaymentDTO> getAllPayments(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return paymentRepository.findAll(pageable).map(PaymentDTO::fromEntity);
    }

    public Page<PaymentDTO> getPaymentsByClient(Long clientId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return paymentRepository.findByClientIdClient(clientId, pageable).map(PaymentDTO::fromEntity);
    }

    public Page<PaymentDTO> getPaymentsByBarber(Integer barberId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return paymentRepository.findByBarberIdBarber(barberId, pageable).map(PaymentDTO::fromEntity);
    }

    public Page<PaymentDTO> getPaymentsByStatus(Payment.PaymentStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return paymentRepository.findByStatus(status, pageable).map(PaymentDTO::fromEntity);
    }

    public Page<PaymentDTO> getPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("paymentDate").descending());
        return paymentRepository.findByDateRange(startDate, endDate, pageable).map(PaymentDTO::fromEntity);
    }

    // === Relatórios Financeiros ===

    public Double getTotalRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        Double revenue = paymentRepository.sumRevenueByDateRange(startDate, endDate);
        return revenue != null ? revenue : 0.0;
    }

    public Double getBarberCommission(Integer barberId, LocalDateTime startDate, LocalDateTime endDate) {
        Double commission = paymentRepository.sumCommissionByBarberAndDateRange(barberId, startDate, endDate);
        return commission != null ? commission : 0.0;
    }

    public Double getAverageTicket(LocalDateTime startDate, LocalDateTime endDate) {
        Double avg = paymentRepository.averageTicketByDateRange(startDate, endDate);
        return avg != null ? avg : 0.0;
    }

    public Long getTransactionCount(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.countCompletedByDateRange(startDate, endDate);
    }


    public List<Object[]> getRevenueByBarber(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.revenueByBarber(startDate, endDate);
    }

    // === Métodos para Controller ===

    public PaymentDTO findById(Long id) {
        return getPaymentById(id);
    }

    public Page<PaymentDTO> findAll(Pageable pageable) {
        return paymentRepository.findAll(pageable).map(PaymentDTO::fromEntity);
    }

    public PaymentDTO refundPayment(Long id, String reason) throws DataBaseException {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));

        if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new DataBaseException("Apenas pagamentos concluídos podem ser reembolsados");
        }

        // Reverte pontos de fidelidade
        if (payment.getClient() != null && payment.getLoyaltyPointsEarned() > 0) {
            payment.getClient().addLoyaltyPoints(-payment.getLoyaltyPointsEarned());
            clientRepository.save(payment.getClient());
        }

        payment.refund();
        payment.setNotes(reason);
        return PaymentDTO.fromEntity(paymentRepository.save(payment));
    }

    public PaymentDTO partialRefund(Long id, double amount, String reason) throws DataBaseException {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));

        if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new DataBaseException("Apenas pagamentos concluídos podem ser estornados");
        }

        if (amount > payment.getFinalAmount()) {
            throw new DataBaseException("Valor do estorno maior que o valor pago");
        }

        // Estorno parcial não implementado: apenas registra nota
        payment.setNotes("Estorno parcial (não implementado): " + reason);
        return PaymentDTO.fromEntity(paymentRepository.save(payment));
    }

    public String getPixCode(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));
        return payment.getPixCode();
    }

    public String getPixQrCode(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));
        String currentQrCode = payment.getPixQrCode();
        if (isBase64Image(currentQrCode)) {
            return currentQrCode;
        }

        String payload = currentQrCode;
        if (payload == null || payload.trim().isEmpty()) {
            payload = payment.getPixCode();
        }
        if (payload == null || payload.trim().isEmpty()) {
            return null;
        }

        String regeneratedQrCode = generatePixQrCode(payload);
        payment.setPixQrCode(regeneratedQrCode);
        paymentRepository.save(payment);
        return regeneratedQrCode;
    }

    public List<PaymentDTO> findByStatus(Payment.PaymentStatus status) {
        return paymentRepository.findByStatus(status, PageRequest.of(0, 100))
                .map(PaymentDTO::fromEntity)
                .getContent();
    }

    public List<PaymentDTO> findByMethod(Payment.PaymentMethod method) {
        return paymentRepository.findByPaymentMethod(method).stream()
                .map(PaymentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentDTO findByAppointment(Long appointmentId) {
        Payment payment = paymentRepository.findByAppointmentIdAppointment(appointmentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado"));
        return PaymentDTO.fromEntity(payment);
    }

    public List<PaymentDTO> findByClient(Long clientId) {
        return paymentRepository.findByClientIdClient(clientId, PageRequest.of(0, 100))
                .map(PaymentDTO::fromEntity)
                .getContent();
    }

    public List<PaymentDTO> findByBarber(Long barberId) {
        return paymentRepository.findByBarberIdBarber(barberId.intValue(), PageRequest.of(0, 100))
                .map(PaymentDTO::fromEntity)
                .getContent();
    }

    public List<PaymentDTO> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.findByDateRange(startDate, endDate, PageRequest.of(0, 100))
                .map(PaymentDTO::fromEntity)
                .getContent();
    }

    public Double getTodayRevenue() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(23, 59, 59);
        Double revenue = paymentRepository.sumRevenueByDateRange(start, end);
        return revenue != null ? revenue : 0.0;
    }

    public Double getMonthRevenue() {
        LocalDate now = LocalDate.now();
        LocalDateTime start = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime end = now.atTime(23, 59, 59);
        Double revenue = paymentRepository.sumRevenueByDateRange(start, end);
        return revenue != null ? revenue : 0.0;
    }

    public List<Map<String, Object>> getDailyRevenue(LocalDateTime start, LocalDateTime end) {
        List<Object[]> data = paymentRepository.dailyRevenue(start, end);
        return data.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", row[0]);
                    map.put("revenue", row[1]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    public Double getBarberRevenue(Long barberId, LocalDateTime start, LocalDateTime end) {
        Double revenue = paymentRepository.sumCommissionByBarberAndDateRange(barberId.intValue(), start, end);
        return revenue != null ? revenue : 0.0;
    }

    public Double getBarberCommission(Long barberId, LocalDateTime start, LocalDateTime end) {
        return getBarberCommission(barberId.intValue(), start, end);
    }

    public List<Map<String, Object>> getRevenueByPaymentMethod(LocalDateTime start, LocalDateTime end) {
        List<Object[]> data = paymentRepository.countAndSumByPaymentMethod(start, end);
        return data.stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("method", row[0]);
                    map.put("count", row[1]);
                    map.put("total", row[2]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    public Long countPayments(LocalDateTime start, LocalDateTime end) {
        return paymentRepository.countCompletedByDateRange(start, end);
    }

    public Long countPendingPayments() {
        return paymentRepository.countByStatus(Payment.PaymentStatus.PENDING);
    }

    // === Helpers ===

    private String generatePixCode() {
        return "PIX" + UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase();
    }

    private String generatePixQrCode(String payload) {
        return PixQrCodeUtil.toBase64Png(payload);
    }

    private boolean isBase64Image(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return false;
        }
        if (normalized.startsWith("data:image/")) {
            return true;
        }
        return normalized.length() > 120 && normalized.matches("^[A-Za-z0-9+/=\\r\\n]+$");
    }
}
