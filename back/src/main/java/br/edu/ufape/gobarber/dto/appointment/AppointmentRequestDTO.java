package br.edu.ufape.gobarber.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para solicitação de agendamento pelo cliente.
 */
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class AppointmentRequestDTO {

    @NotNull(message = "O barbeiro é obrigatório")
    private Integer barberId;

    private String clientName;

    private String clientNumber;

    @NotNull(message = "Selecione pelo menos um serviço")
    private List<Integer> serviceTypeIds;

    @NotNull(message = "O horário de início é obrigatório")
    private LocalDateTime startTime;

    private String notes;
}
