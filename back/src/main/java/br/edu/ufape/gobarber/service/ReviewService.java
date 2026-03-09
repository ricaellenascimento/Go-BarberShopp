package br.edu.ufape.gobarber.service;

import br.edu.ufape.gobarber.dto.review.ReviewCreateDTO;
import br.edu.ufape.gobarber.dto.review.ReviewDTO;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.exceptions.ResourceNotFoundException;
import br.edu.ufape.gobarber.model.Appointment;
import br.edu.ufape.gobarber.model.Barber;
import br.edu.ufape.gobarber.model.Client;
import br.edu.ufape.gobarber.model.Review;
import br.edu.ufape.gobarber.repository.AppointmentRepository;
import br.edu.ufape.gobarber.repository.BarberRepository;
import br.edu.ufape.gobarber.repository.ClientRepository;
import br.edu.ufape.gobarber.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ClientRepository clientRepository;
    private final BarberRepository barberRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public ReviewDTO createReview(ReviewCreateDTO dto) throws DataBaseException {
        if (dto.getAppointmentId() == null) {
            throw new DataBaseException("Agendamento obrigatorio para criar avaliacao");
        }

        if (reviewRepository.findByAppointmentId(dto.getAppointmentId()).isPresent()) {
            throw new DataBaseException("Ja existe avaliacao para este agendamento");
        }

        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento nao encontrado"));

        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nao encontrado"));
        if (appointment.getClient() == null || !appointment.getClient().getIdClient().equals(client.getIdClient())) {
            throw new DataBaseException("Cliente nao pertence ao agendamento informado");
        }

        Barber barber = barberRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new ResourceNotFoundException("Barbeiro nao encontrado"));
        if (appointment.getBarber() == null || !appointment.getBarber().getIdBarber().equals(barber.getIdBarber())) {
            throw new DataBaseException("Barbeiro nao corresponde ao agendamento informado");
        }

        Review review = new Review();
        review.setClient(client);
        review.setBarber(barber);
        review.setAppointment(appointment);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setServiceRating(dto.getServiceRating());
        review.setPunctualityRating(dto.getPunctualityRating());
        review.setCleanlinessRating(dto.getCleanlinessRating());
        review.setValueRating(dto.getValueRating());
        review.setWouldRecommend(dto.getWouldRecommend() != null ? dto.getWouldRecommend() : true);

        Review saved = reviewRepository.save(review);

        // Adiciona pontos de fidelidade por avaliar (5 pontos)
        client.addLoyaltyPoints(5);
        clientRepository.save(client);

        return ReviewDTO.fromEntity(saved);
    }
    @Transactional
    public ReviewDTO addReply(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        
        review.addReply(reply);
        return ReviewDTO.fromEntity(reviewRepository.save(review));
    }

    @Transactional
    public void hideReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        review.setIsVisible(false);
        reviewRepository.save(review);
    }

    @Transactional
    public void showReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        review.setIsVisible(true);
        reviewRepository.save(review);
    }

    public ReviewDTO getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação não encontrada"));
        return ReviewDTO.fromEntity(review);
    }

    public Page<ReviewDTO> getAllReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reviewRepository.findByIsVisibleTrue(pageable).map(ReviewDTO::fromEntity);
    }

    public Page<ReviewDTO> getReviewsByBarber(Integer barberId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reviewRepository.findByBarberIdBarberAndIsVisibleTrue(barberId, pageable)
                .map(ReviewDTO::fromEntity);
    }

    public Page<ReviewDTO> getReviewsByClient(Long clientId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reviewRepository.findByClientIdClient(clientId, pageable).map(ReviewDTO::fromEntity);
    }

    public Page<ReviewDTO> getTopReviewsByBarber(Integer barberId, int minRating, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository.findTopReviewsByBarber(barberId, minRating, pageable)
                .map(ReviewDTO::fromEntity);
    }

    // === Estatísticas ===

    public Double getAverageRatingByBarber(Integer barberId) {
        Double avg = reviewRepository.averageRatingByBarber(barberId);
        return avg != null ? avg : 0.0;
    }

    public Double getOverallAverageRating() {
        Double avg = reviewRepository.overallAverageRating();
        return avg != null ? avg : 0.0;
    }

    public Long getReviewCountByBarber(Integer barberId) {
        return reviewRepository.countByBarber(barberId);
    }

    public List<Object[]> getRatingDistributionByBarber(Integer barberId) {
        return reviewRepository.ratingDistributionByBarber(barberId);
    }

    public List<Object[]> getBarberRanking() {
        return reviewRepository.barberRankingByRating();
    }

    public Double getRecommendationRate() {
        Long recommended = reviewRepository.countWouldRecommend();
        Long total = reviewRepository.countTotal();
        if (total == 0) return 0.0;
        return (recommended.doubleValue() / total.doubleValue()) * 100;
    }

    public List<ReviewDTO> getPendingReplies() {
        return reviewRepository.findByReplyIsNullAndIsVisibleTrue().stream()
                .map(ReviewDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
