-- ==========================================
-- GoBarber Database Seeder (Completo)
-- ==========================================
-- Dados completos para testar Dashboard, Relatorios e todos os CRUDs
-- Data base: Semana de 16 a 22 de Fevereiro de 2026
-- ==========================================

SET search_path TO gobarber;

-- ==========================================
-- LIMPEZA (ordem reversa de dependencia)
-- ==========================================
DELETE FROM audit_log;
DELETE FROM notification;
DELETE FROM wait_list;
DELETE FROM review;
DELETE FROM payment;
DELETE FROM appointment_service;
DELETE FROM appointment;
DELETE FROM barber_schedule;
DELETE FROM client_barbershop;
DELETE FROM barber_barbershop;
DELETE FROM barbershop;
DELETE FROM cancellation_rule;
DELETE FROM client;
DELETE FROM product_stock;
DELETE FROM service_x_product;
DELETE FROM sale;
DELETE FROM barber_x_service;
DELETE FROM secretary;
DELETE FROM barber;
DELETE FROM service;
DELETE FROM product;
DELETE FROM employee;
DELETE FROM address;

-- ==========================================
-- ENDERECOS (ADDRESS) - 25 registros
-- ==========================================
INSERT INTO address (id_adress, street, number, neighborhood, city, state, cep) VALUES
(1,  'Rua das Flores',           123,  'Centro',         'Recife', 'PE', '5001000'),
(2,  'Av. Boa Viagem',           456,  'Boa Viagem',     'Recife', 'PE', '5102010'),
(3,  'Rua do Sol',               789,  'Santo Antonio',  'Recife', 'PE', '5001020'),
(4,  'Av. Conselheiro Aguiar',   1010, 'Boa Viagem',     'Recife', 'PE', '5102102'),
(5,  'Rua da Aurora',            200,  'Boa Vista',      'Recife', 'PE', '5005000'),
(6,  'Av. Caxanga',              3500, 'Iputinga',       'Recife', 'PE', '5067000'),
(7,  'Rua do Hospicio',          88,   'Boa Vista',      'Recife', 'PE', '5006008'),
(8,  'Av. Domingos Ferreira',    1500, 'Boa Viagem',     'Recife', 'PE', '5101105'),
(9,  'Rua Gervasio Pires',       300,  'Boa Vista',      'Recife', 'PE', '5005007'),
(10, 'Av. Norte',                2000, 'Casa Amarela',   'Recife', 'PE', '5207000'),
(11, 'Rua da Concordia',         150,  'Sao Jose',       'Recife', 'PE', '5002000'),
(12, 'Av. Conde da Boa Vista',   800,  'Boa Vista',      'Recife', 'PE', '5005100'),
(13, 'Rua do Futuro',            320,  'Gracas',         'Recife', 'PE', '5206050'),
(14, 'Av. Agamenon Magalhaes',   1200, 'Espinheiro',     'Recife', 'PE', '5202020'),
(15, 'Rua Real da Torre',        500,  'Madalena',       'Recife', 'PE', '5061000'),
(16, 'Av. Rui Barbosa',          250,  'Gracas',         'Recife', 'PE', '5206060'),
(17, 'Rua do Principe',          180,  'Boa Vista',      'Recife', 'PE', '5005200'),
(18, 'Av. Manoel Borba',         900,  'Soledade',       'Recife', 'PE', '5070050'),
(19, 'Rua Benfica',              420,  'Madalena',       'Recife', 'PE', '5061100'),
(20, 'Av. Joao de Barros',       700,  'Espinheiro',     'Recife', 'PE', '5202060'),
(21, 'Rua Padre Carapuceiro',    600,  'Boa Viagem',     'Recife', 'PE', '5102300'),
(22, 'Av. Visconde de Suassuna', 350,  'Santo Amaro',    'Recife', 'PE', '5003000'),
(23, 'Rua do Giriquiti',         90,   'Afogados',       'Recife', 'PE', '5041000'),
(24, 'Av. Mascarenhas de Morais',4500, 'Imbiribeira',    'Recife', 'PE', '5120000'),
(25, 'Rua Carlos Gomes',         110,  'Parnamirim',     'Recife', 'PE', '5205100');

SELECT setval('address_id_adress_seq', 25);

-- ==========================================
-- ROLES
-- ==========================================
INSERT INTO role (name_role)
SELECT 'ROLE_ADMIN' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name_role = 'ROLE_ADMIN');
INSERT INTO role (name_role)
SELECT 'ROLE_BARBER' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name_role = 'ROLE_BARBER');
INSERT INTO role (name_role)
SELECT 'ROLE_SECRETARY' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name_role = 'ROLE_SECRETARY');
INSERT INTO role (name_role)
SELECT 'ROLE_CLIENT' WHERE NOT EXISTS (SELECT 1 FROM role WHERE name_role = 'ROLE_CLIENT');

