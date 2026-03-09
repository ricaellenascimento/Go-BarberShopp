package br.edu.ufape.gobarber.service;

import br.edu.ufape.gobarber.dto.appointment.AppointmentCreateDTO;
import br.edu.ufape.gobarber.dto.appointment.AppointmentDTO;
import br.edu.ufape.gobarber.dto.appointment.AppointmentRequestDTO;
import br.edu.ufape.gobarber.dto.appointment.AvailabilityDTO;
import br.edu.ufape.gobarber.dto.page.PageAppointmentDTO;
import br.edu.ufape.gobarber.exceptions.AppointmentException;
import br.edu.ufape.gobarber.exceptions.DataBaseException;
import br.edu.ufape.gobarber.model.Appointment;
import br.edu.ufape.gobarber.model.Barber;
import br.edu.ufape.gobarber.model.Client;
import br.edu.ufape.gobarber.model.Services;
import br.edu.ufape.gobarber.model.login.User;
import br.edu.ufape.gobarber.repository.AppointmentRepository;
import br.edu.ufape.gobarber.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BarberService barberService;
    private final ServicesService servicesService;
    private final UserService userService;
    private final ClientRepository clientRepository;
    private final NotificationService notificationService;

    public PageAppointmentDTO getHistoryFromToken(Integer page, Integer size, HttpServletRequest request) throws DataBaseException {
        String token = request.getHeader("Authorization");
        Optional<User> user = userService.findById(userService.getJtiFromToken(token));

        if (user.isPresent()){
            Barber barber = barberService.getBarberEntity(user.get());

            return getHistoryByBarber(page, size, barber.getIdBarber());

        }
        throw new DataBaseException("Não existe perfil de barbeiro associado a esse login");
    }

    public PageAppointmentDTO getFutureAppointments(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp =  appointmentRepository.findByStartTimeAfterOrderByStartTime(pageable, LocalDateTime.now());
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    public PageAppointmentDTO getFutureAppointments(Integer page, Integer size, HttpServletRequest request) throws DataBaseException {
        String token = request.getHeader("Authorization");
        Optional<User> user = userService.findById(userService.getJtiFromToken(token));
        Barber barber = null;
        if (user.isPresent()){
           barber = barberService.getBarberEntity(user.get());
        }

        return getPageAppointmentDTO(page, size, barber);
    }

    public PageAppointmentDTO getFutureAppointments(Integer page, Integer size, Integer barberId) throws DataBaseException {
        Barber barber = barberService.getBarberEntity(barberId);

        return getPageAppointmentDTO(page, size, barber);
    }

    private PageAppointmentDTO getPageAppointmentDTO(Integer page, Integer size, Barber barber) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp =  appointmentRepository.findByBarberAndStartTimeAfterOrderByStartTime(pageable, barber, LocalDateTime.now());
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    public PageAppointmentDTO getHistoryByBarber(Integer page, Integer size, Integer barberId) throws DataBaseException {
        Barber barber = barberService.getBarberEntity(barberId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp =  appointmentRepository.findByBarberAndEndTimeBeforeOrderByStartTime(pageable,  barber, LocalDateTime.now());
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    // Salvar novo agendamento
    public AppointmentDTO saveAppointment(AppointmentCreateDTO appointmentCreateDTO) throws AppointmentException, DataBaseException {
        // Verifica se existe um agendamento no mesmo espaço de horário

       Appointment appointment = convertDTOtoEntity(appointmentCreateDTO);

       try {
           if (isValidAppointment(appointment)) {
               return convertEntityToDTO(appointmentRepository.save(appointment));
           }
       } catch (AppointmentException e){
           throw new AppointmentException(e.getMessage());
       }

       return null;
    }

    // Atualizar agendamento existente
    @Transactional
    public AppointmentDTO updateAppointment(Integer id, AppointmentCreateDTO appointmentCreateDTO) throws DataBaseException, AppointmentException {

        Appointment appointment = appointmentRepository.findById(id).orElseThrow(() -> new DataBaseException("Não existe agentamento com o id informado"));

        Appointment appointmentUpdate = convertDTOtoEntity(appointmentCreateDTO);

        appointment.setClientName(appointmentUpdate.getClientName());
        appointment.setClientNumber(appointmentUpdate.getClientNumber());
        appointment.setBarber(appointmentUpdate.getBarber());
        appointment.setServiceType(appointmentUpdate.getServiceType());
        appointment.setStartTime(appointmentUpdate.getStartTime());
        appointment.setEndTime(appointmentUpdate.getEndTime());
        appointment.setTotalPrice(appointmentUpdate.getTotalPrice());

        try {
            if (isValidAppointment(appointment)) {
                return convertEntityToDTO(appointmentRepository.save(appointment));
            }
        } catch (AppointmentException e){
            throw new AppointmentException(e.getMessage());
        }

        return null;
    }

    // Obter todos os agendamentos
    public PageAppointmentDTO getAllAppointments(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp = appointmentRepository.findAllByOrderByStartTimeAsc(pageable);
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    // Obter agendamentos por barbeiro
    public PageAppointmentDTO getAppointmentsByBarber(Integer barberid, Integer page, Integer size) throws DataBaseException {
        Barber barber = barberService.getBarberEntity(barberid);

        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp =  appointmentRepository.findByBarber(barber, pageable);
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    // Obter agendamento por ID
    public AppointmentDTO getAppointmentById(Integer id) throws DataBaseException {
        Appointment appointment =  appointmentRepository.findById(id).orElseThrow(() -> new DataBaseException("Não existe agendamento com esse ID"));

        return convertEntityToDTO(appointment);
    }

    // Excluir agendamento por ID
    public void deleteAppointment(Integer id) {
        appointmentRepository.deleteById(id);
    }

    // Verificar se o agendamento é válido
    private boolean isValidAppointment(Appointment appointment) throws AppointmentException {
        if (appointment != null){

            if(appointment.getBarber() == null){
                throw new AppointmentException("É necessário selecionar um barbeiro para o agendamento");
            }

            Set<Services> servicesAppointment = appointment.getServiceType();
            Set<Services> servicesBarber = appointment.getBarber().getServices();

            for(Services s : servicesAppointment){
                if(!servicesBarber.contains(s)){
                    throw new AppointmentException("O barbeiro selecionado não está apto para algum desses serviços");
                }
            }

            if(appointment.getClientName().isBlank() || appointment.getClientNumber().isBlank()){
                throw new AppointmentException("As informações do cliente são campos obrigatórios");
            }

            isTimeValidated(appointment);

            return true;
        }
        throw new AppointmentException("O agendamento não pode ser nulo");
    }

    private void isTimeValidated(Appointment appointment){
        if (appointment.getStartTime().toLocalDate().isBefore(LocalDate.now())) {
            throw new AppointmentException("Não é possível agendar para uma data passada");
        }

        if(!isTimeSlotOccupied(appointment.getBarber(), appointment.getStartTime(), appointment.getEndTime()) &&
                isTimeSlotOccupied(appointment.getBarber(), appointment.getStartTime(), appointment.getEndTime(), appointment.getId())){
            throw new AppointmentException("O barbeiro selecionado já está reservado nesse horário");
        }

        if((appointment.getStartTime().toLocalTime().isBefore(appointment.getBarber().getStart())) ||
                (appointment.getStartTime().toLocalTime()).isAfter(appointment.getBarber().getEnd()) ||
                (appointment.getEndTime().toLocalTime().isAfter(appointment.getBarber().getEnd()))){

            throw new AppointmentException("O barbeiro selecionado não trabalha no horário agendado");
        }
    }

    // Verificar se o horário está ocupado por outro agendamento
    private boolean isTimeSlotOccupied(Barber barber, LocalDateTime start, LocalDateTime end) {
        List<Appointment> conflictingAppointments = appointmentRepository.findByBarberAndStartTimeBetween(barber, start, end);
        return conflictingAppointments.isEmpty();
    }

    private boolean isTimeSlotOccupied(Barber barber, LocalDateTime start, LocalDateTime end, Integer appointmentId) {
        List<Appointment> conflictingAppointments = appointmentRepository.findByBarberAndStartTimeBetween(barber, start, end);
        return conflictingAppointments.stream().anyMatch(a -> !a.getId().equals(appointmentId));
    }

    public Appointment convertDTOtoEntity(AppointmentCreateDTO appointmentCreateDTO) throws DataBaseException {
        Appointment appointment = new Appointment();
        appointment.setClientName(appointmentCreateDTO.getClientName());
        appointment.setClientNumber(appointmentCreateDTO.getClientNumber());
        appointment.setBarber(barberService.getBarberEntity(appointmentCreateDTO.getBarberId()));

        Set<Services> services = new HashSet<>();
        Integer timeMinutes = 0;
        Double price = 0.0;
        for(Integer id : appointmentCreateDTO.getServiceTypeIds()) {
            Services s = servicesService.getServiceEntity(id);
            services.add(s);
            timeMinutes += (s.getTime().getHour() * 60 + s.getTime().getMinute());
            price += s.getValue();
        }

        appointment.setTotalPrice(price);

        appointment.setServiceType(services);

        LocalDateTime time = appointmentCreateDTO.getStartTime();

        appointment.setStartTime(time);

        time = time.plusMinutes(timeMinutes);

        appointment.setEndTime(time);

        return appointment;
    }

    private AppointmentDTO convertEntityToDTO(Appointment appointment) {
        AppointmentDTO appointmentDTO = new AppointmentDTO();

        appointmentDTO.setId(appointment.getId());
        appointmentDTO.setClientName(appointment.getClientName());
        appointmentDTO.setClientNumber(appointment.getClientNumber());
        appointmentDTO.setBarber(barberService.convertToCompleteDTO(appointment.getBarber()));
        appointmentDTO.setServiceType(appointment.getServiceType());
        appointmentDTO.setTotalPrice(appointment.getTotalPrice());

        if (appointment.getStatus() != null) {
            appointmentDTO.setStatus(appointment.getStatus().name());
        }
        appointmentDTO.setRejectionReason(appointment.getRejectionReason());
        if (appointment.getClient() != null) {
            appointmentDTO.setClientId(appointment.getClient().getIdClient());
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String timeString;

        if(appointment.getStartTime() != null) {
            timeString = appointment.getStartTime() .format(formatter);
            appointmentDTO.setStartTime(timeString);
        }

        if(appointment.getEndTime() != null) {
            timeString = appointment.getEndTime().format(formatter);
            appointmentDTO.setEndTime(timeString);
        }

        return appointmentDTO;
    }

    // ==================== Workflow de Aprovação ====================

    /**
     * Cliente solicita um agendamento (status = PENDING_APPROVAL)
     */
    @Transactional
    public AppointmentDTO requestAppointment(AppointmentRequestDTO requestDTO, HttpServletRequest request) 
            throws AppointmentException, DataBaseException {
        
        // Identificar o cliente logado
        String token = request.getHeader("Authorization");
        Integer userId = userService.getJtiFromToken(token);
        Optional<User> user = userService.findById(userId);
        
        if (user.isEmpty()) {
            throw new DataBaseException("Usuário não encontrado");
        }
        
        Optional<Client> client = clientRepository.findByUser(user.get());
        
        // Criar o agendamento com PENDING_APPROVAL
        Appointment appointment = new Appointment();
        if (client.isPresent()) {
            Client loggedClient = client.get();
            appointment.setClient(loggedClient);
            appointment.setClientName(loggedClient.getName());
            appointment.setClientNumber(loggedClient.getPhone());
        } else {
            String fallbackClientName = requestDTO.getClientName() != null ? requestDTO.getClientName().trim() : "";
            String fallbackClientNumber = requestDTO.getClientNumber() != null ? requestDTO.getClientNumber().trim() : "";

            if (fallbackClientName.isBlank() || fallbackClientNumber.isBlank()) {
                throw new AppointmentException("Nome e telefone do cliente sao obrigatorios para esta solicitacao");
            }

            appointment.setClientName(fallbackClientName);
            appointment.setClientNumber(fallbackClientNumber);
        }
        appointment.setBarber(barberService.getBarberEntity(requestDTO.getBarberId()));
        appointment.setStatus(Appointment.AppointmentStatus.PENDING_APPROVAL);
        
        Set<Services> services = new HashSet<>();
        Integer timeMinutes = 0;
        Double price = 0.0;
        for (Integer id : requestDTO.getServiceTypeIds()) {
            Services s = servicesService.getServiceEntity(id);
            services.add(s);
            timeMinutes += (s.getTime().getHour() * 60 + s.getTime().getMinute());
            price += s.getValue();
        }
        
        appointment.setTotalPrice(price);
        appointment.setServiceType(services);
        appointment.setStartTime(requestDTO.getStartTime());
        appointment.setEndTime(requestDTO.getStartTime().plusMinutes(timeMinutes));
        
        // Validação básica (não valida conflito pois está pendente)
        if (appointment.getBarber() == null) {
            throw new AppointmentException("É necessário selecionar um barbeiro para o agendamento");
        }
        
        Set<Services> servicesBarber = appointment.getBarber().getServices();
        for (Services s : services) {
            if (!servicesBarber.contains(s)) {
                throw new AppointmentException("O barbeiro selecionado não está apto para algum desses serviços");
            }
        }
        
        if (appointment.getStartTime().toLocalDate().isBefore(LocalDate.now())) {
            throw new AppointmentException("Não é possível agendar para uma data passada");
        }
        
        return convertEntityToDTO(appointmentRepository.save(appointment));
    }

    /**
     * Salva um agendamento criado pelo fluxo público (sem autenticação).
     * A entidade já vem montada pelo controller.
     */
    @Transactional
    public AppointmentDTO savePublicAppointment(Appointment appointment) {
        return convertEntityToDTO(appointmentRepository.save(appointment));
    }

    /**
     * Admin/Secretária aprova um agendamento pendente
     */
    @Transactional
    public AppointmentDTO approveAppointment(Integer id) throws DataBaseException, AppointmentException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new DataBaseException("Agendamento não encontrado"));
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.PENDING_APPROVAL) {
            throw new AppointmentException("Apenas agendamentos pendentes podem ser aprovados");
        }
        
        // Validar conflito de horário antes de aprovar
        isTimeValidated(appointment);
        
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        Appointment saved = appointmentRepository.save(appointment);
        
        // Enviar notificação de confirmação
        if (appointment.getClient() != null) {
            notificationService.createAppointmentConfirmation(saved, appointment.getClient());
            // Agendar lembrete
            notificationService.createAppointmentReminder(saved, appointment.getClient());
        }
        
        return convertEntityToDTO(saved);
    }

    /**
     * Admin/Secretária rejeita um agendamento pendente
     */
    @Transactional
    public AppointmentDTO rejectAppointment(Integer id, String reason) throws DataBaseException, AppointmentException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new DataBaseException("Agendamento não encontrado"));
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.PENDING_APPROVAL) {
            throw new AppointmentException("Apenas agendamentos pendentes podem ser rejeitados");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.REJECTED);
        appointment.setRejectionReason(reason);
        Appointment saved = appointmentRepository.save(appointment);
        
        // Enviar notificação de cancelamento/rejeição
        if (appointment.getClient() != null) {
            notificationService.createAppointmentCancellation(saved, appointment.getClient());
        }
        
        return convertEntityToDTO(saved);
    }

    /**
     * Listar agendamentos pendentes de aprovação
     */
    public PageAppointmentDTO getPendingAppointments(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp = appointmentRepository.findByStatusOrderByStartTimeAsc(
                Appointment.AppointmentStatus.PENDING_APPROVAL, pageable);
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    /**
     * Listar agendamentos do cliente logado
     */
    public PageAppointmentDTO getMyAppointments(Integer page, Integer size, HttpServletRequest request) 
            throws DataBaseException {
        String token = request.getHeader("Authorization");
        Integer userId = userService.getJtiFromToken(token);
        Optional<User> user = userService.findById(userId);
        
        if (user.isEmpty()) {
            throw new DataBaseException("Usuário não encontrado");
        }
        
        Client client = clientRepository.findByUser(user.get())
                .orElseThrow(() -> new DataBaseException("Perfil de cliente não encontrado"));
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Appointment> pageApp = appointmentRepository.findByClientOrderByStartTimeDesc(client, pageable);
        Page<AppointmentDTO> appointmentDTOS = pageApp.map(this::convertEntityToDTO);

        return new PageAppointmentDTO(
                appointmentDTOS.getTotalElements(),
                appointmentDTOS.getTotalPages(),
                appointmentDTOS.getPageable().getPageNumber(),
                appointmentDTOS.getSize(),
                appointmentDTOS.getContent()
        );
    }

    /**
     * Cancelar agendamento do próprio cliente
     */
    @Transactional
    public AppointmentDTO cancelMyAppointment(Integer id, HttpServletRequest request) 
            throws DataBaseException, AppointmentException {
        String token = request.getHeader("Authorization");
        Integer userId = userService.getJtiFromToken(token);
        Optional<User> user = userService.findById(userId);
        
        if (user.isEmpty()) {
            throw new DataBaseException("Usuário não encontrado");
        }
        
        Client client = clientRepository.findByUser(user.get())
                .orElseThrow(() -> new DataBaseException("Perfil de cliente não encontrado"));
        
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new DataBaseException("Agendamento não encontrado"));
        
        if (appointment.getClient() == null || !appointment.getClient().getIdClient().equals(client.getIdClient())) {
            throw new AppointmentException("Você só pode cancelar seus próprios agendamentos");
        }
        
        if (appointment.getStatus() != Appointment.AppointmentStatus.PENDING_APPROVAL &&
            appointment.getStatus() != Appointment.AppointmentStatus.CONFIRMED) {
            throw new AppointmentException("Este agendamento não pode ser cancelado");
        }
        
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        return convertEntityToDTO(appointmentRepository.save(appointment));
    }

    // ==================== Disponibilidade ====================

    /**
     * Calcula horários disponíveis de um barbeiro em uma data
     */
    public AvailabilityDTO getBarberAvailability(Integer barberId, LocalDate date) throws DataBaseException {
        Barber barber = barberService.getBarberEntity(barberId);
        
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(23, 59, 59);
        
        // Buscar agendamentos existentes (confirmados ou pendentes)
        List<Appointment> existingAppointments = appointmentRepository
                .findActiveAppointmentsByBarberAndDate(barber, dayStart, dayEnd);
        
        // Calcular slots disponíveis baseado no horário de trabalho do barbeiro
        LocalTime workStart = barber.getStart();
        LocalTime workEnd = barber.getEnd();
        
        if (workStart == null || workEnd == null) {
            workStart = LocalTime.of(8, 0);
            workEnd = LocalTime.of(18, 0);
        }
        
        List<AvailabilityDTO.TimeSlot> availableSlots = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Gerar slots de 30 minutos
        LocalTime currentSlot = workStart;
        while (currentSlot.plusMinutes(30).compareTo(workEnd) <= 0) {
            LocalDateTime slotStart = date.atTime(currentSlot);
            LocalDateTime slotEnd = slotStart.plusMinutes(30);
            
            // Verificar se o slot está livre
            boolean isOccupied = false;
            for (Appointment existing : existingAppointments) {
                if (slotStart.isBefore(existing.getEndTime()) && slotEnd.isAfter(existing.getStartTime())) {
                    isOccupied = true;
                    break;
                }
            }
            
            // Slot do passado não é disponível
            if (slotStart.toLocalDate().isBefore(LocalDate.now())) {
                isOccupied = true;
            }
            
            if (!isOccupied) {
                availableSlots.add(new AvailabilityDTO.TimeSlot(
                        currentSlot.format(timeFormatter),
                        currentSlot.plusMinutes(30).format(timeFormatter)
                ));
            }
            
            currentSlot = currentSlot.plusMinutes(30);
        }
        
        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setBarberId(barber.getIdBarber());
        dto.setBarberName(barber.getName());
        dto.setDate(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dto.setAvailableSlots(availableSlots);
        
        return dto;
    }
}

