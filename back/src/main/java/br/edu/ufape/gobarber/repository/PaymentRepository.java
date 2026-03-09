package br.edu.ufape.gobarber.repository;

import br.edu.ufape.gobarber.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Page<Payment> findByClientIdClient(Long clientId, Pageable pageable);

    Page<Payment> findByBarberIdBarber(Integer barberId, Pageable pageable);

    List<Payment> findByAppointmentId(Integer appointmentId);

    Optional<Payment> findByTransactionId(String transactionId);

    Page<Payment> findByStatus(Payment.PaymentStatus status, Pageable pageable);

    Page<Payment> findByPaymentMethod(Payment.PaymentMethod method, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE COALESCE(p.paymentDate, p.createdAt) BETWEEN :startDate AND :endDate")
    Page<Payment> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.barber.idBarber = :barberId AND " +
           "p.paymentDate BETWEEN :startDate AND :endDate")
    List<Payment> findByBarberAndDateRange(
            @Param("barberId") Integer barberId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Relatórios Financeiros
    @Query("SELECT SUM(p.finalAmount) FROM Payment p WHERE p.status = 'COMPLETED' AND " +
           "p.paymentDate BETWEEN :startDate AND :endDate")
    Double sumRevenueByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(p.commissionAmount) FROM Payment p WHERE p.barber.idBarber = :barberId AND " +
           "p.status = 'COMPLETED' AND p.paymentDate BETWEEN :startDate AND :endDate")
    Double sumCommissionByBarberAndDateRange(
            @Param("barberId") Integer barberId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.finalAmount) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' AND p.paymentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY p.paymentMethod")
    List<Object[]> countAndSumByPaymentMethod(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(value = "SELECT DATE(p.payment_date) as payment_day, SUM(p.final_amount) FROM gobarber.payment p " +
           "WHERE p.status = 'COMPLETED' AND p.payment_date BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(p.payment_date) ORDER BY DATE(p.payment_date)", nativeQuery = true)
    List<Object[]> dailyRevenue(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' AND " +
           "p.paymentDate BETWEEN :startDate AND :endDate")
    Long countCompletedByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(p.finalAmount) FROM Payment p WHERE p.status = 'COMPLETED' AND " +
           "p.paymentDate BETWEEN :startDate AND :endDate")
    Double averageTicketByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.barber.idBarber, p.barber.name, SUM(p.finalAmount), SUM(p.commissionAmount) " +
           "FROM Payment p WHERE p.status = 'COMPLETED' AND " +
           "p.paymentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY p.barber.idBarber, p.barber.name")
    List<Object[]> revenueByBarber(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Métodos para Controller
    List<Payment> findByPaymentMethod(Payment.PaymentMethod method);

    @Query("SELECT p FROM Payment p WHERE p.appointment.id = :appointmentId")
    Optional<Payment> findByAppointmentIdAppointment(@Param("appointmentId") Integer appointmentId);

    Long countByStatus(Payment.PaymentStatus status);
}