-- ==========================================
-- USUARIOS (EMPLOYEE) - senha: password
-- ==========================================
INSERT INTO employee (id_user, email, password, id_role) VALUES
(1, 'admin@gobarber.com',              '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1),
(2, 'carlos.barbeiro@gobarber.com',    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2),
(3, 'joao.barbeiro@gobarber.com',      '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2),
(4, 'pedro.barbeiro@gobarber.com',     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2),
(5, 'lucas.barbeiro@gobarber.com',     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2),
(6, 'ana.secretaria@gobarber.com',     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 3),
(7, 'maria.secretaria@gobarber.com',   '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 3),
(8,  'ricardo.gomes@email.com',         '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 4),
(9,  'fernando.lima@email.com',          '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 4),
(10, 'gustavo.alves@email.com',          '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 4);

SELECT setval('employee_id_user_seq', 10);

-- ==========================================
-- SERVICOS (SERVICE) - 12 tipos
-- ==========================================
INSERT INTO service (id_service, name_service, description_service, price_service, time_service) VALUES
(1,  'Corte Masculino',     'Corte tradicional masculino com maquina e tesoura',  35.00, '00:30:00'),
(2,  'Corte Degrade',       'Corte degrade americano ou europeu',                 45.00, '00:45:00'),
(3,  'Barba Completa',      'Barba com navalha, toalha quente e hidratacao',      30.00, '00:30:00'),
(4,  'Corte + Barba',       'Combo de corte masculino com barba completa',        55.00, '01:00:00'),
(5,  'Pigmentacao',         'Pigmentacao capilar para disfarcar falhas',          80.00, '01:30:00'),
(6,  'Sobrancelha',         'Design de sobrancelha masculina',                    15.00, '00:15:00'),
(7,  'Hidratacao Capilar',  'Tratamento de hidratacao profunda',                  40.00, '00:30:00'),
(8,  'Relaxamento',         'Relaxamento capilar para cabelos crespos',           60.00, '01:00:00'),
(9,  'Platinado',           'Descoloracao e platinado completo',                 120.00, '02:00:00'),
(10, 'Corte Infantil',      'Corte especial para criancas ate 12 anos',           25.00, '00:20:00'),
(11, 'Nevou',               'Efeito nevou no cabelo',                             50.00, '00:45:00'),
(12, 'Luzes',               'Mechas e luzes no cabelo',                          100.00, '01:30:00');

SELECT setval('service_id_service_seq', 12);

-- ==========================================
-- BARBEIROS (BARBER) - 4
-- ==========================================
INSERT INTO barber (id_barber, name_barber, cpf_barber, id_adress, salary, admission_date, workload, id_user, contact, start_working, end_working) VALUES
(1, 'Carlos Silva',    '12345678901', 1, 3500.00, '2023-01-15', 44, 2, '81999990001', '08:00:00', '18:00:00'),
(2, 'Joao Santos',     '12345678902', 2, 3200.00, '2023-03-20', 44, 3, '81999990002', '09:00:00', '19:00:00'),
(3, 'Pedro Oliveira',  '12345678903', 3, 3000.00, '2023-06-10', 40, 4, '81999990003', '08:00:00', '17:00:00'),
(4, 'Lucas Ferreira',  '12345678904', 4, 2800.00, '2024-01-05', 44, 5, '81999990004', '10:00:00', '20:00:00');

SELECT setval('barber_id_barber_seq', 4);

-- ==========================================
-- SECRETARIAS (SECRETARY)
-- ==========================================
INSERT INTO secretary (id_secretary, name_secretary, cpf_secretary, id_adress, id_user, salary, admission_date, workload, contact, start_working, end_working) VALUES
(1, 'Ana Costa',   '98765432101', 5, 6, 2500.00, '2023-02-01', 44, '81988880001', '08:00:00', '17:00:00'),
(2, 'Maria Souza', '98765432102', 6, 7, 2500.00, '2023-08-15', 44, '81988880002', '12:00:00', '21:00:00');

SELECT setval('secretary_id_secretary_seq', 2);

-- ==========================================
-- BARBEIRO x SERVICO
-- ==========================================
INSERT INTO barber_x_service (id_barber, id_service) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 6), (1, 10),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 9), (2, 11), (2, 12),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 6), (3, 7), (3, 10),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 7), (4, 8), (4, 5);

-- ==========================================
-- PRODUTOS (PRODUCT) - 15
-- ==========================================
INSERT INTO product (id_product, name_product, brand_product, price_product, size, description) VALUES
(1,  'Pomada Modeladora Matte',  'Fox For Men',        45.00, '150g',  'Pomada efeito matte para fixacao media'),
(2,  'Pomada Modeladora Brilho', 'QOD',                55.00, '150g',  'Pomada com brilho para fixacao forte'),
(3,  'Cera Capilar',             'Bozzano',            35.00, '100g',  'Cera modeladora para cabelos curtos'),
(4,  'Gel Fixador Forte',        'Duty',               25.00, '300g',  'Gel de fixacao forte e duradoura'),
(5,  'Oleo para Barba',          'Souvie',             60.00, '30ml',  'Oleo hidratante e modelador para barba'),
(6,  'Balm para Barba',          'Viking',             50.00, '60g',   'Balm hidratante com fixacao leve'),
(7,  'Shampoo Anticaspa',        'Clear Men',          28.00, '400ml', 'Shampoo anticaspa para uso diario'),
(8,  'Shampoo para Barba',       'Barba de Respeito',  40.00, '200ml', 'Shampoo especifico para barba'),
(9,  'Condicionador Masculino',  'Tresemme',           22.00, '400ml', 'Condicionador para cabelos masculinos'),
(10, 'Pos-Barba',                'Nivea',              30.00, '100ml', 'Locao pos-barba refrescante'),
(11, 'Talco Mentolado',          'Granado',            18.00, '100g',  'Talco refrescante pos-corte'),
(12, 'Spray Fixador',            'Got2B',              35.00, '300ml', 'Spray de fixacao extra forte'),
(13, 'Tonico Capilar',           'Minancora',          25.00, '150ml', 'Tonico para fortalecimento capilar'),
(14, 'Desodorante Roll-on',      'Rexona Men',         15.00, '50ml',  'Desodorante antitranspirante'),
(15, 'Sabonete Liquido',         'Dove Men',           20.00, '250ml', 'Sabonete liquido masculino');

SELECT setval('product_id_product_seq', 15);

-- ==========================================
-- ESTOQUE (PRODUCT_STOCK)
-- ==========================================
INSERT INTO product_stock (id_product, batch_number, quantity, expiration_date, acquisition_date) VALUES
(1,  'LOTE2026-001', 25, '2027-06-15', '2026-01-10'),
(2,  'LOTE2026-002', 20, '2027-06-15', '2026-01-10'),
(3,  'LOTE2026-003', 15, '2027-03-20', '2026-01-15'),
(4,  'LOTE2026-004', 30, '2027-08-31', '2026-01-15'),
(5,  'LOTE2026-005', 18, '2027-08-10', '2026-01-20'),
(6,  'LOTE2026-006', 12, '2027-08-10', '2026-01-20'),
(7,  'LOTE2026-007', 40, '2027-09-30', '2026-02-01'),
(8,  'LOTE2026-008', 22, '2027-05-15', '2026-02-01'),
(9,  'LOTE2026-009', 35, '2027-11-20', '2026-02-05'),
(10, 'LOTE2026-010', 28, '2027-02-28', '2026-02-10'),
(11, 'LOTE2026-011', 50, '2028-01-15', '2026-02-10'),
(12, 'LOTE2026-012', 15, '2027-10-10', '2026-02-12'),
(13, 'LOTE2026-013', 20, '2027-04-05', '2026-02-12'),
(14, 'LOTE2026-014', 45, '2027-12-15', '2026-02-15'),
(15, 'LOTE2026-015', 30, '2027-07-20', '2026-02-15'),
(1,  'LOTE2026-016', 10, '2027-12-15', '2026-02-01'),
(4,  'LOTE2026-017', 20, '2027-06-30', '2026-02-01'),
(7,  'LOTE2026-018', 25, '2027-09-30', '2026-02-10');

-- ==========================================
-- SERVICO x PRODUTO (SERVICE_X_PRODUCT)
-- ==========================================
INSERT INTO service_x_product (id_service, id_product) VALUES
(1, 11),   -- Corte usa Talco
(2, 4),    -- Degrade usa Gel
(3, 5),    -- Barba usa Oleo
(3, 10),   -- Barba usa Pos-Barba
(4, 5),    -- Corte+Barba usa Oleo
(4, 10),   -- Corte+Barba usa Pos-Barba
(4, 11),   -- Corte+Barba usa Talco
(7, 9),    -- Hidratacao usa Condicionador
(9, 13);   -- Platinado usa Tonico

-- ==========================================
-- PROMOCOES (SALE)
-- ==========================================
INSERT INTO sale (id_sale, sale_name, total_price, discount_coupon, start_date, end_date) VALUES
(1,  'Abertura GoBarber',    29.99, 'GOBARBER',    '2025-01-01', '2025-12-31'),
(2,  'Carnaval 2026',        39.99, 'CARNAVAL26',  '2026-02-14', '2026-02-22'),
(3,  'Semana do Estilo',     44.99, 'ESTILO26',    '2026-02-16', '2026-02-22'),
(4,  'Combo Barba + Corte',  49.99, 'COMBO10',     '2026-02-01', '2026-02-28'),
(5,  'Volta as Aulas',       29.99, 'ESCOLA26',    '2026-02-01', '2026-03-15'),
(6,  'Segunda Maluca',       34.99, 'SEGUNDA',     '2026-01-01', '2026-12-31'),
(7,  'Primeira Visita',      39.99, 'BEMVINDO',    '2026-01-01', '2026-12-31'),
(8,  'Indique um Amigo',     44.99, 'AMIGO10',     '2026-01-01', '2026-12-31'),
(9,  'Aniversariante',        0.00, 'NIVER',       '2026-01-01', '2026-12-31'),
(10, 'Flash Sale Fevereiro', 34.99, 'FLASH26',     '2026-02-17', '2026-02-19'),
(11, 'Fidelidade Bronze',    30.00, 'BRONZE5',     '2026-01-01', '2026-12-31'),
(12, 'Fidelidade Prata',     25.00, 'PRATA10',     '2026-01-01', '2026-12-31');

SELECT setval('sale_id_sale_seq', 12);

-- ==========================================
-- CLIENTES (CLIENT) - 15 clientes
-- ==========================================
INSERT INTO client (id_client, name, email, phone, cpf, birth_date, gender, preferred_contact_method, receive_promotions, receive_reminders, loyalty_points, loyalty_tier, total_visits, total_spent, last_visit_date, first_visit, notes, is_active, preferred_barber_id, address_id, id_user, created_at, updated_at) VALUES
-- Clientes antigos (criados em 2025) - para mostrar clientes que retornam
(1,  'Ricardo Gomes',    'ricardo.gomes@email.com',    '81991110001', '11122233301', '1990-05-15', 'MALE', 'WHATSAPP', true, true, 350, 'GOLD',     18, 890.00,  '2026-02-16 09:30:00', '2025-03-10 10:00:00', 'Cliente fiel, prefere corte degrade', true, 1, 11, 8,    '2025-03-10 10:00:00', '2026-02-16 09:30:00'),
(2,  'Fernando Lima',    'fernando.lima@email.com',     '81991110002', '11122233302', '1988-11-22', 'MALE', 'EMAIL',    true, true, 520, 'PLATINUM', 25, 1375.00, '2026-02-16 11:00:00', '2025-01-20 14:00:00', 'Sempre pede combo corte+barba',       true, 1, 12, 9,    '2025-01-20 14:00:00', '2026-02-16 11:00:00'),
(3,  'Gustavo Alves',    'gustavo.alves@email.com',     '81991110003', '11122233303', '1995-08-03', 'MALE', 'WHATSAPP', true, true, 180, 'SILVER',   10, 450.00,  '2026-02-16 10:15:00', '2025-06-15 09:00:00', NULL,                                  true, 2, 13, 10,   '2025-06-15 09:00:00', '2026-02-16 10:15:00'),
(4,  'Bruno Martins',    'bruno.martins@email.com',     '81991110004', '11122233304', '1992-01-30', 'MALE', 'SMS',      true, true, 280, 'GOLD',     14, 700.00,  '2026-02-17 11:30:00', '2025-04-05 16:00:00', 'Barba sempre com toalha quente',      true, 2, 14, NULL, '2025-04-05 16:00:00', '2026-02-17 11:30:00'),
(5,  'Thiago Costa',     'thiago.costa@email.com',      '81991110005', '11122233305', '1997-12-18', 'MALE', 'WHATSAPP', false,true, 90,  'BRONZE',   5,  175.00,  '2026-02-17 09:00:00', '2025-09-20 08:30:00', NULL,                                  true, 3, 15, NULL, '2025-09-20 08:30:00', '2026-02-17 09:00:00'),
(6,  'Andre Souza',      'andre.souza@email.com',       '81991110006', '11122233306', '1985-03-25', 'MALE', 'PHONE',    true, true, 420, 'PLATINUM', 22, 1210.00, '2026-02-17 15:00:00', '2025-02-14 10:00:00', 'VIP - sempre oferece gorjeta',        true, 4, 16, NULL, '2025-02-14 10:00:00', '2026-02-17 15:00:00'),
(7,  'Marcos Paulo',     'marcos.paulo@email.com',      '81991110007', '11122233307', '1993-07-07', 'MALE', 'WHATSAPP', true, true, 150, 'SILVER',   8,  280.00,  '2026-02-18 09:30:00', '2025-07-01 11:00:00', NULL,                                  true, 1, 17, NULL, '2025-07-01 11:00:00', '2026-02-18 09:30:00'),
(8,  'Rafael Santos',    'rafael.santos@email.com',     '81991110008', '11122233308', '1991-09-12', 'MALE', 'EMAIL',    true, true, 300, 'GOLD',     15, 825.00,  '2026-02-18 11:30:00', '2025-05-10 14:00:00', 'Faz combo + sobrancelha',             true, 1, 18, NULL, '2025-05-10 14:00:00', '2026-02-18 11:30:00'),
(9,  'Diego Oliveira',   'diego.oliveira@email.com',    '81991110009', '11122233309', '1998-04-20', 'MALE', 'WHATSAPP', true, false,60,  'BRONZE',   3,  135.00,  '2026-02-18 14:45:00', '2025-11-05 09:00:00', 'Cliente novo, veio por indicacao',    true, 2, 19, NULL, '2025-11-05 09:00:00', '2026-02-18 14:45:00'),
(10, 'Felipe Rocha',     'felipe.rocha@email.com',      '81991110010', '11122233310', '1994-06-08', 'MALE', 'SMS',      true, true, 200, 'SILVER',   12, 480.00,  '2026-02-18 16:30:00', '2025-04-22 15:00:00', NULL,                                  true, 3, 20, NULL, '2025-04-22 15:00:00', '2026-02-18 16:30:00'),
-- Clientes mais recentes (criados Jan/Fev 2026) - para dashboard mostrar clientes novos
(11, 'Leonardo Silva',   'leonardo.silva@email.com',    '81991110011', '11122233311', '1996-02-14', 'MALE', 'WHATSAPP', true, true, 40,  'BRONZE',   2,  110.00,  '2026-02-19 12:00:00', '2026-01-08 10:00:00', 'Novo cliente, veio pela promocao',    true, 1, 21, NULL, '2026-01-08 10:00:00', '2026-02-19 12:00:00'),
(12, 'Henrique Costa',   'henrique.costa@email.com',    '81991110012', '11122233312', '1989-10-30', 'MALE', 'EMAIL',    true, true, 80,  'BRONZE',   4,  320.00,  '2026-02-20 17:00:00', '2025-12-15 14:00:00', 'Gosta de platinado',                  true, 2, 22, NULL, '2025-12-15 14:00:00', '2026-02-20 17:00:00'),
(13, 'Gabriel Ferreira', 'gabriel.ferreira@email.com',  '81991110013', '11122233313', '2000-01-05', 'MALE', 'WHATSAPP', true, true, 20,  'BRONZE',   1,  35.00,   '2026-02-21 08:30:00', '2026-02-10 09:00:00', 'Primeira visita',                     true, NULL, 23, NULL, '2026-02-10 09:00:00', '2026-02-21 08:30:00'),
(14, 'Caio Mendes',      'caio.mendes@email.com',       '81991110014', '11122233314', '1999-08-17', 'MALE', 'WHATSAPP', true, true, 30,  'BRONZE',   2,  65.00,   '2026-02-21 09:30:00', '2026-01-25 11:00:00', NULL,                                  true, 2, 24, NULL, '2026-01-25 11:00:00', '2026-02-21 09:30:00'),
(15, 'Paulo Henrique',   'paulo.henrique@email.com',    '81991110023', '11122233315', '1987-06-22', 'MALE', 'PHONE',    true, true, 250, 'GOLD',     13, 780.00,  '2026-02-21 15:30:00', '2025-05-15 10:00:00', 'Cliente fidelizado, quer pigmentacao', true, 4, 25, NULL, '2025-05-15 10:00:00', '2026-02-21 15:30:00');

SELECT setval('client_id_client_seq', 15);

-- ==========================================
-- AGENDAMENTOS - JANEIRO 2026 (historico)
-- IDs 1-27 = Janeiro para comparativo no dashboard
-- ==========================================
INSERT INTO appointment (id_appointment, name_client, number_client, id_barber, start_time, end_time, total_price, client_id) VALUES
-- Semana 05-10/Jan
(1,  'Ricardo Gomes',    '81991110001', 1, '2026-01-05 09:00:00', '2026-01-05 09:30:00', 35.00,  1),
(2,  'Fernando Lima',    '81991110002', 1, '2026-01-05 10:00:00', '2026-01-05 11:00:00', 55.00,  2),
(3,  'Gustavo Alves',    '81991110003', 2, '2026-01-06 09:30:00', '2026-01-06 10:15:00', 45.00,  3),
(4,  'Bruno Martins',    '81991110004', 2, '2026-01-06 14:00:00', '2026-01-06 14:30:00', 30.00,  4),
(5,  'Andre Souza',      '81991110006', 4, '2026-01-07 10:00:00', '2026-01-07 11:00:00', 55.00,  6),
(6,  'Leonardo Silva',   '81991110011', 1, '2026-01-08 11:00:00', '2026-01-08 12:00:00', 55.00,  11),
-- Semana 12-17/Jan
(7,  'Rafael Santos',    '81991110008', 1, '2026-01-12 10:00:00', '2026-01-12 11:00:00', 55.00,  8),
(8,  'Felipe Rocha',     '81991110010', 3, '2026-01-12 15:00:00', '2026-01-12 15:30:00', 30.00,  10),
(9,  'Thiago Costa',     '81991110005', 3, '2026-01-13 09:00:00', '2026-01-13 09:30:00', 35.00,  5),
(10, 'Marcos Paulo',     '81991110007', 1, '2026-01-14 09:00:00', '2026-01-14 09:30:00', 35.00,  7),
(11, 'Ricardo Gomes',    '81991110001', 1, '2026-01-15 09:00:00', '2026-01-15 10:00:00', 55.00,  1),
(12, 'Andre Souza',      '81991110006', 4, '2026-01-15 14:00:00', '2026-01-15 15:00:00', 55.00,  6),
(13, 'Henrique Costa',   '81991110012', 2, '2026-01-16 15:00:00', '2026-01-16 17:00:00', 120.00, 12),
(14, 'Fernando Lima',    '81991110002', 1, '2026-01-17 10:00:00', '2026-01-17 11:00:00', 55.00,  2),
-- Semana 19-25/Jan
(15, 'Bruno Martins',    '81991110004', 2, '2026-01-19 11:00:00', '2026-01-19 12:00:00', 55.00,  4),
(16, 'Paulo Henrique',   '81991110023', 4, '2026-01-20 14:00:00', '2026-01-20 15:30:00', 80.00,  15),
(17, 'Diego Oliveira',   '81991110009', 2, '2026-01-21 14:00:00', '2026-01-21 14:45:00', 45.00,  9),
(18, 'Gustavo Alves',    '81991110003', 2, '2026-01-22 09:30:00', '2026-01-22 10:15:00', 45.00,  3),
(19, 'Felipe Rocha',     '81991110010', 3, '2026-01-22 16:00:00', '2026-01-22 16:30:00', 30.00,  10),
(20, 'Caio Mendes',      '81991110014', 2, '2026-01-25 11:00:00', '2026-01-25 11:30:00', 30.00,  14),
-- Semana 26-31/Jan
(21, 'Rafael Santos',    '81991110008', 1, '2026-01-26 10:00:00', '2026-01-26 11:00:00', 55.00,  8),
(22, 'Andre Souza',      '81991110006', 4, '2026-01-27 10:00:00', '2026-01-27 11:00:00', 55.00,  6),
(23, 'Ricardo Gomes',    '81991110001', 1, '2026-01-28 09:00:00', '2026-01-28 09:30:00', 35.00,  1),
(24, 'Fernando Lima',    '81991110002', 1, '2026-01-29 10:00:00', '2026-01-29 11:00:00', 55.00,  2),
(25, 'Marcos Paulo',     '81991110007', 1, '2026-01-30 09:00:00', '2026-01-30 09:30:00', 35.00,  7),
(26, 'Bruno Martins',    '81991110004', 2, '2026-01-30 14:00:00', '2026-01-30 14:30:00', 30.00,  4),
(27, 'Thiago Costa',     '81991110005', 3, '2026-01-31 08:30:00', '2026-01-31 09:00:00', 35.00,  5);

-- ==========================================
-- AGENDAMENTOS - FEVEREIRO 2026 (antes da semana atual)
-- IDs 28-36
-- ==========================================
INSERT INTO appointment (id_appointment, name_client, number_client, id_barber, start_time, end_time, total_price, client_id) VALUES
(28, 'Paulo Henrique',   '81991110023', 4, '2026-02-02 10:00:00', '2026-02-02 11:30:00', 80.00,  15),
(29, 'Fernando Lima',    '81991110002', 1, '2026-02-03 10:00:00', '2026-02-03 11:00:00', 55.00,  2),
(30, 'Andre Souza',      '81991110006', 4, '2026-02-05 14:00:00', '2026-02-05 15:00:00', 55.00,  6),
(31, 'Ricardo Gomes',    '81991110001', 1, '2026-02-07 09:00:00', '2026-02-07 10:00:00', 55.00,  1),
(32, 'Gabriel Ferreira', '81991110013', 3, '2026-02-10 09:00:00', '2026-02-10 09:30:00', 35.00,  13),
(33, 'Henrique Costa',   '81991110012', 2, '2026-02-10 15:00:00', '2026-02-10 17:00:00', 120.00, 12),
(34, 'Felipe Rocha',     '81991110010', 3, '2026-02-12 16:00:00', '2026-02-12 16:30:00', 30.00,  10),
(35, 'Caio Mendes',      '81991110014', 2, '2026-02-13 11:00:00', '2026-02-13 11:30:00', 30.00,  14),
(36, 'Gustavo Alves',    '81991110003', 2, '2026-02-14 09:30:00', '2026-02-14 10:15:00', 45.00,  3);

-- ==========================================
-- AGENDAMENTOS - SEMANA ATUAL (16-22 Fev)
-- IDs 37-65
-- ==========================================
INSERT INTO appointment (id_appointment, name_client, number_client, id_barber, start_time, end_time, total_price, client_id) VALUES
-- Segunda 16/02
(37, 'Ricardo Gomes',    '81991110001', 1, '2026-02-16 09:00:00', '2026-02-16 09:30:00', 35.00,  1),
(38, 'Fernando Lima',    '81991110002', 1, '2026-02-16 10:00:00', '2026-02-16 11:00:00', 55.00,  2),
(39, 'Gustavo Alves',    '81991110003', 2, '2026-02-16 09:30:00', '2026-02-16 10:15:00', 45.00,  3),
(40, 'Andre Souza',      '81991110006', 4, '2026-02-16 14:00:00', '2026-02-16 15:00:00', 55.00,  6),
-- Terca 17/02
(41, 'Bruno Martins',    '81991110004', 2, '2026-02-17 11:00:00', '2026-02-17 11:30:00', 30.00,  4),
(42, 'Thiago Costa',     '81991110005', 3, '2026-02-17 08:30:00', '2026-02-17 09:00:00', 35.00,  5),
(43, 'Andre Souza',      '81991110006', 4, '2026-02-17 14:00:00', '2026-02-17 15:00:00', 55.00,  6),
(44, 'Marcos Paulo',     '81991110007', 1, '2026-02-17 10:00:00', '2026-02-17 10:30:00', 35.00,  7),
-- Quarta 18/02
(45, 'Marcos Paulo',     '81991110007', 1, '2026-02-18 09:00:00', '2026-02-18 09:30:00', 35.00,  7),
(46, 'Rafael Santos',    '81991110008', 1, '2026-02-18 10:30:00', '2026-02-18 11:30:00', 55.00,  8),
(47, 'Diego Oliveira',   '81991110009', 2, '2026-02-18 14:00:00', '2026-02-18 14:45:00', 45.00,  9),
(48, 'Felipe Rocha',     '81991110010', 3, '2026-02-18 16:00:00', '2026-02-18 16:30:00', 30.00,  10),
(49, 'Leonardo Silva',   '81991110011', 4, '2026-02-18 11:00:00', '2026-02-18 12:00:00', 55.00,  11),
(50, 'Ricardo Gomes',    '81991110001', 1, '2026-02-18 15:00:00', '2026-02-18 16:00:00', 55.00,  1),
-- Quinta 19/02
(51, 'Leonardo Silva',   '81991110011', 1, '2026-02-19 11:00:00', '2026-02-19 12:00:00', 55.00,  11),
(52, 'Roberto Dias',     '81991110016', 2, '2026-02-19 09:00:00', '2026-02-19 09:45:00', 45.00,  NULL),
(53, 'Mateus Barros',    '81991110017', 3, '2026-02-19 15:00:00', '2026-02-19 15:30:00', 35.00,  NULL),
(54, 'Paulo Henrique',   '81991110023', 4, '2026-02-19 14:00:00', '2026-02-19 15:30:00', 80.00,  15),
-- Sexta 20/02
(55, 'Henrique Costa',   '81991110012', 2, '2026-02-20 15:00:00', '2026-02-20 17:00:00', 120.00, 12),
(56, 'Fernando Lima',    '81991110002', 1, '2026-02-20 09:00:00', '2026-02-20 10:00:00', 55.00,  2),
(57, 'Anderson Reis',    '81991110019', 3, '2026-02-20 10:00:00', '2026-02-20 10:30:00', 35.00,  NULL),
(58, 'Danilo Pereira',   '81991110020', 4, '2026-02-20 14:00:00', '2026-02-20 14:30:00', 30.00,  NULL),
-- Sabado 21/02
(59, 'Gabriel Ferreira', '81991110013', 1, '2026-02-21 08:00:00', '2026-02-21 08:30:00', 35.00,  13),
(60, 'Caio Mendes',      '81991110014', 2, '2026-02-21 09:00:00', '2026-02-21 09:30:00', 30.00,  14),
(61, 'Bruno Martins',    '81991110004', 3, '2026-02-21 10:00:00', '2026-02-21 11:00:00', 55.00,  4),
(62, 'Ricardo Gomes',    '81991110001', 1, '2026-02-21 11:00:00', '2026-02-21 11:45:00', 45.00,  1),
(63, 'Paulo Henrique',   '81991110023', 4, '2026-02-21 14:00:00', '2026-02-21 15:30:00', 80.00,  15),
(64, 'Andre Souza',      '81991110006', 2, '2026-02-21 15:00:00', '2026-02-21 15:15:00', 15.00,  6),
(65, 'Felipe Rocha',     '81991110010', 1, '2026-02-21 16:00:00', '2026-02-21 16:30:00', 30.00,  10);

-- ==========================================
-- AGENDAMENTOS COM STATUS (solicitacoes de clientes)
-- IDs 66-70: Pendentes, Rejeitado, Cancelado
-- ==========================================
INSERT INTO appointment (id_appointment, name_client, number_client, id_barber, start_time, end_time, total_price, client_id, status) VALUES
-- Pendentes de aprovacao (solicitados por clientes)
(66, 'Ricardo Gomes',    '81991110001', 1, '2026-02-24 09:00:00', '2026-02-24 10:00:00', 55.00, 1,  'PENDING_APPROVAL'),
(67, 'Fernando Lima',    '81991110002', 2, '2026-02-24 14:00:00', '2026-02-24 14:45:00', 45.00, 2,  'PENDING_APPROVAL'),
(68, 'Gustavo Alves',    '81991110003', 1, '2026-02-25 10:00:00', '2026-02-25 10:30:00', 35.00, 3,  'PENDING_APPROVAL'),
-- Rejeitado (com motivo)
(69, 'Ricardo Gomes',    '81991110001', 4, '2026-02-22 14:00:00', '2026-02-22 15:00:00', 55.00, 1,  'REJECTED'),
-- Cancelado pelo cliente
(70, 'Fernando Lima',    '81991110002', 3, '2026-02-23 09:00:00', '2026-02-23 09:30:00', 35.00, 2,  'CANCELLED');

-- Motivo da rejeicao
UPDATE appointment SET rejection_reason = 'Barbeiro Lucas estara de folga neste dia (domingo).' WHERE id_appointment = 69;

SELECT setval('appointment_id_appointment_seq', 70);

-- ==========================================
-- AGENDAMENTO x SERVICO
-- ==========================================
-- Janeiro
INSERT INTO appointment_service (id_appointment, id_service) VALUES
(1, 1), (2, 4), (3, 2), (4, 3), (5, 4), (6, 4),
(7, 4), (8, 3), (9, 1), (10, 1), (11, 4), (12, 4),
(13, 9), (14, 4), (15, 4), (16, 5), (17, 2), (18, 2),
(19, 3), (20, 1), (21, 4), (22, 4), (23, 1), (24, 4),
(25, 1), (26, 3), (27, 1),
-- Fevereiro (antes da semana)
(28, 5), (29, 4), (30, 4), (31, 4), (32, 1), (33, 9),
(34, 3), (35, 1), (36, 2),
-- Semana atual
(37, 1), (38, 4), (39, 2), (40, 4),
(41, 3), (42, 1), (43, 4), (44, 1),
(45, 1), (46, 4), (47, 2), (48, 3), (49, 4), (50, 4),
(51, 4), (52, 2), (53, 1), (54, 5),
(55, 9), (56, 4), (57, 1), (58, 3),
(59, 1), (60, 3), (61, 4), (62, 2), (63, 5), (64, 6), (65, 3),
-- Novos agendamentos (pendentes/rejeitado/cancelado)
(66, 4), (67, 2), (68, 1), (69, 4), (70, 1);

-- ==========================================
-- PAGAMENTOS (PAYMENT) - JANEIRO
-- Receita total Jan: R$ 1.300,00
-- ==========================================
INSERT INTO payment (id_payment, appointment_id, client_id, barber_id, amount, discount, final_amount, tip, payment_method, status, transaction_id, payment_date, commission_rate, commission_amount, installments, loyalty_points_earned, created_at, updated_at) VALUES
(1,  1,  1,  1, 35.00,  0.00, 35.00,  5.00, 'PIX',         'COMPLETED', 'TXN-JAN-001', '2026-01-05 09:30:00', 30.00, 10.50, 1, 35,  '2026-01-05 09:30:00', '2026-01-05 09:30:00'),
(2,  2,  2,  1, 55.00,  0.00, 55.00,  0.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-JAN-002', '2026-01-05 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-05 11:00:00', '2026-01-05 11:00:00'),
(3,  3,  3,  2, 45.00,  0.00, 45.00,  0.00, 'DEBIT_CARD',  'COMPLETED', 'TXN-JAN-003', '2026-01-06 10:15:00', 30.00, 13.50, 1, 45,  '2026-01-06 10:15:00', '2026-01-06 10:15:00'),
(4,  4,  4,  2, 30.00,  0.00, 30.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-004', '2026-01-06 14:30:00', 30.00, 9.00,  1, 30,  '2026-01-06 14:30:00', '2026-01-06 14:30:00'),
(5,  5,  6,  4, 55.00,  0.00, 55.00, 10.00, 'CASH',        'COMPLETED', 'TXN-JAN-005', '2026-01-07 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-07 11:00:00', '2026-01-07 11:00:00'),
(6,  6,  11, 1, 55.00,  5.00, 50.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-006', '2026-01-08 12:00:00', 30.00, 15.00, 1, 50,  '2026-01-08 12:00:00', '2026-01-08 12:00:00'),
(7,  7,  8,  1, 55.00,  0.00, 55.00,  0.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-JAN-007', '2026-01-12 11:00:00', 30.00, 16.50, 2, 55,  '2026-01-12 11:00:00', '2026-01-12 11:00:00'),
(8,  8,  10, 3, 30.00,  0.00, 30.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-008', '2026-01-12 15:30:00', 30.00, 9.00,  1, 30,  '2026-01-12 15:30:00', '2026-01-12 15:30:00'),
(9,  9,  5,  3, 35.00,  0.00, 35.00,  0.00, 'CASH',        'COMPLETED', 'TXN-JAN-009', '2026-01-13 09:30:00', 30.00, 10.50, 1, 35,  '2026-01-13 09:30:00', '2026-01-13 09:30:00'),
(10, 10, 7,  1, 35.00,  0.00, 35.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-010', '2026-01-14 09:30:00', 30.00, 10.50, 1, 35,  '2026-01-14 09:30:00', '2026-01-14 09:30:00'),
(11, 11, 1,  1, 55.00,  0.00, 55.00,  5.00, 'DEBIT_CARD',  'COMPLETED', 'TXN-JAN-011', '2026-01-15 10:00:00', 30.00, 16.50, 1, 55,  '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
(12, 12, 6,  4, 55.00,  0.00, 55.00, 10.00, 'PIX',         'COMPLETED', 'TXN-JAN-012', '2026-01-15 15:00:00', 30.00, 16.50, 1, 55,  '2026-01-15 15:00:00', '2026-01-15 15:00:00'),
(13, 13, 12, 2, 120.00, 0.00, 120.00, 0.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-JAN-013', '2026-01-16 17:00:00', 30.00, 36.00, 2, 120, '2026-01-16 17:00:00', '2026-01-16 17:00:00'),
(14, 14, 2,  1, 55.00,  0.00, 55.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-014', '2026-01-17 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-17 11:00:00', '2026-01-17 11:00:00'),
(15, 15, 4,  2, 55.00,  0.00, 55.00,  0.00, 'DEBIT_CARD',  'COMPLETED', 'TXN-JAN-015', '2026-01-19 12:00:00', 30.00, 16.50, 1, 55,  '2026-01-19 12:00:00', '2026-01-19 12:00:00'),
(16, 16, 15, 4, 80.00,  0.00, 80.00,  0.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-JAN-016', '2026-01-20 15:30:00', 30.00, 24.00, 2, 80,  '2026-01-20 15:30:00', '2026-01-20 15:30:00'),
(17, 17, 9,  2, 45.00,  0.00, 45.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-017', '2026-01-21 14:45:00', 30.00, 13.50, 1, 45,  '2026-01-21 14:45:00', '2026-01-21 14:45:00'),
(18, 18, 3,  2, 45.00,  0.00, 45.00,  0.00, 'CASH',        'COMPLETED', 'TXN-JAN-018', '2026-01-22 10:15:00', 30.00, 13.50, 1, 45,  '2026-01-22 10:15:00', '2026-01-22 10:15:00'),
(19, 19, 10, 3, 30.00,  0.00, 30.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-019', '2026-01-22 16:30:00', 30.00, 9.00,  1, 30,  '2026-01-22 16:30:00', '2026-01-22 16:30:00'),
(20, 20, 14, 2, 30.00,  0.00, 30.00,  0.00, 'DEBIT_CARD',  'COMPLETED', 'TXN-JAN-020', '2026-01-25 11:30:00', 30.00, 9.00,  1, 30,  '2026-01-25 11:30:00', '2026-01-25 11:30:00'),
(21, 21, 8,  1, 55.00,  0.00, 55.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-021', '2026-01-26 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-26 11:00:00', '2026-01-26 11:00:00'),
(22, 22, 6,  4, 55.00,  0.00, 55.00,  0.00, 'CASH',        'COMPLETED', 'TXN-JAN-022', '2026-01-27 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-27 11:00:00', '2026-01-27 11:00:00'),
(23, 23, 1,  1, 35.00,  0.00, 35.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-023', '2026-01-28 09:30:00', 30.00, 10.50, 1, 35,  '2026-01-28 09:30:00', '2026-01-28 09:30:00'),
(24, 24, 2,  1, 55.00,  0.00, 55.00,  0.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-JAN-024', '2026-01-29 11:00:00', 30.00, 16.50, 1, 55,  '2026-01-29 11:00:00', '2026-01-29 11:00:00'),
(25, 25, 7,  1, 35.00,  0.00, 35.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-025', '2026-01-30 09:30:00', 30.00, 10.50, 1, 35,  '2026-01-30 09:30:00', '2026-01-30 09:30:00'),
(26, 26, 4,  2, 30.00,  0.00, 30.00,  0.00, 'CASH',        'COMPLETED', 'TXN-JAN-026', '2026-01-30 14:30:00', 30.00, 9.00,  1, 30,  '2026-01-30 14:30:00', '2026-01-30 14:30:00'),
(27, 27, 5,  3, 35.00,  0.00, 35.00,  0.00, 'PIX',         'COMPLETED', 'TXN-JAN-027', '2026-01-31 09:00:00', 30.00, 10.50, 1, 35,  '2026-01-31 09:00:00', '2026-01-31 09:00:00');

-- ==========================================
-- PAGAMENTOS - FEVEREIRO (mes atual)
-- ==========================================
INSERT INTO payment (id_payment, appointment_id, client_id, barber_id, amount, discount, final_amount, tip, payment_method, status, transaction_id, coupon_code, coupon_discount, payment_date, commission_rate, commission_amount, installments, loyalty_points_earned, created_at, updated_at) VALUES
-- Semana 02-07 Feb
(28, 28, 15, 4, 80.00,  0.00, 80.00,  0.00,  'CREDIT_CARD', 'COMPLETED', 'TXN-FEV-001', NULL,         0.00, '2026-02-02 11:30:00', 30.00, 24.00, 2, 80,  '2026-02-02 11:30:00', '2026-02-02 11:30:00'),
(29, 29, 2,  1, 55.00,  0.00, 55.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-002', NULL,         0.00, '2026-02-03 11:00:00', 30.00, 16.50, 1, 55,  '2026-02-03 11:00:00', '2026-02-03 11:00:00'),
(30, 30, 6,  4, 55.00,  0.00, 55.00, 10.00,  'CASH',        'COMPLETED', 'TXN-FEV-003', NULL,         0.00, '2026-02-05 15:00:00', 30.00, 16.50, 1, 55,  '2026-02-05 15:00:00', '2026-02-05 15:00:00'),
(31, 31, 1,  1, 55.00,  5.00, 50.00,  5.00,  'PIX',         'COMPLETED', 'TXN-FEV-004', 'AMIGO10',    5.00, '2026-02-07 10:00:00', 30.00, 15.00, 1, 50,  '2026-02-07 10:00:00', '2026-02-07 10:00:00'),
-- Semana 09-14 Feb
(32, 32, 13, 3, 35.00,  0.00, 35.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-005', 'BEMVINDO',   0.00, '2026-02-10 09:30:00', 30.00, 10.50, 1, 35,  '2026-02-10 09:30:00', '2026-02-10 09:30:00'),
(33, 33, 12, 2, 120.00, 0.00, 120.00, 0.00,  'CREDIT_CARD', 'COMPLETED', 'TXN-FEV-006', NULL,         0.00, '2026-02-10 17:00:00', 30.00, 36.00, 3, 120, '2026-02-10 17:00:00', '2026-02-10 17:00:00'),
(34, 34, 10, 3, 30.00,  0.00, 30.00,  0.00,  'DEBIT_CARD',  'COMPLETED', 'TXN-FEV-007', NULL,         0.00, '2026-02-12 16:30:00', 30.00, 9.00,  1, 30,  '2026-02-12 16:30:00', '2026-02-12 16:30:00'),
(35, 35, 14, 2, 30.00,  0.00, 30.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-008', NULL,         0.00, '2026-02-13 11:30:00', 30.00, 9.00,  1, 30,  '2026-02-13 11:30:00', '2026-02-13 11:30:00'),
(36, 36, 3,  2, 45.00,  0.00, 45.00,  0.00,  'CASH',        'COMPLETED', 'TXN-FEV-009', NULL,         0.00, '2026-02-14 10:15:00', 30.00, 13.50, 1, 45,  '2026-02-14 10:15:00', '2026-02-14 10:15:00'),
-- Segunda 16/02
(37, 37, 1,  1, 35.00,  0.00, 35.00,  5.00,  'PIX',         'COMPLETED', 'TXN-FEV-010', NULL,         0.00, '2026-02-16 09:30:00', 30.00, 10.50, 1, 35,  '2026-02-16 09:30:00', '2026-02-16 09:30:00'),
(38, 38, 2,  1, 55.00,  0.00, 55.00,  0.00,  'CREDIT_CARD', 'COMPLETED', 'TXN-FEV-011', 'CARNAVAL26', 0.00, '2026-02-16 11:00:00', 30.00, 16.50, 1, 55,  '2026-02-16 11:00:00', '2026-02-16 11:00:00'),
(39, 39, 3,  2, 45.00,  5.00, 40.00,  0.00,  'DEBIT_CARD',  'COMPLETED', 'TXN-FEV-012', 'CARNAVAL26', 5.00, '2026-02-16 10:15:00', 30.00, 12.00, 1, 40,  '2026-02-16 10:15:00', '2026-02-16 10:15:00'),
(40, 40, 6,  4, 55.00,  0.00, 55.00, 10.00,  'CASH',        'COMPLETED', 'TXN-FEV-013', NULL,         0.00, '2026-02-16 15:00:00', 30.00, 16.50, 1, 55,  '2026-02-16 15:00:00', '2026-02-16 15:00:00'),
-- Terca 17/02
(41, 41, 4,  2, 30.00,  0.00, 30.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-014', NULL,         0.00, '2026-02-17 11:30:00', 30.00, 9.00,  1, 30,  '2026-02-17 11:30:00', '2026-02-17 11:30:00'),
(42, 42, 5,  3, 35.00,  0.00, 35.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-015', NULL,         0.00, '2026-02-17 09:00:00', 30.00, 10.50, 1, 35,  '2026-02-17 09:00:00', '2026-02-17 09:00:00'),
(43, 43, 6,  4, 55.00,  0.00, 55.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-016', 'FLASH26',    0.00, '2026-02-17 15:00:00', 30.00, 16.50, 1, 55,  '2026-02-17 15:00:00', '2026-02-17 15:00:00'),
(44, 44, 7,  1, 35.00,  0.00, 35.00,  0.00,  'DEBIT_CARD',  'COMPLETED', 'TXN-FEV-017', NULL,         0.00, '2026-02-17 10:30:00', 30.00, 10.50, 1, 35,  '2026-02-17 10:30:00', '2026-02-17 10:30:00'),
-- Quarta 18/02 (alguns pendentes)
(45, 45, 7,  1, 35.00,  0.00, 35.00,  0.00,  'PIX',         'COMPLETED', 'TXN-FEV-018', NULL,         0.00, '2026-02-18 09:30:00', 30.00, 10.50, 1, 35,  '2026-02-18 09:30:00', '2026-02-18 09:30:00'),
(46, 46, 8,  1, 55.00,  0.00, 55.00,  0.00,  'CREDIT_CARD', 'PENDING',   NULL,          NULL,         0.00, NULL,                  30.00, 16.50, 1, 0,   '2026-02-18 10:30:00', '2026-02-18 10:30:00'),
(47, 47, 9,  2, 45.00,  0.00, 45.00,  0.00,  'PIX',         'PENDING',   NULL,          NULL,         0.00, NULL,                  30.00, 13.50, 1, 0,   '2026-02-18 14:00:00', '2026-02-18 14:00:00'),
(48, 48, 10, 3, 30.00,  0.00, 30.00,  0.00,  'DEBIT_CARD',  'PENDING',   NULL,          NULL,         0.00, NULL,                  30.00, 9.00,  1, 0,   '2026-02-18 16:00:00', '2026-02-18 16:00:00'),
-- Cancelado e Reembolsado (para estatisticas)
(49, 49, 11, 4, 55.00,  0.00, 55.00,  0.00,  'PIX',         'CANCELLED', NULL,          NULL,         0.00, NULL,                  30.00, 16.50, 1, 0,   '2026-02-18 11:00:00', '2026-02-18 11:00:00'),
(50, 50, 1,  1, 55.00,  0.00, 55.00,  0.00,  'PIX',         'REFUNDED',  'TXN-FEV-019', NULL,         0.00, '2026-02-18 16:00:00', 30.00, 16.50, 1, 0,   '2026-02-18 15:00:00', '2026-02-18 16:30:00');

SELECT setval('payment_id_payment_seq', 50);

-- ==========================================
-- AVALIACOES (REVIEW) - 20 avaliacoes
-- ==========================================
INSERT INTO review (id_review, appointment_id, client_id, barber_id, rating, service_rating, punctuality_rating, cleanliness_rating, value_rating, comment, would_recommend, is_visible, created_at, updated_at) VALUES
-- Carlos Silva (barbeiro 1) - media ~4.8
(1,  1,  1,  1, 5, 5, 5, 5, 4, 'Carlos e excelente! Melhor corte que ja fiz.',        true,  true, '2026-01-05 12:00:00', '2026-01-05 12:00:00'),
(2,  11, 1,  1, 5, 5, 4, 5, 5, 'Sempre perfeito, nao troco por nada!',                true,  true, '2026-01-15 12:00:00', '2026-01-15 12:00:00'),
(3,  7,  8,  1, 4, 4, 5, 5, 4, 'Muito bom, o combo ficou show.',                      true,  true, '2026-01-12 12:00:00', '2026-01-12 12:00:00'),
(4,  14, 2,  1, 5, 5, 5, 5, 5, 'Impecavel como sempre!',                              true,  true, '2026-01-17 12:00:00', '2026-01-17 12:00:00'),
-- Joao Santos (barbeiro 2) - media ~4.2
(5,  3,  3,  2, 4, 4, 4, 5, 4, 'Degrade ficou otimo, recomendo.',                     true,  true, '2026-01-06 12:00:00', '2026-01-06 12:00:00'),
(6,  13, 12, 2, 5, 5, 4, 4, 3, 'Platinado ficou incrivel, mas achei um pouco caro.',  true,  true, '2026-01-16 18:00:00', '2026-01-16 18:00:00'),
(7,  18, 3,  2, 4, 4, 4, 4, 4, 'Bom servico, consistente.',                           true,  true, '2026-01-22 12:00:00', '2026-01-22 12:00:00'),
(8,  17, 9,  2, 4, 3, 5, 4, 4, 'Bom degrade, mas poderia ter usado mais tesoura.',    true,  true, '2026-01-21 16:00:00', '2026-01-21 16:00:00'),
-- Pedro Oliveira (barbeiro 3) - media ~3.7
(9,  8,  10, 3, 4, 4, 3, 4, 4, 'Barba boa, mas demorou um pouco.',                    true,  true, '2026-01-12 16:30:00', '2026-01-12 16:30:00'),
(10, 9,  5,  3, 3, 3, 4, 4, 3, 'Corte razoavel. Poderia melhorar nos detalhes.',      true,  true, '2026-01-13 11:00:00', '2026-01-13 11:00:00'),
(11, 19, 10, 3, 4, 4, 4, 4, 4, 'Dessa vez foi melhor, barba ficou top.',              true,  true, '2026-01-22 17:00:00', '2026-01-22 17:00:00'),
-- Lucas Ferreira (barbeiro 4) - media ~4.5
(12, 5,  6,  4, 5, 5, 5, 4, 4, 'Lucas e muito atencioso e o combo ficou perfeito.',   true,  true, '2026-01-07 12:00:00', '2026-01-07 12:00:00'),
(13, 12, 6,  4, 5, 5, 4, 5, 5, 'Mais uma vez, servico impecavel do Lucas.',           true,  true, '2026-01-15 16:00:00', '2026-01-15 16:00:00'),
(14, 16, 15, 4, 4, 4, 4, 4, 4, 'Pigmentacao ficou natural, gostei.',                  true,  true, '2026-01-20 16:00:00', '2026-01-20 16:00:00'),
(15, 22, 6,  4, 4, 4, 5, 4, 4, 'Sempre confiavel.',                                   true,  true, '2026-01-27 12:00:00', '2026-01-27 12:00:00'),
-- Avaliacoes Fevereiro
(16, 31, 1,  1, 5, 5, 5, 5, 5, 'Carlos continua sendo o melhor!',                     true,  true, '2026-02-07 11:00:00', '2026-02-07 11:00:00'),
(17, 33, 12, 2, 4, 5, 3, 4, 3, 'Adorei o platinado, mas a espera foi longa.',         true,  true, '2026-02-10 18:00:00', '2026-02-10 18:00:00'),
(18, 32, 13, 3, 4, 4, 4, 4, 4, 'Boa primeira experiencia, voltarei.',                 true,  true, '2026-02-10 10:00:00', '2026-02-10 10:00:00'),
(19, 28, 15, 4, 5, 5, 5, 5, 4, 'Pigmentacao excelente como sempre.',                  true,  true, '2026-02-02 12:00:00', '2026-02-02 12:00:00'),
(20, 37, 1,  1, 5, 5, 5, 5, 5, 'Perfeito, como sempre!',                              true,  true, '2026-02-16 10:00:00', '2026-02-16 10:00:00');

SELECT setval('review_id_review_seq', 20);

-- ==========================================
-- AGENDA dos BARBEIROS (BARBER_SCHEDULE)
-- ==========================================
INSERT INTO barber_schedule (id_schedule, barber_id, schedule_type, start_date_time, end_date_time, reason, is_recurring, day_of_week, start_time, end_time, is_active, created_at, updated_at) VALUES
-- Almoco diario (recorrente)
(1, 1, 'LUNCH_BREAK', '2026-02-16 12:00:00', '2026-02-16 13:00:00', 'Horario de almoco', true,  'MONDAY',    '12:00:00', '13:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 2, 'LUNCH_BREAK', '2026-02-16 12:30:00', '2026-02-16 13:30:00', 'Horario de almoco', true,  'MONDAY',    '12:30:00', '13:30:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 3, 'LUNCH_BREAK', '2026-02-16 12:00:00', '2026-02-16 13:00:00', 'Horario de almoco', true,  'MONDAY',    '12:00:00', '13:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(4, 4, 'LUNCH_BREAK', '2026-02-16 13:00:00', '2026-02-16 14:00:00', 'Horario de almoco', true,  'MONDAY',    '13:00:00', '14:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
-- Folgas de domingo
(5, 1, 'DAY_OFF',     '2026-02-22 08:00:00', '2026-02-22 18:00:00', 'Domingo - folga semanal', true, 'SUNDAY', '08:00:00', '18:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(6, 2, 'DAY_OFF',     '2026-02-22 09:00:00', '2026-02-22 19:00:00', 'Domingo - folga semanal', true, 'SUNDAY', '09:00:00', '19:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(7, 3, 'DAY_OFF',     '2026-02-22 08:00:00', '2026-02-22 17:00:00', 'Domingo - folga semanal', true, 'SUNDAY', '08:00:00', '17:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(8, 4, 'DAY_OFF',     '2026-02-22 10:00:00', '2026-02-22 20:00:00', 'Domingo - folga semanal', true, 'SUNDAY', '10:00:00', '20:00:00', true, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
-- Eventos especiais
(9,  3, 'VACATION',      '2026-02-23 08:00:00', '2026-02-28 17:00:00', 'Ferias de carnaval',                   false, NULL, NULL, NULL, true, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
(10, 2, 'TRAINING',      '2026-02-19 08:00:00', '2026-02-19 10:00:00', 'Treinamento tecnica platinado',        false, NULL, NULL, NULL, true, '2026-02-10 09:00:00', '2026-02-10 09:00:00'),
(11, 1, 'SPECIAL_HOURS', '2026-02-21 08:00:00', '2026-02-21 20:00:00', 'Horario estendido - sabado de carnaval', false, NULL, NULL, NULL, true, '2026-02-15 10:00:00', '2026-02-15 10:00:00');

SELECT setval('barber_schedule_id_schedule_seq', 11);

-- ==========================================
-- NOTIFICACOES (NOTIFICATION) - 12
-- ==========================================
INSERT INTO notification (id_notification, client_id, barber_id, appointment_id, type, channel, title, message, status, recipient_email, recipient_phone, scheduled_for, sent_at, read_at, created_at, updated_at) VALUES
(1,  1,  1, 37, 'APPOINTMENT_CONFIRMATION', 'WHATSAPP', 'Agendamento Confirmado',     'Ola Ricardo! Seu corte com Carlos esta confirmado para 16/02 as 09:00.', 'DELIVERED', 'ricardo.gomes@email.com',     '81991110001', '2026-02-15 18:00:00', '2026-02-15 18:01:00', '2026-02-15 18:05:00', '2026-02-15 18:00:00', '2026-02-15 18:05:00'),
(2,  2,  1, 38, 'APPOINTMENT_CONFIRMATION', 'EMAIL',    'Agendamento Confirmado',     'Ola Fernando! Combo corte+barba com Carlos confirmado para 16/02 as 10:00.', 'DELIVERED', 'fernando.lima@email.com',     '81991110002', '2026-02-15 18:00:00', '2026-02-15 18:01:00', '2026-02-16 08:00:00', '2026-02-15 18:00:00', '2026-02-16 08:00:00'),
(3,  7,  1, 45, 'APPOINTMENT_REMINDER',     'WHATSAPP', 'Lembrete de Agendamento',    'Marcos, seu corte e amanha (18/02) as 09:00 com Carlos. Ate la!', 'DELIVERED', 'marcos.paulo@email.com',      '81991110007', '2026-02-17 18:00:00', '2026-02-17 18:01:00', '2026-02-17 19:30:00', '2026-02-17 18:00:00', '2026-02-17 19:30:00'),
(4,  8,  1, 46, 'APPOINTMENT_REMINDER',     'EMAIL',    'Lembrete de Agendamento',    'Rafael, combo corte+barba e hoje (18/02) as 10:30.', 'SENT', 'rafael.santos@email.com',     '81991110008', '2026-02-18 07:00:00', '2026-02-18 07:01:00', NULL, '2026-02-18 07:00:00', '2026-02-18 07:01:00'),
(5,  1,  NULL, NULL, 'PROMOTION',           'WHATSAPP', 'Promocao de Carnaval!',      'Ricardo, aproveite a promocao de Carnaval! Use o cupom CARNAVAL26 para desconto.', 'DELIVERED', 'ricardo.gomes@email.com', '81991110001', '2026-02-14 10:00:00', '2026-02-14 10:01:00', '2026-02-14 10:30:00', '2026-02-14 10:00:00', '2026-02-14 10:30:00'),
(6,  3,  NULL, NULL, 'PROMOTION',           'WHATSAPP', 'Promocao de Carnaval!',      'Gustavo, promocao especial de Carnaval! Cupom: CARNAVAL26', 'DELIVERED', 'gustavo.alves@email.com',     '81991110003', '2026-02-14 10:00:00', '2026-02-14 10:02:00', '2026-02-14 11:00:00', '2026-02-14 10:00:00', '2026-02-14 11:00:00'),
(7,  6,  NULL, NULL, 'PROMOTION',           'PHONE',    'Flash Sale!',                'Andre, promocao relampago! 17-19/02, use FLASH26.', 'SENT', 'andre.souza@email.com',       '81991110006', '2026-02-17 08:00:00', '2026-02-17 08:01:00', NULL, '2026-02-17 08:00:00', '2026-02-17 08:01:00'),
(8,  2,  NULL, NULL, 'LOYALTY_POINTS',      'EMAIL',    'Parabens! Voce e Platina!',  'Fernando, voce atingiu o nivel Platina com 520 pontos de fidelidade!', 'DELIVERED', 'fernando.lima@email.com',     '81991110002', '2026-02-16 12:00:00', '2026-02-16 12:01:00', '2026-02-16 14:00:00', '2026-02-16 12:00:00', '2026-02-16 14:00:00'),
(9,  1,  1, 37, 'PAYMENT_CONFIRMATION',     'WHATSAPP', 'Pagamento Confirmado',       'Ricardo, pagamento de R$35,00 (PIX) confirmado. Obrigado!', 'DELIVERED', 'ricardo.gomes@email.com',     '81991110001', '2026-02-16 09:31:00', '2026-02-16 09:31:00', '2026-02-16 09:35:00', '2026-02-16 09:31:00', '2026-02-16 09:35:00'),
(10, 1,  1, 37, 'REVIEW_REQUEST',           'WHATSAPP', 'Como foi seu corte?',        'Ricardo, o que achou do seu corte com Carlos? Deixe sua avaliacao!', 'DELIVERED', 'ricardo.gomes@email.com',     '81991110001', '2026-02-16 15:00:00', '2026-02-16 15:01:00', '2026-02-16 16:00:00', '2026-02-16 15:00:00', '2026-02-16 16:00:00'),
(11, 13, NULL, NULL, 'WELCOME',             'WHATSAPP', 'Bem-vindo ao GoBarber!',     'Gabriel, seja bem-vindo! Use o cupom BEMVINDO na sua primeira visita.', 'DELIVERED', 'gabriel.ferreira@email.com',  '81991110013', '2026-02-10 09:00:00', '2026-02-10 09:01:00', '2026-02-10 09:15:00', '2026-02-10 09:00:00', '2026-02-10 09:15:00'),
(12, 11, 1, 51, 'APPOINTMENT_REMINDER',     'WHATSAPP', 'Lembrete de Agendamento',    'Leonardo, seu combo e amanha (19/02) as 11:00 com Carlos.', 'SCHEDULED', 'leonardo.silva@email.com',    '81991110011', '2026-02-18 18:00:00', NULL, NULL, '2026-02-18 10:00:00', '2026-02-18 10:00:00');

SELECT setval('notification_id_notification_seq', 12);

-- ==========================================
-- LISTA DE ESPERA (WAIT_LIST) - 6
-- ==========================================
INSERT INTO wait_list (id_wait_list, client_id, preferred_barber_id, desired_time, desired_duration, priority, status, position, notes, notified, expiration_time, created_at, updated_at) VALUES
(1, 9,  1, '2026-02-19 10:00:00', 30, 'NORMAL', 'WAITING',   1, 'Quer corte com Carlos especificamente', false, '2026-02-19 12:00:00', '2026-02-18 09:00:00', '2026-02-18 09:00:00'),
(2, 10, 2, '2026-02-20 14:00:00', 45, 'HIGH',   'WAITING',   2, 'Quer degrade, horario flexivel',        false, '2026-02-20 18:00:00', '2026-02-18 10:00:00', '2026-02-18 10:00:00'),
(3, 11, 1, '2026-02-21 09:00:00', 60, 'NORMAL', 'WAITING',   3, NULL,                                    false, '2026-02-21 12:00:00', '2026-02-18 11:00:00', '2026-02-18 11:00:00'),
(4, 3,  4, '2026-02-19 15:00:00', 30, 'NORMAL', 'NOTIFIED',  1, 'Vaga abriu, aguardando confirmacao',    true,  '2026-02-19 18:00:00', '2026-02-17 14:00:00', '2026-02-18 08:00:00'),
(5, 14, 2, '2026-02-21 09:00:00', 30, 'LOW',    'CONVERTED', 1, 'Convertido para agendamento #60',       true,  '2026-02-21 12:00:00', '2026-02-15 09:00:00', '2026-02-17 10:00:00'),
(6, 5,  3, '2026-02-15 10:00:00', 30, 'LOW',    'EXPIRED',   1, 'Nao respondeu a tempo',                 true,  '2026-02-15 14:00:00', '2026-02-13 16:00:00', '2026-02-15 14:00:00');

SELECT setval('wait_list_id_wait_list_seq', 6);

-- ==========================================
-- AUDIT LOG - 20 registros
-- ==========================================
INSERT INTO audit_log (id_audit, action_type, entity_type, entity_id, username, user_id, user_email, description, ip_address, http_method, request_url, response_status, execution_time_ms, success, created_at) VALUES
(1,  'LOGIN',        'User',        1,    'admin',          1, 'admin@gobarber.com',             'Login realizado com sucesso',                  '192.168.1.100', 'POST',   '/api/auth/login',              200, 45,  true,  '2026-02-18 07:55:00'),
(2,  'LOGIN',        'User',        2,    'carlos.barbeiro',2, 'carlos.barbeiro@gobarber.com',   'Login realizado com sucesso',                  '192.168.1.101', 'POST',   '/api/auth/login',              200, 38,  true,  '2026-02-18 07:58:00'),
(3,  'VIEW',         'Dashboard',   NULL, 'admin',          1, 'admin@gobarber.com',             'Dashboard mensal acessado',                    '192.168.1.100', 'GET',    '/api/dashboard/month',         200, 120, true,  '2026-02-18 08:00:00'),
(4,  'CREATE',       'Appointment', 45,   'admin',          1, 'admin@gobarber.com',             'Agendamento criado: Marcos Paulo 18/02 09:00', '192.168.1.100', 'POST',   '/api/appointments',            201, 85,  true,  '2026-02-17 18:00:00'),
(5,  'CREATE',       'Appointment', 46,   'admin',          1, 'admin@gobarber.com',             'Agendamento criado: Rafael Santos 18/02 10:30','192.168.1.100', 'POST',   '/api/appointments',            201, 78,  true,  '2026-02-17 18:05:00'),
(6,  'PAYMENT',      'Payment',     45,   'admin',          1, 'admin@gobarber.com',             'Pagamento R$35,00 via PIX confirmado',         '192.168.1.100', 'POST',   '/api/payment/45/confirm',      200, 95,  true,  '2026-02-18 09:31:00'),
(7,  'CANCEL',       'Payment',     49,   'admin',          1, 'admin@gobarber.com',             'Pagamento #49 cancelado',                      '192.168.1.100', 'POST',   '/api/payment/49/cancel',       200, 60,  true,  '2026-02-18 11:30:00'),
(8,  'REFUND',       'Payment',     50,   'admin',          1, 'admin@gobarber.com',             'Reembolso R$55,00 - cliente desistiu',         '192.168.1.100', 'POST',   '/api/payment/50/refund',       200, 110, true,  '2026-02-18 16:30:00'),
(9,  'CREATE',       'Client',      13,   'admin',          1, 'admin@gobarber.com',             'Novo cliente: Gabriel Ferreira',                '192.168.1.100', 'POST',   '/api/client/create-without-photo', 201, 92, true, '2026-02-10 09:00:00'),
(10, 'UPDATE',       'Client',      2,    'admin',          1, 'admin@gobarber.com',             'Cliente Fernando atualizado para Platina',      '192.168.1.100', 'PUT',    '/api/client/2',                200, 55,  true,  '2026-02-16 12:00:00'),
(11, 'CREATE',       'Review',      20,   'admin',          1, 'admin@gobarber.com',             'Avaliacao 5 estrelas de Ricardo',               '192.168.1.100', 'POST',   '/api/reviews',                 201, 48,  true,  '2026-02-16 10:00:00'),
(12, 'VIEW',         'Report',      NULL, 'admin',          1, 'admin@gobarber.com',             'Relatorio financeiro acessado',                 '192.168.1.100', 'GET',    '/api/dashboard/financial',     200, 180, true,  '2026-02-17 09:00:00'),
(13, 'LOGIN_FAILED', 'User',        NULL, NULL,             NULL, 'hacker@evil.com',             'Tentativa de login falhou',                     '192.168.1.200', 'POST',   '/api/auth/login',              401, 30,  false, '2026-02-17 03:15:00'),
(14, 'EXPORT',       'Report',      NULL, 'admin',          1, 'admin@gobarber.com',             'Exportacao de relatorio de clientes',           '192.168.1.100', 'GET',    '/api/dashboard/clients',       200, 250, true,  '2026-02-15 14:00:00'),
(15, 'VIEW',         'Appointment', NULL, 'admin',          1, 'admin@gobarber.com',             'Lista de agendamentos acessada',                '192.168.1.100', 'GET',    '/api/appointments',            200, 65,  true,  '2026-02-18 08:05:00'),
(16, 'LOGIN',        'User',        6,    'ana.secretaria', 6, 'ana.secretaria@gobarber.com',    'Login realizado com sucesso',                   '192.168.1.102', 'POST',   '/api/auth/login',              200, 42,  true,  '2026-02-18 08:00:00'),
(17, 'CREATE',       'Appointment', 50,   'admin',          1, 'admin@gobarber.com',             'Agendamento criado: Ricardo Gomes 18/02 15:00','192.168.1.100', 'POST',   '/api/appointments',            201, 80,  true,  '2026-02-18 09:00:00'),
(18, 'LOGIN',        'User',        1,    'admin',          1, 'admin@gobarber.com',             'Login realizado com sucesso',                   '192.168.1.100', 'POST',   '/api/auth/login',              200, 40,  true,  '2026-02-17 08:00:00'),
(19, 'VIEW',         'Dashboard',   NULL, 'admin',          1, 'admin@gobarber.com',             'Dashboard semanal acessado',                    '192.168.1.100', 'GET',    '/api/dashboard/week',          200, 130, true,  '2026-02-17 08:05:00'),
(20, 'DELETE',       'Appointment', 49,   'admin',          1, 'admin@gobarber.com',             'Agendamento cancelado: Leonardo (18/02 11:00)','192.168.1.100', 'DELETE', '/api/appointments/49',         200, 55,  true,  '2026-02-18 10:00:00');

SELECT setval('audit_log_id_audit_seq', 20);

-- ==========================================
-- ENDERECOS ADICIONAIS (para barbearias)
-- ==========================================
INSERT INTO address (id_adress, street, number, neighborhood, city, state, cep) VALUES
(26, 'Rua do Corte',            100,  'Centro',       'Recife', 'PE', '5001050'),
(27, 'Av. Recife',              2500, 'Boa Viagem',   'Recife', 'PE', '5102500');

SELECT setval('address_id_adress_seq', 27);

-- ==========================================
-- REGRAS DE CANCELAMENTO (CANCELLATION_RULE)
-- ==========================================
INSERT INTO cancellation_rule (id_cancellation_rule, cancel_deadline_hours, cancellation_fee_percentage, no_show_fee_percentage, max_cancellations_per_month, allow_reschedule, reschedule_deadline_hours, penalty_after_max_cancellations, block_days_after_max_cancellations, active, created_at, updated_at) VALUES
(1, 24, 0,   100, 3, true,  12, true,  7,  true,  '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 12, 25,  100, 5, true,  6,  false, 0,  true,  '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 48, 50,  100, 2, false, 24, true,  14, false, '2026-01-01 00:00:00', '2026-01-01 00:00:00');

SELECT setval('cancellation_rule_id_cancellation_rule_seq', 3);

-- ==========================================
-- BARBEARIAS (BARBERSHOP) - 2 registros
-- ==========================================
INSERT INTO barbershop (id_barbershop, name, slug, description, cnpj, phone, email, logo_url, banner_url, id_address, opening_hours, active, created_at, updated_at) VALUES
(1, 'GoBarber Principal',    'gobarber-principal',    'A melhor barbearia do Recife. Cortes modernos, barba, tratamento capilar e muito mais.', '12345678000190', '81999990001', 'contato@gobarber.com',     '', '', 26, 'Seg-Sex 9h-20h, Sab 9h-18h',     true,  '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 'GoBarber Boa Viagem',   'gobarber-boa-viagem',   'Filial Boa Viagem com ambiente premium e vista para o mar.',                           '12345678000290', '81999990002', 'boaviagem@gobarber.com',   '', '', 27, 'Seg-Sab 8h-21h, Dom 10h-16h',     true,  '2026-01-15 00:00:00', '2026-01-15 00:00:00');

SELECT setval('barbershop_id_barbershop_seq', 2);

-- ==========================================
-- CLIENTES x BARBEARIAS (client_barbershop)
-- ==========================================
INSERT INTO client_barbershop (id_barbershop, id_client) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(1, 11), (1, 12), (1, 13), (1, 14), (1, 15),
(2, 1), (2, 3), (2, 5), (2, 7), (2, 9), (2, 11);

-- ==========================================
-- BARBEIROS x BARBEARIAS (barber_barbershop) - multi-tenant
-- ==========================================
DELETE FROM barber_barbershop;
INSERT INTO barber_barbershop (id_barbershop, id_barber) VALUES
(1, 1), (1, 2), (1, 3),   -- GoBarber Principal: Carlos, João, Pedro
(2, 3), (2, 4);            -- GoBarber Boa Viagem: Pedro (trabalha nas 2), Lucas

-- ==========================================
-- RESUMO FINAL
-- ==========================================
DO $$
DECLARE
    v_addresses    INT; v_users       INT; v_barbers     INT;
    v_secretaries  INT; v_services    INT; v_products    INT;
    v_stock        INT; v_sales       INT; v_clients     INT;
    v_appointments INT; v_payments    INT; v_reviews     INT;
    v_notifications INT; v_waitlist   INT; v_audit       INT;
    v_schedules    INT; v_barbershops INT; v_cancel_rules INT;
    v_jan_revenue  NUMERIC; v_feb_revenue NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_addresses FROM address;
    SELECT COUNT(*) INTO v_users FROM employee;
    SELECT COUNT(*) INTO v_barbers FROM barber;
    SELECT COUNT(*) INTO v_secretaries FROM secretary;
    SELECT COUNT(*) INTO v_services FROM service;
    SELECT COUNT(*) INTO v_products FROM product;
    SELECT COUNT(*) INTO v_stock FROM product_stock;
    SELECT COUNT(*) INTO v_sales FROM sale;
    SELECT COUNT(*) INTO v_clients FROM client;
    SELECT COUNT(*) INTO v_appointments FROM appointment;
    SELECT COUNT(*) INTO v_payments FROM payment;
    SELECT COUNT(*) INTO v_reviews FROM review;
    SELECT COUNT(*) INTO v_notifications FROM notification;
    SELECT COUNT(*) INTO v_waitlist FROM wait_list;
    SELECT COUNT(*) INTO v_audit FROM audit_log;
    SELECT COUNT(*) INTO v_schedules FROM barber_schedule;
    SELECT COUNT(*) INTO v_barbershops FROM barbershop;
    SELECT COUNT(*) INTO v_cancel_rules FROM cancellation_rule;
    SELECT COALESCE(SUM(final_amount), 0) INTO v_jan_revenue FROM payment WHERE status = 'COMPLETED' AND payment_date >= '2026-01-01' AND payment_date < '2026-02-01';
    SELECT COALESCE(SUM(final_amount), 0) INTO v_feb_revenue FROM payment WHERE status = 'COMPLETED' AND payment_date >= '2026-02-01' AND payment_date < '2026-03-01';

    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '  SEEDER COMPLETO EXECUTADO COM SUCESSO!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Dados inseridos:';
    RAISE NOTICE '   Enderecos: %',      v_addresses;
    RAISE NOTICE '   Usuarios: %',       v_users;
    RAISE NOTICE '   Barbeiros: %',      v_barbers;
    RAISE NOTICE '   Secretarias: %',    v_secretaries;
    RAISE NOTICE '   Servicos: %',       v_services;
    RAISE NOTICE '   Produtos: %',       v_products;
    RAISE NOTICE '   Itens estoque: %',  v_stock;
    RAISE NOTICE '   Promocoes: %',      v_sales;
    RAISE NOTICE '   Clientes: %',       v_clients;
    RAISE NOTICE '   Agendamentos: %',   v_appointments;
    RAISE NOTICE '   Pagamentos: %',     v_payments;
    RAISE NOTICE '   Avaliacoes: %',     v_reviews;
    RAISE NOTICE '   Notificacoes: %',   v_notifications;
    RAISE NOTICE '   Lista espera: %',   v_waitlist;
    RAISE NOTICE '   Audit logs: %',     v_audit;
    RAISE NOTICE '   Agenda barbeiros: %', v_schedules;
    RAISE NOTICE '   Barbearias: %',     v_barbershops;
    RAISE NOTICE '   Regras cancel.: %', v_cancel_rules;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Receita Janeiro:   R$ %', v_jan_revenue;
    RAISE NOTICE 'Receita Fevereiro: R$ %', v_feb_revenue;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Credenciais de acesso:';
    RAISE NOTICE '   Admin: admin@gobarber.com / password';
    RAISE NOTICE '   Barbeiro: carlos.barbeiro@gobarber.com / password';
    RAISE NOTICE '   Secretaria: ana.secretaria@gobarber.com / password';
    RAISE NOTICE '   Cliente: ricardo.gomes@email.com / password';
    RAISE NOTICE '   Cliente: fernando.lima@email.com / password';
    RAISE NOTICE '   Cliente: gustavo.alves@email.com / password';
    RAISE NOTICE '==========================================';
END $$;
