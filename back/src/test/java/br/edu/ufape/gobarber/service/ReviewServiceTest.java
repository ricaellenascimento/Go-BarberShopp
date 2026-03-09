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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private BarberRepository barberRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ReviewService reviewService;

    private Review review;
    private Client client;
    private Barber barber;
    private Appointment appointment;
    private ReviewCreateDTO reviewCreateDTO;

    @BeforeEach
    void setUp() {
        client = new Client();
        client.setIdClient(1L);
        client.setName("João Silva");
        client.setEmail("joao@email.com");
        client.setLoyaltyPoints(0);

        barber = new Barber();
        barber.setIdBarber(1);
        barber.setName("Carlos Barbeiro");

        appointment = new Appointment();
        appointment.setId(1);
        appointment.setClient(client);
        appointment.setBarber(barber);

        review = Review.builder()
                .idReview(1L)
                .client(client)
                .barber(barber)
                .rating(5)
                .comment("Ótimo atendimento!")
                .serviceRating(5)
                .punctualityRating(4)
                .cleanlinessRating(5)
                .valueRating(4)
                .wouldRecommend(true)
                .isVisible(true)
                .createdAt(LocalDateTime.now())
                .build();

        reviewCreateDTO = new ReviewCreateDTO();
        reviewCreateDTO.setClientId(1L);
        reviewCreateDTO.setBarberId(1);
        reviewCreateDTO.setRating(5);
        reviewCreateDTO.setComment("Ótimo atendimento!");
        reviewCreateDTO.setServiceRating(5);
        reviewCreateDTO.setPunctualityRating(4);
        reviewCreateDTO.setCleanlinessRating(5);
        reviewCreateDTO.setValueRating(4);
        reviewCreateDTO.setWouldRecommend(true);
    }

    @Test
    void testCreateReview_Success() throws DataBaseException {
        reviewCreateDTO.setAppointmentId(1);
        when(reviewRepository.findByAppointmentId(1)).thenReturn(Optional.empty());
        when(appointmentRepository.findById(1)).thenReturn(Optional.of(appointment));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(barberRepository.findById(1)).thenReturn(Optional.of(barber));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        ReviewDTO result = reviewService.createReview(reviewCreateDTO);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        assertEquals("Ótimo atendimento!", result.getComment());
        verify(reviewRepository, times(1)).save(any(Review.class));
        verify(clientRepository, times(1)).save(any(Client.class)); // Loyalty points
    }

    @Test
    void testCreateReview_ClientNotFound() {
        reviewCreateDTO.setAppointmentId(1);
        when(reviewRepository.findByAppointmentId(1)).thenReturn(Optional.empty());
        when(appointmentRepository.findById(1)).thenReturn(Optional.of(appointment));
        when(clientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.createReview(reviewCreateDTO));
    }

    @Test
    void testCreateReview_BarberNotFound() {
        reviewCreateDTO.setAppointmentId(1);
        when(reviewRepository.findByAppointmentId(1)).thenReturn(Optional.empty());
        when(appointmentRepository.findById(1)).thenReturn(Optional.of(appointment));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(barberRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.createReview(reviewCreateDTO));
    }

    @Test
    void testCreateReview_DuplicateAppointmentReview() throws DataBaseException {
        reviewCreateDTO.setAppointmentId(1);
        when(reviewRepository.findByAppointmentId(1)).thenReturn(Optional.of(review));

        assertThrows(DataBaseException.class, () -> reviewService.createReview(reviewCreateDTO));
    }

    @Test
    void testAddReply_Success() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        ReviewDTO result = reviewService.addReply(1L, "Obrigado pelo feedback!");

        assertNotNull(result);
        verify(reviewRepository, times(1)).findById(1L);
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    void testAddReply_NotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.addReply(1L, "Obrigado!"));
    }

    @Test
    void testHideReview_Success() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        reviewService.hideReview(1L);

        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    void testHideReview_NotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.hideReview(1L));
    }

    @Test
    void testShowReview_Success() {
        review.setIsVisible(false);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        reviewService.showReview(1L);

        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    void testGetReviewById_Success() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        ReviewDTO result = reviewService.getReviewById(1L);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        verify(reviewRepository, times(1)).findById(1L);
    }

    @Test
    void testGetReviewById_NotFound() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.getReviewById(1L));
    }

    @Test
    void testGetAllReviews_Success() {
        Page<Review> reviewPage = new PageImpl<>(Arrays.asList(review));
        when(reviewRepository.findByIsVisibleTrue(any(Pageable.class))).thenReturn(reviewPage);

        Page<ReviewDTO> result = reviewService.getAllReviews(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(reviewRepository, times(1)).findByIsVisibleTrue(any(Pageable.class));
    }

    @Test
    void testGetReviewsByBarber_Success() {
        Page<Review> reviewPage = new PageImpl<>(Arrays.asList(review));
        when(reviewRepository.findByBarberIdBarberAndIsVisibleTrue(eq(1), any(Pageable.class))).thenReturn(reviewPage);

        Page<ReviewDTO> result = reviewService.getReviewsByBarber(1, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetReviewsByClient_Success() {
        Page<Review> reviewPage = new PageImpl<>(Arrays.asList(review));
        when(reviewRepository.findByClientIdClient(eq(1L), any(Pageable.class))).thenReturn(reviewPage);

        Page<ReviewDTO> result = reviewService.getReviewsByClient(1L, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetAverageRatingByBarber_Success() {
        when(reviewRepository.averageRatingByBarber(1)).thenReturn(4.5);

        Double result = reviewService.getAverageRatingByBarber(1);

        assertEquals(4.5, result);
    }

    @Test
    void testGetAverageRatingByBarber_NoReviews() {
        when(reviewRepository.averageRatingByBarber(1)).thenReturn(null);

        Double result = reviewService.getAverageRatingByBarber(1);

        assertEquals(0.0, result);
    }

    @Test
    void testGetOverallAverageRating_Success() {
        when(reviewRepository.overallAverageRating()).thenReturn(4.2);

        Double result = reviewService.getOverallAverageRating();

        assertEquals(4.2, result);
    }

    @Test
    void testGetReviewCountByBarber_Success() {
        when(reviewRepository.countByBarber(1)).thenReturn(10L);

        Long result = reviewService.getReviewCountByBarber(1);

        assertEquals(10L, result);
    }

    // Testes da entidade Review
    @Test
    void testReviewEntity_DefaultValues() {
        Review newReview = new Review();

        assertTrue(newReview.getWouldRecommend());
        assertTrue(newReview.getIsVisible());
    }

    @Test
    void testReviewEntity_SetterGetter() {
        Review newReview = new Review();
        newReview.setRating(4);
        newReview.setComment("Bom serviço");
        newReview.setServiceRating(4);
        newReview.setPunctualityRating(5);
        newReview.setCleanlinessRating(4);
        newReview.setValueRating(3);
        newReview.setWouldRecommend(true);

        assertEquals(4, newReview.getRating());
        assertEquals("Bom serviço", newReview.getComment());
        assertEquals(4, newReview.getServiceRating());
        assertEquals(5, newReview.getPunctualityRating());
        assertEquals(4, newReview.getCleanlinessRating());
        assertEquals(3, newReview.getValueRating());
        assertTrue(newReview.getWouldRecommend());
    }

    @Test
    void testReviewEntity_AverageRating() {
        Review newReview = new Review();
        newReview.setRating(4);
        newReview.setServiceRating(5);
        newReview.setPunctualityRating(4);
        newReview.setCleanlinessRating(5);
        newReview.setValueRating(4);

        Double average = newReview.getAverageRating();

        assertNotNull(average);
        assertTrue(average > 0);
    }
}
