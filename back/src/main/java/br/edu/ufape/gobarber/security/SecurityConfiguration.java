package br.edu.ufape.gobarber.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {
    private final TokenService tokenService;

    @Value("${cors.origins:http://localhost:3000}")
    private String[] corsOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers().frameOptions().disable()
                .and().cors()
                .and().csrf().disable()
                .authorizeHttpRequests((authz) -> authz
                        .antMatchers("/auth", "/", "/auth/create", "/auth/register").permitAll()
                        // Endpoints públicos (sem autenticação)
                        .antMatchers("/public/**").permitAll()
                        .antMatchers("/auth/logout").authenticated()

                        // Stock - admin gerencia estoque
                        .antMatchers("/stock/**").hasRole("ADMIN")

                        // Services - GET para todos staff, escrita somente admin
                        .antMatchers(HttpMethod.GET, "/services/**").hasAnyRole("ADMIN", "BARBER", "SECRETARY")
                        .antMatchers("/services/**").hasRole("ADMIN")

                        // Secretary - secretaria pode acessar apenas o proprio perfil
                        .antMatchers(HttpMethod.GET, "/secretary/logged-secretary", "/secretary/logged-secretary/picture")
                        .hasAnyRole("ADMIN", "SECRETARY")
                        // Secretary - admin gerencia secretárias
                        .antMatchers("/secretary/**").hasRole("ADMIN")

                        // Sale - admin gerencia promoções; clientes podem ver promoções válidas
                        .antMatchers(HttpMethod.GET, "/sale/valid").hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers(HttpMethod.GET, "/sale/coupon/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers("/sale/**").hasRole("ADMIN")

                        // Product - admin gerencia produtos (GET para todos incluindo clientes)
                        .antMatchers(HttpMethod.GET, "/product/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers("/product/**").hasRole("ADMIN")

                        // Barber - GET para staff, escrita somente admin (barbeiro não edita outros)
                        .antMatchers(HttpMethod.GET, "/barber/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER")
                        .antMatchers("/barber/logged-barber/**").hasRole("BARBER")
                        .antMatchers("/barber/**").hasRole("ADMIN")

                        // Address - admin gerencia
                        .antMatchers("/address/**").hasAnyRole("ADMIN", "SECRETARY")

                        // Appointments - rotas específicas primeiro, depois genérica
                        .antMatchers("/appointments/request").hasRole("CLIENT")
                        .antMatchers("/appointments/my/**", "/appointments/my").hasRole("CLIENT")
                        .antMatchers("/appointments/history", "/appointments/future/barber/own").hasRole("BARBER")
                        .antMatchers("/appointments/pending").hasAnyRole("ADMIN", "SECRETARY")
                        .antMatchers(HttpMethod.POST, "/appointments/*/approve", "/appointments/*/reject")
                        .hasAnyRole("ADMIN", "SECRETARY")
                        .antMatchers("/appointments/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER")

                        // Waitlist - admin e secretárias
                        .antMatchers("/waitlist/**").hasAnyRole("ADMIN", "SECRETARY")

                        // Reviews - GET para staff, escrita somente admin, POST criação para CLIENT
                        .antMatchers(HttpMethod.POST, "/review").hasAnyRole("ADMIN", "CLIENT")
                        .antMatchers(HttpMethod.GET, "/review/**").hasAnyRole("ADMIN", "BARBER", "SECRETARY")
                        .antMatchers("/review/**").hasRole("ADMIN")

                        // Barber Schedule - barbeiros e admin
                        .antMatchers("/barber-schedule/**").hasAnyRole("ADMIN", "BARBER")

                        // Client - cliente pode acessar apenas o proprio perfil
                        .antMatchers(HttpMethod.GET, "/client/logged-client", "/client/logged-client/photo")
                        .hasRole("CLIENT")
                        // Client - admin e secretárias gerenciam, barbeiro pode ver
                        .antMatchers(HttpMethod.GET, "/client/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER")
                        .antMatchers("/client/**").hasAnyRole("ADMIN", "SECRETARY")

                        // Payment - admin e secretárias gerenciam, barbeiro pode ver
                        .antMatchers(HttpMethod.GET, "/payment/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER")
                        .antMatchers("/payment/**").hasAnyRole("ADMIN", "SECRETARY")

                        // Dashboard - admin, secretárias e barbeiros podem ver
                        .antMatchers("/dashboard/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER")

                        // Notification - todos autenticados podem ler E marcar como lida
                        .antMatchers(HttpMethod.GET, "/notification/client/**")
                        .hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers(HttpMethod.POST, "/notification/*/read")
                        .hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers(HttpMethod.POST, "/notification/client/*/read-all")
                        .hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers("/notification/**").hasAnyRole("ADMIN", "SECRETARY")

                        // Cancellation rules - admin configura
                        .antMatchers("/cancellation-rules/**").hasRole("ADMIN")

                        // Barbershop - GET público para listar, escrita somente admin
                        .antMatchers(HttpMethod.GET, "/barbershop/**").hasAnyRole("ADMIN", "SECRETARY", "BARBER", "CLIENT")
                        .antMatchers("/barbershop/**").hasRole("ADMIN")

                        // Auth - change password para qualquer autenticado
                        .antMatchers(HttpMethod.PUT, "/auth/change-password").authenticated()

                        .anyRequest().denyAll());

        http.addFilterBefore(new TokenAuthenticationFilter(tokenService), UsernamePasswordAuthenticationFilter.class);
        return http.build();

    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().antMatchers("/v3/api-docs",
                "/v3/api-docs/**",
                "/swagger-resources/**",
                "/swagger-ui/**");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(corsOrigins)
                        .allowedMethods("*")
                        .exposedHeaders("Authorization");
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
