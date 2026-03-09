package br.edu.ufape.gobarber.model;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade Payment - Representa um pagamento realizado.
 * Suporta múltiplos métodos de pagamento e status.
 */
@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_payment")
    private Long idPayment;

    @ManyToOne
    @JoinColumn(name = "appointment_id", nullable = true)
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "discount", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double discountAmount = 0.0;

    @Column(name = "discount_reason")
    private String discountReason;

    @Column(name = "final_amount", nullable = false)
    private Double finalAmount;

    @Column(name = "tip", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double tip = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "external_reference")
    private String externalReference;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "coupon_discount", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double couponDiscount = 0.0;

    @Column(name = "loyalty_discount", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double loyaltyDiscount = 0.0;

    @Column(name = "loyalty_points_used", columnDefinition = "INTEGER DEFAULT 0")
    private Integer loyaltyPointsUsed = 0;

    @Column(name = "loyalty_points_earned", columnDefinition = "INTEGER DEFAULT 0")
    private Integer loyaltyPointsEarned = 0;

    @Column(name = "notes")
    private String notes;

    // Dados do pagamento
    @Column(name = "pix_code")
    private String pixCode;

    @Column(name = "pix_qr_code")
    private String pixQrCode;

    @Column(name = "card_last_digits")
    private String cardLastDigits;

    @Column(name = "card_brand")
    private String cardBrand;

    @Column(name = "installments", columnDefinition = "INTEGER DEFAULT 1")
    private Integer installments = 1;

    // Comissão
    @ManyToOne
    @JoinColumn(name = "barber_id")
    private Barber barber;

    @Column(name = "commission_rate", columnDefinition = "DECIMAL(5,2) DEFAULT 0.00")
    private Double commissionRate = 0.0;

    @Column(name = "commission_amount", columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private Double commissionAmount = 0.0;

    // Reembolso
    @Column(name = "refund_amount")
    private Double refundAmount;

    @Column(name = "refund_reason")
    private String refundReason;

    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    // Datas
    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        calculateFinalAmount();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Calcula o valor final após descontos.
     */
    public void calculateFinalAmount() {
        double totalDiscount = (couponDiscount != null ? couponDiscount : 0.0) + 
                               (loyaltyDiscount != null ? loyaltyDiscount : 0.0);
        this.discountAmount = totalDiscount;
        this.finalAmount = Math.max(0, amount - totalDiscount);
    }

    /**
     * Calcula a comissão do barbeiro.
     */
    public void calculateCommission() {
        if (commissionRate != null && finalAmount != null) {
            this.commissionAmount = finalAmount * (commissionRate / 100);
        }
    }

    /**
     * Confirma o pagamento.
     */
    public void confirm(String transactionId) {
        this.status = PaymentStatus.COMPLETED;
        this.transactionId = transactionId;
        this.paymentDate = LocalDateTime.now();
    }

    /**
     * Cancela o pagamento.
     */
    public void cancel() {
        this.status = PaymentStatus.CANCELLED;
    }

    /**
     * Reembolsa o pagamento.
     */
    public void refund() {
        this.status = PaymentStatus.REFUNDED;
    }

    // Enums
    public enum PaymentMethod {
        CASH,           // Dinheiro
        CREDIT_CARD,    // Cartão de Crédito
        DEBIT_CARD,     // Cartão de Débito
        PIX,            // PIX
        BANK_TRANSFER,  // Transferência
        LOYALTY_POINTS  // Pontos de fidelidade
    }

    public enum PaymentStatus {
        PENDING,        // Aguardando pagamento
        PROCESSING,     // Processando
        COMPLETED,      // Concluído
        FAILED,         // Falhou
        CANCELLED,      // Cancelado
        REFUNDED        // Reembolsado
    }
}
