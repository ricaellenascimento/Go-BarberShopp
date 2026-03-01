# Roteiro de Testes — GoBarber

> **Data:** 21/02/2026  
> **Ambiente:** Docker Compose (gobarber-db, gobarber-api:8082, gobarber-frontend:3000)  
> **Senha padrão de todos os usuários seed:** `password`

---

## Sumário

1. [Pré-condições](#1-pré-condições)
2. [Perfil ADMIN](#2-perfil-admin)
3. [Perfil SECRETARY (Secretária)](#3-perfil-secretary-secretária)
4. [Perfil BARBER (Barbeiro)](#4-perfil-barber-barbeiro)
5. [Perfil CLIENT (Cliente)](#5-perfil-client-cliente)
6. [Fluxos Públicos (sem autenticação)](#6-fluxos-públicos-sem-autenticação)
7. [Testes de Integração Cross-Perfil](#7-testes-de-integração-cross-perfil)
8. [Checklist de Regressão](#8-checklist-de-regressão)

---

## 1. Pré-condições

### 1.1 Ambiente

| Componente | Endereço | Status esperado |
|------------|----------|-----------------|
| PostgreSQL | `localhost:5432` | Container `gobarber-db` healthy |
| API Spring Boot | `http://localhost:8082` | Container `gobarber-api` healthy |
| Frontend Next.js | `http://localhost:3000` | Container `gobarber-frontend` up |

### 1.2 Credenciais de Teste (Seed Data)

| Perfil | Email | Senha | Nome |
|--------|-------|-------|------|
| **ADMIN** | `admin@gobarber.com` | `password` | Administrador |
| **BARBER** | `carlos.barbeiro@gobarber.com` | `password` | Carlos Silva |
| **BARBER** | `joao.barbeiro@gobarber.com` | `password` | João Santos |
| **BARBER** | `pedro.barbeiro@gobarber.com` | `password` | Pedro Oliveira |
| **BARBER** | `lucas.barbeiro@gobarber.com` | `password` | Lucas Ferreira |
| **SECRETARY** | `ana.secretaria@gobarber.com` | `password` | Ana Costa |
| **SECRETARY** | `maria.secretaria@gobarber.com` | `password` | Maria Souza |
| **CLIENT** | `ricardo.gomes@email.com` | `password` | Ricardo Gomes |
| **CLIENT** | `fernando.lima@email.com` | `password` | Fernando Lima |
| **CLIENT** | `gustavo.alves@email.com` | `password` | Gustavo Alves |

### 1.3 Serviços Cadastrados (Seed)

| ID | Serviço | Preço | Duração |
|----|---------|-------|---------|
| 1 | Corte Masculino | R$ 35,00 | 30 min |
| 2 | Corte Degradê | R$ 45,00 | 45 min |
| 3 | Barba Completa | R$ 30,00 | 30 min |
| 4 | Corte + Barba | R$ 55,00 | 1h |
| 5 | Pigmentação | R$ 80,00 | 1h30 |
| 6 | Sobrancelha | R$ 15,00 | 15 min |
| 7 | Hidratação Capilar | R$ 40,00 | 30 min |
| 8 | Relaxamento | R$ 60,00 | 1h |
| 9 | Platinado | R$ 120,00 | 2h |
| 10 | Corte Infantil | R$ 25,00 | 20 min |
| 11 | Nevou | R$ 50,00 | 45 min |
| 12 | Luzes | R$ 100,00 | 1h30 |

---

## 2. Perfil ADMIN

**Login:** `admin@gobarber.com` / `password`  
**Acesso:** Total a todas as funcionalidades do sistema.

### 2.1 Autenticação

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-01 | Login com credenciais válidas | 1. Acessar `http://localhost:3000/login` 2. Informar email e senha do admin 3. Clicar em "Entrar" | Redireciona para `/dashboard`. Token JWT armazenado. | ☑ |
| A-02 | Login com senha incorreta | 1. Informar email correto e senha errada 2. Clicar em "Entrar" | Mensagem de erro "Credenciais inválidas" ou similar. Não redireciona. | ☑ |
| A-03 | Logout | 1. Estando logado, clicar em "Sair" | Redireciona para `/login`. Token removido. | ☑ |

### 2.2 Dashboard (`/dashboard`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-04 | Visualizar dashboard geral | 1. Acessar `/dashboard` | Exibe KPIs: receita, agendamentos, clientes ativos. Gráficos carregados. | ☐ |
| A-05 | Dashboard diário | 1. Acessar dashboard 2. Selecionar período "Hoje" | Mostra dados do dia atual: agendamentos de hoje, receita do dia. | ☐ |
| A-06 | Dashboard semanal | 1. Selecionar período "Semana" | Mostra dados da semana corrente. | ☐ |
| A-07 | Dashboard mensal | 1. Selecionar período "Mês" | Mostra dados do mês corrente. | ☐ |
| A-08 | Dashboard anual | 1. Selecionar período "Ano" | Mostra dados anuais com gráficos de tendência. | ☐ |
| A-98 | Relatório financeiro | 1. Endpoint `GET /dashboard/financial` | Retorna resumo financeiro: receita, despesas, lucro. | ☐ |
| A-99 | Estatísticas de clientes | 1. Endpoint `GET /dashboard/clients` | Retorna métricas de clientes: novos, retidos, perdidos. | ☐ |
| A-100 | Estatísticas de barbeiros | 1. Endpoint `GET /dashboard/barbers` 2. `GET /dashboard/barbers-status` | Retorna dados de barbeiros e status atual (disponível/ocupado). | ☐ |
| A-101 | Relatório de serviços | 1. Endpoint `GET /dashboard/services-report` | Retorna serviços mais populares e receita por serviço. | ☐ |
| A-102 | Agendamentos de hoje | 1. Endpoint `GET /dashboard/appointments-today` | Retorna lista de agendamentos do dia atual. | ☐ |
| A-103 | Receita em tempo real | 1. Endpoint `GET /dashboard/revenue-realtime` | Retorna receita acumulada do dia em tempo real. | ☐ |
| A-104 | Tendências (receita, agendamentos, clientes) | 1. `GET /dashboard/trend/revenue` 2. `GET /dashboard/trend/appointments` 3. `GET /dashboard/trend/clients` | Retorna dados de tendência para gráficos de linha. | ☐ |
| A-105 | KPIs gerais e por barbeiro | 1. `GET /dashboard/kpis` 2. `GET /dashboard/barber/{barberId}/kpis` | Retorna indicadores-chave de desempenho geral e por barbeiro. | ☐ |
| A-106 | Comparação geral de períodos | 1. Endpoint `GET /dashboard/compare` | Retorna comparação de métricas entre dois períodos. | ☐ |

### 2.3 Barbeiros (`/barbeiros`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-09 | Listar barbeiros | 1. Acessar `/barbeiros` | Lista os 4 barbeiros do seed com nome, email e serviços. | ☐ |
| A-10 | Cadastrar barbeiro (sem foto) | 1. Clicar em "Novo Barbeiro" 2. Preencher nome, email, telefone, CPF, salário, carga horária 3. Selecionar serviços 4. Salvar | Barbeiro criado. Aparece na lista. Mensagem de sucesso. | ☐ |
| A-11 | Cadastrar barbeiro (com foto) | 1. Clicar em "Novo Barbeiro" 2. Preencher dados + upload de foto 3. Salvar | Barbeiro criado com foto exibida no perfil. | ☐ |
| A-12 | Editar barbeiro | 1. Listar barbeiros 2. Clicar em editar no barbeiro "Carlos Silva" 3. Alterar salário 4. Salvar | Dados atualizados. Mensagem de sucesso. | ☐ |
| A-13 | Adicionar serviço ao barbeiro | 1. Editar barbeiro 2. Adicionar serviço "Luzes" à lista de serviços 3. Salvar | Serviço adicionado ao barbeiro. | ☐ |
| A-14 | Remover serviço do barbeiro | 1. Editar barbeiro 2. Remover serviço "Sobrancelha" 3. Salvar | Serviço removido. Barbeiro não oferece mais esse serviço. | ☐ |
| A-15 | Excluir barbeiro | 1. Clicar em excluir barbeiro 2. Confirmar exclusão | Barbeiro removido da lista. | ☐ |
| A-107 | Ver foto de perfil do barbeiro | 1. Endpoint `GET /barber/{id}/profile-photo` | Retorna a imagem de perfil do barbeiro ou 404 se não tem. | ☐ |

### 2.4 Secretárias (`/secretarias`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-16 | Listar secretárias | 1. Acessar `/secretarias` | Lista as 2 secretárias do seed. | ☐ |
| A-17 | Cadastrar secretária | 1. Clicar em "Nova Secretária" 2. Preencher nome, email, telefone, CPF, salário (ex: 3500.00), carga horária (ex: 44) 3. Salvar | Secretária criada. Salário e carga horária salvos como número. | ☐ |
| A-18 | Editar secretária | 1. Selecionar secretária "Ana Costa" 2. Alterar salário para 3800.00 3. Salvar | Dados atualizados com sucesso. Valor numérico correto. | ☐ |
| A-19 | Excluir secretária | 1. Clicar em excluir 2. Confirmar | Secretária removida. | ☐ |
| A-108 | Ver secretária por ID e perfil logado | 1. `GET /secretary/{id}` (admin) 2. `GET /secretary/logged-secretary` (secretária logada) 3. `GET /secretary/{id}/profile-photo` | Retorna dados, perfil logado e foto da secretária. | ☐ |

### 2.5 Clientes (`/clientes`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-20 | Listar clientes | 1. Acessar `/clientes` | Lista clientes do seed com nome, email, telefone, tier de fidelidade. | ☐ |
| A-21 | Cadastrar cliente (sem foto) | 1. Clicar em "Novo Cliente" 2. Preencher: nome, email, telefone (ex: 81999990099), CPF, data nasc., gênero 3. Salvar | Cliente criado. Telefone salvo apenas dígitos. | ☐ |
| A-22 | Cadastrar cliente com gênero vazio | 1. Novo Cliente 2. Preencher dados mas deixar gênero em branco 3. Salvar | Cliente criado sem erro. Gênero omitido (não envia string vazia). | ☐ |
| A-23 | Cadastrar cliente com endereço | 1. Novo Cliente 2. Preencher dados + endereço completo 3. Salvar | Cliente criado com endereço associado. | ☐ |
| A-24 | Buscar cliente por nome | 1. Na lista de clientes, usar campo de busca 2. Digitar parte do nome | Filtra clientes que correspondem à busca. | ☐ |
| A-25 | Buscar cliente por email | 1. Acessar endpoint `/client/email/{email}` | Retorna dados do cliente correspondente. | ☐ |
| A-26 | Buscar cliente por telefone | 1. Acessar endpoint `/client/phone/{phone}` | Retorna dados do cliente correspondente. | ☐ |
| A-27 | Editar cliente | 1. Selecionar cliente 2. Alterar telefone 3. Salvar | Dados atualizados. Telefone no formato correto. | ☐ |
| A-28 | Excluir cliente | 1. Clicar em excluir 2. Confirmar | Cliente removido da lista. | ☐ |
| A-29 | Adicionar pontos de fidelidade | 1. Selecionar cliente 2. Adicionar pontos de fidelidade | Pontos adicionados. Tier pode ser atualizado. | ☐ |
| A-30 | Ver clientes top spenders | 1. Endpoint `/client/top-spenders` | Lista clientes ordenados por gasto total. | ☐ |
| A-31 | Ver aniversariantes do mês | 1. Endpoint `/client/birthdays/month` | Lista clientes que fazem aniversário no mês corrente. | ☐ |
| A-32 | Ver clientes inativos | 1. Endpoint `/client/inactive-clients` | Lista clientes sem visita recente. | ☐ |
| A-109 | Buscar cliente por CPF | 1. Endpoint `GET /client/cpf/{cpf}` | Retorna dados do cliente correspondente ao CPF. | ☐ |
| A-110 | Gerenciar foto do cliente | 1. `PUT /client/{id}/photo` (upload) 2. `GET /client/{id}/photo` (visualizar) 3. `DELETE /client/{id}/photo` (remover) | Foto enviada, exibida e removida com sucesso. | ☐ |
| A-111 | Resgatar pontos de fidelidade | 1. Selecionar cliente com pontos 2. `POST /client/{id}/loyalty/redeem` com quantidade | Pontos resgatados. Saldo reduzido. | ☐ |
| A-112 | Ver clientes top e VIP | 1. `GET /client/top-clients` 2. `GET /client/vip` | Lista clientes mais frequentes e clientes VIP. | ☐ |
| A-113 | Ver aniversários (çoes) de hoje | 1. Endpoint `GET /client/birthdays/today` | Lista clientes que fazem aniversário hoje. | ☐ |
| A-114 | Ver clientes por tier de fidelidade | 1. Endpoint `GET /client/by-loyalty-tier/GOLD` | Lista clientes do tier GOLD (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND). | ☐ |
| A-115 | Ver desconto de fidelidade | 1. Endpoint `GET /client/{id}/loyalty-discount` | Retorna percentual de desconto baseado no tier do cliente. | ☐ |
| A-116 | Ver clientes para promoções | 1. Endpoint `GET /client/clients-for-promotions` | Lista clientes elegíveis para promoções. | ☐ |
| A-117 | Dashboard de clientes (contagens) | 1. `GET /client/total-clients` 2. `GET /client/active-clients` 3. `GET /client/loyalty-distribution` | Retorna total, ativos e distribuição por tier de fidelidade. | ☐ |

### 2.6 Endereços (`/enderecos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-118 | Listar endereços | 1. Acessar `/enderecos` | Lista endereços cadastrados no sistema. | ☐ |
| A-119 | Criar endereço | 1. Clicar em "Novo Endereço" 2. Preencher rua, número, bairro, cidade, estado, CEP 3. Salvar | Endereço criado com sucesso. | ☐ |
| A-120 | Editar endereço | 1. Selecionar endereço 2. Alterar campos 3. Salvar | Dados atualizados. | ☐ |
| A-121 | Excluir endereço | 1. Clicar em excluir 2. Confirmar | Endereço removido. | ☐ |

### 2.7 Serviços (`/servicos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-33 | Listar serviços | 1. Acessar `/servicos` | Lista os 12 serviços do seed com preço e duração. | ☐ |
| A-34 | Cadastrar serviço | 1. Clicar em "Novo Serviço" 2. Preencher nome, descrição, preço (R$ 70), duração (45 min) 3. Salvar | Serviço criado e visível na lista. | ☐ |
| A-35 | Editar serviço | 1. Editar "Corte Masculino" 2. Alterar preço para R$ 40 3. Salvar | Preço atualizado. | ☐ |
| A-36 | Excluir serviço | 1. Excluir serviço sem barbeiros vinculados 2. Confirmar | Serviço removido. | ☐ |

### 2.8 Produtos e Estoque (`/produtos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-37 | Listar produtos | 1. Acessar `/produtos` | Lista produtos do seed com nome, preço e quantidade em estoque. | ☐ |
| A-38 | Cadastrar produto | 1. Novo Produto 2. Preencher nome, descrição, preço 3. Salvar | Produto criado. | ☐ |
| A-39 | Adicionar estoque | 1. Selecionar produto 2. Adicionar quantidade ao estoque | Quantidade atualizada. | ☐ |
| A-40 | Editar produto | 1. Editar produto 2. Alterar preço 3. Salvar | Dados atualizados. | ☐ |
| A-41 | Excluir produto | 1. Excluir produto 2. Confirmar | Produto removido. | ☐ |
| A-122 | Editar movimentação de estoque | 1. `PUT /stock/{id}` com nova quantidade | Movimentação atualizada. | ☐ |
| A-123 | Excluir movimentação de estoque | 1. `DELETE /stock/{id}` | Movimentação removida. | ☐ |
| A-124 | Consultar estoque por produto | 1. `GET /stock/product/{productId}` | Retorna histór. de movimentações do produto. | ☐ |

### 2.9 Promoções / Cupons (`/promocoes`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-42 | Listar promoções | 1. Acessar `/promocoes` | Lista promoções/cupons existentes. | ☐ |
| A-43 | Criar promoção | 1. Nova Promoção 2. Preencher código, desconto (%), validade 3. Salvar | Promoção criada com código único. | ☐ |
| A-44 | Enviar notificação de promoção | 1. Selecionar promoção 2. Enviar por email | Notificação enviada aos clientes elegíveis. | ☐ |
| A-45 | Editar promoção | 1. Editar promoção existente 2. Alterar desconto 3. Salvar | Desconto atualizado. | ☐ |
| A-46 | Excluir promoção | 1. Excluir promoção 2. Confirmar | Promoção removida. | ☐ |
| A-125 | Ver promoção por ID | 1. Endpoint `GET /sale/{id}` | Retorna dados completos da promoção. | ☐ |
| A-126 | Ver promoções válidas | 1. Endpoint `GET /sale/valid` | Lista promoções dentro do prazo de validade. | ☐ |
| A-127 | Buscar por código de cupom | 1. Endpoint `GET /sale/coupon/{coupon}` | Retorna promoção correspondente ao código ou 404. | ☐ |

### 2.10 Agendamentos (`/agendamentos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-47 | Listar agendamentos | 1. Acessar `/agendamentos` | Lista todos os agendamentos com status, barbeiro, cliente, serviço. | ☐ |
| A-48 | Criar agendamento | 1. Novo Agendamento 2. Selecionar barbeiro, cliente, serviço, data/hora 3. Salvar | Agendamento criado com status CONFIRMED ou PENDING. | ☐ |
| A-49 | Aprovar agendamento pendente | 1. Encontrar agendamento PENDING 2. Clicar em Aprovar | Status muda para CONFIRMED. | ☐ |
| A-50 | Rejeitar agendamento pendente | 1. Encontrar agendamento PENDING 2. Clicar em Rejeitar | Status muda para REJECTED. | ☐ |
| A-51 | Editar agendamento | 1. Selecionar agendamento 2. Alterar horário 3. Salvar | Horário atualizado. | ☐ |
| A-52 | Cancelar/excluir agendamento | 1. Excluir agendamento 2. Confirmar | Agendamento removido ou marcado como cancelado. | ☐ |
| A-53 | Ver agendamentos futuros | 1. Filtrar por agendamentos futuros | Lista apenas agendamentos com data futura. | ☐ |
| A-54 | Ver agendamentos por barbeiro | 1. Filtrar por barbeiro específico | Mostra apenas agendamentos do barbeiro selecionado. | ☐ |
| A-128 | Ver agendamento por ID | 1. Endpoint `GET /appointments/{id}` | Retorna dados completos de um agendamento específico. | ☐ |
| A-129 | Histórico por barbeiro específico | 1. Endpoint `GET /appointments/history/barber` | Retorna histórico de agendamentos de um barbeiro. | ☐ |
| A-130 | Agendamentos futuros por barbeiro | 1. Endpoint `GET /appointments/future/barber` | Retorna agendamentos futuros de um barbeiro específico. | ☐ |

### 2.11 Pagamentos (`/pagamentos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-55 | Listar pagamentos | 1. Acessar `/pagamentos` | Lista pagamentos com valor, método, status. | ☐ |
| A-56 | Criar pagamento | 1. Novo Pagamento 2. Selecionar agendamento, método (PIX/CARD/CASH), valor 3. Salvar | Pagamento criado com status PENDING. | ☐ |
| A-57 | Confirmar pagamento | 1. Selecionar pagamento PENDING 2. Confirmar | Status muda para CONFIRMED. | ☐ |
| A-58 | Cancelar pagamento | 1. Selecionar pagamento 2. Cancelar | Status muda para CANCELLED. | ☐ |
| A-59 | Reembolso total | 1. Selecionar pagamento confirmado 2. Reembolsar | Status muda para REFUNDED. Valor devolvido. | ☐ |
| A-60 | Reembolso parcial | 1. Selecionar pagamento 2. Reembolso parcial com valor 3. Confirmar | Reembolso parcial registrado. | ☐ |
| A-61 | Receita total | 1. Endpoint `/payment/revenue/total` | Retorna valor total de receita. | ☐ |
| A-62 | Receita do dia | 1. Endpoint `/payment/revenue/today` | Retorna receita do dia. | ☐ |
| A-63 | Receita por barbeiro | 1. Endpoint `/payment/barber/{id}/revenue` | Retorna receita do barbeiro específico. | ☐ |
| A-131 | Ver pagamento por ID | 1. Endpoint `GET /payment/{id}` | Retorna dados completos de um pagamento específico. | ☐ |
| A-132 | Código PIX | 1. Criar pagamento com método PIX 2. `GET /payment/{id}/pix-code` | Retorna código PIX copia-e-cola. | ☐ |
| A-133 | QR Code PIX | 1. `GET /payment/{id}/pix-qrcode` | Retorna imagem do QR Code para pagamento PIX. | ☐ |
| A-134 | Filtrar por status | 1. Endpoint `GET /payment/status/CONFIRMED` | Lista pagamentos com status CONFIRMED. | ☐ |
| A-135 | Filtrar por método de pagamento | 1. Endpoint `GET /payment/method/PIX` | Lista pagamentos feitos via PIX. | ☐ |
| A-136 | Filtrar por período | 1. Endpoint `GET /payment/period?start=...&end=...` | Lista pagamentos dentro do período informado. | ☐ |
| A-137 | Pagamentos por agendamento | 1. Endpoint `GET /payment/appointment/{appointmentId}` | Lista pagamentos vinculados ao agendamento. | ☐ |
| A-138 | Pagamentos por cliente | 1. Endpoint `GET /payment/client/{clientId}` | Lista pagamentos de um cliente específico. | ☐ |
| A-139 | Pagamentos por barbeiro | 1. Endpoint `GET /payment/barber/{barberId}` | Lista pagamentos associados ao barbeiro. | ☐ |
| A-140 | Receita mensal e diária | 1. `GET /payment/revenue/month` 2. `GET /payment/revenue/daily` | Retorna receita do mês corrente e evolução diária. | ☐ |
| A-141 | Comissão por barbeiro | 1. Endpoint `GET /payment/barber/{barberId}/commission` | Retorna valor de comissão do barbeiro. | ☐ |
| A-142 | Ticket médio e receita por método | 1. `GET /payment/average-ticket` 2. `GET /payment/revenue/by-method` | Retorna ticket médio e breakdown de receita por forma de pagamento. | ☐ |
| A-143 | Pagamentos pendentes | 1. `GET /payment/pending` 2. `GET /payment/pending/count` 3. `GET /payment/count` | Lista pagamentos pendentes, contagem de pendentes e total. | ☐ |

### 2.12 Avaliações (`/avaliacoes`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-64 | Listar avaliações | 1. Acessar `/avaliacoes` | Lista avaliações com nota, comentário, barbeiro. | ☐ |
| A-65 | Responder avaliação | 1. Selecionar avaliação 2. Escrever resposta 3. Salvar | Resposta visível na avaliação. | ☐ |
| A-66 | Ocultar avaliação | 1. Selecionar avaliação inadequada 2. Ocultar | Avaliação não aparece mais publicamente. | ☐ |
| A-67 | Reexibir avaliação | 1. Selecionar avaliação oculta 2. Reexibir | Avaliação volta a ser visível. | ☐ |
| A-68 | Ver ranking de barbeiros | 1. Endpoint `/review/ranking/barbers` | Lista barbeiros ordenados por nota média. | ☐ |
| A-144 | Ver avaliação por ID | 1. Endpoint `GET /review/{id}` | Retorna dados completos de uma avaliação específica. | ☐ |
| A-145 | Detalhes de avaliações por barbeiro | 1. `GET /review/barber/{id}` (lista) 2. `GET /review/barber/{id}/top` (melhores) 3. `GET /review/barber/{id}/count` (total) 4. `GET /review/barber/{id}/distribution` (distribuição) | Retorna lista, top, contagem e distribuição de notas do barbeiro. | ☐ |
| A-146 | Estatísticas gerais de avaliações | 1. `GET /review/stats/average` 2. `GET /review/stats/recommendation-rate` | Retorna média geral e taxa de recomendação. | ☐ |
| A-147 | Avaliações pendentes de resposta | 1. Endpoint `GET /review/pending-reply` | Lista avaliações que ainda não receberam resposta. | ☐ |

### 2.13 Notificações (`/notificacoes`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-69 | Ver notificações pendentes | 1. Acessar `/notificacoes` | Lista notificações com filtro de status. | ☐ |
| A-70 | Enviar notificação de teste | 1. Endpoint `POST /notification/send-test` | Notificação de teste enviada com sucesso. | ☐ |
| A-71 | Reenviar notificação falhada | 1. Encontrar notificação FAILED 2. Reenviar | Nova tentativa de envio. | ☐ |
| A-72 | Excluir notificação | 1. Excluir notificação 2. Confirmar | Notificação removida. | ☐ |
| A-148 | Notificações do cliente (histórico) | 1. `GET /notification/client/{clientId}` 2. `GET /notification/client/{clientId}/unread` 3. `GET /notification/client/{clientId}/recent` | Retorna todas, não lidas e recentes do cliente. | ☐ |
| A-149 | Notificações falhadas | 1. Endpoint `GET /notification/failed` | Lista notificações que falharam no envio. | ☐ |
| A-150 | Estatísticas de notificações | 1. Endpoint `GET /notification/stats` | Retorna total enviadas, lidas, falhadas, taxa de abertura. | ☐ |
| A-151 | Limpar notificações antigas | 1. Endpoint `DELETE /notification/client/{clientId}/old` | Remove notificações antigas do cliente. | ☐ |

### 2.14 Agenda do Barbeiro (`/agenda-barbeiro`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-73 | Ver agenda de barbeiro | 1. Acessar `/agenda-barbeiro` 2. Selecionar barbeiro | Mostra horários disponíveis e bloqueados. | ☐ |
| A-74 | Bloquear horário | 1. Selecionar barbeiro 2. Bloquear período 3. Salvar | Horário indisponível para agendamentos. | ☐ |
| A-75 | Cadastrar férias | 1. Selecionar barbeiro 2. Registrar período de férias | Barbeiro indisponível no período. | ☐ |
| A-76 | Cadastrar folga | 1. Selecionar barbeiro 2. Registrar dia de folga | Barbeiro indisponível no dia. | ☐ |
| A-77 | Definir pausa para almoço | 1. Selecionar barbeiro 2. Definir horário de almoço | Horário bloqueado para almoço diariamente. | ☐ |
| A-78 | Verificar disponibilidade | 1. Endpoint `/barber-schedule/availability/check` | Retorna se barbeiro está disponível em determinado horário. | ☐ |
| A-152 | Listar férias do barbeiro | 1. Endpoint `GET /barber-schedule/barber/{id}/vacations` | Retorna períodos de férias cadastrados. | ☐ |
| A-153 | Listar horários recorrentes | 1. Endpoint `GET /barber-schedule/barber/{id}/recurring` | Retorna configurações de horário recorrente. | ☐ |
| A-154 | Ver dias de férias | 1. Endpoint `GET /barber-schedule/barber/{id}/vacation-days` | Retorna lista de dias de férias agendados. | ☐ |
| A-155 | Ver slots disponíveis | 1. Endpoint `GET /barber-schedule/availability/slots?barberId=...&date=...` | Retorna horários disponíveis para agendamento. | ☐ |
| A-156 | Ver barbeiros disponíveis | 1. Endpoint `GET /barber-schedule/availability/barbers?date=...&time=...` | Retorna lista de barbeiros disponíveis no horário. | ☐ |
| A-157 | Editar entrada de agenda | 1. `PUT /barber-schedule/{id}` com novos dados | Entrada de agenda atualizada. | ☐ |
| A-158 | Desativar entrada de agenda | 1. `POST /barber-schedule/{id}/deactivate` | Entrada desativada (não deletada). | ☐ |
| A-159 | Excluir entrada de agenda | 1. `DELETE /barber-schedule/{id}` | Entrada removida da agenda. | ☐ |

### 2.15 Barbearias (`/barbearias`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-79 | Listar barbearias | 1. Acessar `/barbearias` | Lista barbearias do seed. | ☐ |
| A-80 | Criar barbearia | 1. Nova Barbearia 2. Preencher nome, slug, descrição, CNPJ, telefone, email, horário 3. Salvar | Barbearia criada. | ☐ |
| A-81 | Editar barbearia | 1. Editar barbearia 2. Alterar horário de funcionamento 3. Salvar | Dados atualizados. | ☐ |
| A-82 | Ativar/desativar barbearia | 1. Toggle status ativo/inativo | Status alterado. Barbearia inativa não aparece para clientes. | ☐ |
| A-83 | Vincular barbeiro à barbearia | 1. Selecionar barbearia 2. Associar barbeiro | Barbeiro vinculado à barbearia. | ☐ |
| A-84 | Desvincular barbeiro | 1. Remover barbeiro da barbearia | Barbeiro desvinculado. | ☐ |
| A-160 | Buscar barbearia por ID | 1. Endpoint `GET /barbershop/{id}` | Retorna dados completos da barbearia. | ☐ |
| A-161 | Buscar barbearias por nome | 1. Endpoint `GET /barbershop/search?name=GoBarber` | Lista barbearias que correspondem à busca. | ☐ |
| A-162 | Ver barbearias do cliente | 1. Endpoint `GET /barbershop/client/{clientId}` | Lista barbearias vinculadas ao cliente. | ☐ |
| A-163 | Vincular cliente à barbearia | 1. `POST /barbershop/{barbershopId}/client/{clientId}` | Cliente associado à barbearia. | ☐ |
| A-164 | Desvincular cliente da barbearia | 1. `DELETE /barbershop/{barbershopId}/client/{clientId}` | Cliente desassociado. | ☐ |
| A-165 | Excluir barbearia | 1. `DELETE /barbershop/{id}` 2. Confirmar | Barbearia removida do sistema. | ☐ |

### 2.16 Regras de Cancelamento (`/cancellation-rules` — API)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-85 | Listar regras de cancelamento | 1. Endpoint `GET /cancellation-rules` | Lista regras existentes. | ☐ |
| A-86 | Criar regra | 1. `POST /cancellation-rules` com antecedência mínima e taxa | Regra criada. | ☐ |
| A-87 | Ativar/desativar regra | 1. `POST /cancellation-rules/{id}/toggle` | Status da regra alterado. | ☐ |
| A-166 | Ver regras ativas | 1. Endpoint `GET /cancellation-rules/active` | Lista apenas regras ativas. | ☐ |
| A-167 | Ver regra por ID | 1. Endpoint `GET /cancellation-rules/{id}` | Retorna dados completos de uma regra de cancelamento. | ☐ |
| A-168 | Editar regra de cancelamento | 1. `PUT /cancellation-rules/{id}` com novos parâmetros | Regra atualizada com sucesso. | ☐ |
| A-169 | Excluir regra de cancelamento | 1. `DELETE /cancellation-rules/{id}` 2. Confirmar | Regra removida. | ☐ |

### 2.17 Lista de Espera (`/lista-espera`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-88 | Listar espera | 1. Acessar `/lista-espera` | Lista clientes em espera por barbeiro/serviço. | ☐ |
| A-89 | Adicionar à espera | 1. Novo registro 2. Selecionar cliente, barbeiro, serviço | Cliente adicionado à lista. | ☐ |
| A-90 | Notificar cliente da espera | 1. Selecionar registro 2. Notificar | Notificação enviada ao cliente. | ☐ |
| A-91 | Converter espera em agendamento | 1. Selecionar registro 2. Converter | Agendamento criado a partir da espera. Registro removido da lista. | ☐ |
| A-92 | Remover da espera | 1. Excluir registro | Registro removido. | ☐ |
| A-170 | Ver entrada por ID | 1. Endpoint `GET /waitlist/{id}` | Retorna dados completos de um registro na lista de espera. | ☐ |
| A-171 | Filtrar por barbeiro | 1. `GET /waitlist/barber/{barberId}` 2. `GET /waitlist/barber/{barberId}/waiting` | Lista registros e aguardando por barbeiro específico. | ☐ |
| A-172 | Filtrar por cliente | 1. Endpoint `GET /waitlist/client/{clientId}` | Lista registros de espera do cliente. | ☐ |
| A-173 | Filtrar por serviço | 1. Endpoint `GET /waitlist/service/{serviceId}` | Lista registros de espera para o serviço. | ☐ |
| A-174 | Alterar prioridade | 1. `PUT /waitlist/{id}/priority` com novo valor | Prioridade do registro atualizada. | ☐ |
| A-175 | Adicionar notas | 1. `PUT /waitlist/{id}/notes` com texto | Notas adicionadas ao registro de espera. | ☐ |
| A-176 | Processar expirados | 1. Endpoint `POST /waitlist/process-expired` | Registros expirados são processados e removidos. | ☐ |
| A-177 | Estatísticas gerais da espera | 1. Endpoint `GET /waitlist/stats` | Retorna estatísticas: total, média de espera, taxa de conversão. | ☐ |
| A-178 | Estatísticas por barbeiro | 1. Endpoint `GET /waitlist/stats/barber/{barberId}` | Retorna estatísticas de espera do barbeiro específico. | ☐ |

### 2.18 Relatórios (`/relatorios`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| A-93 | Relatório financeiro | 1. Acessar `/relatorios` 2. Selecionar "Financeiro" | Exibe receita, despesas, lucro por período. | ☐ |
| A-94 | Relatório de clientes | 1. Selecionar "Clientes" | Exibe métricas de clientes: novos, retidos, perdidos. | ☐ |
| A-95 | Relatório de serviços | 1. Selecionar "Serviços" | Exibe serviços mais populares, receita por serviço. | ☐ |
| A-96 | Comparação mês a mês | 1. Endpoint `/dashboard/compare-mom` | Retorna comparação de métricas entre meses. | ☐ |
| A-97 | Comparação ano a ano | 1. Endpoint `/dashboard/compare-yoy` | Retorna comparação anual. | ☐ |

---

## 3. Perfil SECRETARY (Secretária)

**Login:** `ana.secretaria@gobarber.com` / `password`  
**Acesso:** Clientes, agendamentos, pagamentos, lista de espera, notificações, endereços. Visualização de barbeiros, serviços, produtos e dashboard.

### 3.1 Autenticação

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-01 | Login secretária | 1. Acessar `/login` 2. Informar `ana.secretaria@gobarber.com` / `password` 3. Entrar | Redireciona para `/dashboard`. Menus de secretária visíveis. | ☐ |
| S-02 | Verificar menus visíveis | 1. Verificar sidebar/menu | Deve ver: Dashboard, Clientes, Agendamentos, Pagamentos, Lista de Espera, Notificações. NÃO deve ver: Secretárias, Serviços (CRUD), Promoções, Barbearias, Relatórios. | ☐ |

### 3.2 Dashboard

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-03 | Visualizar dashboard | 1. Acessar `/dashboard` | KPIs e gráficos carregados (visualização, sem edição). | ☐ |

### 3.3 Clientes

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-04 | Listar clientes | 1. Acessar `/clientes` | Lista visível com todos os clientes. | ☐ |
| S-05 | Cadastrar cliente | 1. Novo Cliente 2. Preencher dados 3. Salvar | Cliente criado com sucesso. | ☐ |
| S-06 | Editar cliente | 1. Selecionar cliente 2. Alterar dados 3. Salvar | Dados atualizados. | ☐ |
| S-07 | Excluir cliente | 1. Excluir cliente 2. Confirmar | Cliente removido. | ☐ |
| S-08 | Registrar visita | 1. Selecionar cliente 2. Registrar visita | Visita registrada. Pontos de fidelidade podem ser atualizados. | ☐ |
| S-09 | Definir barbeiro preferido | 1. Selecionar cliente 2. Atribuir barbeiro preferido | Barbeiro preferido salvo. | ☐ |

### 3.4 Agendamentos

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-10 | Listar agendamentos | 1. Acessar `/agendamentos` | Lista todos os agendamentos. | ☐ |
| S-11 | Criar agendamento | 1. Novo Agendamento 2. Selecionar barbeiro, cliente, serviço, data/hora 3. Salvar | Agendamento criado. | ☐ |
| S-12 | Aprovar agendamento | 1. Encontrar agendamento PENDING 2. Aprovar | Status → CONFIRMED. | ☐ |
| S-13 | Rejeitar agendamento | 1. Encontrar agendamento PENDING 2. Rejeitar | Status → REJECTED. | ☐ |
| S-14 | Ver agendamentos pendentes | 1. Endpoint `/appointments/pending` | Lista apenas pendentes. | ☐ |

### 3.5 Pagamentos

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-15 | Listar pagamentos | 1. Acessar `/pagamentos` | Lista pagamentos visível. | ☐ |
| S-16 | Criar pagamento | 1. Novo Pagamento 2. Dados do pagamento 3. Salvar | Pagamento criado. | ☐ |
| S-17 | Confirmar pagamento | 1. Selecionar pagamento PENDING 2. Confirmar | Status → CONFIRMED. | ☐ |
| S-18 | Cancelar pagamento | 1. Selecionar pagamento 2. Cancelar | Status → CANCELLED. | ☐ |

### 3.6 Lista de Espera

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-19 | Ver lista de espera | 1. Acessar `/lista-espera` | Lista registros de espera. | ☐ |
| S-20 | Adicionar à espera | 1. Novo registro 2. Dados do cliente e serviço | Adicionado com sucesso. | ☐ |
| S-21 | Converter em agendamento | 1. Converter registro 2. Confirmar | Agendamento criado. | ☐ |

### 3.7 Notificações

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-22 | Ver notificações | 1. Acessar `/notificacoes` | Lista de notificações visível. | ☐ |
| S-23 | Enviar notificação de teste | 1. Enviar teste | Notificação enviada. | ☐ |

### 3.8 Controle de Acesso (Negativo)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| S-24 | Tentar acessar `/secretarias` | 1. Navegar para `/secretarias` | Acesso negado ou redirecionado. Secretária não pode gerenciar outras secretárias. | ☐ |
| S-25 | Tentar acessar `/servicos` CRUD | 1. Tentar criar serviço via API `POST /services` | Retorna 403 Forbidden. | ☐ |
| S-26 | Tentar acessar `/barbearias` CRUD | 1. Tentar `POST /barbershop` | Retorna 403 Forbidden. | ☐ |
| S-27 | Tentar criar barbeiro | 1. Tentar `POST /barber` | Retorna 403 Forbidden. | ☐ |

---

## 4. Perfil BARBER (Barbeiro)

**Login:** `carlos.barbeiro@gobarber.com` / `password`  
**Acesso:** Agenda própria, visualização de agendamentos/serviços/produtos/dashboard, gerenciar própria agenda (bloqueios/férias).

### 4.1 Autenticação

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-01 | Login barbeiro | 1. Acessar `/login` 2. Informar `carlos.barbeiro@gobarber.com` / `password` 3. Entrar | Redireciona para `/dashboard`. Menus de barbeiro visíveis. | ☐ |
| B-02 | Verificar menus visíveis | 1. Verificar sidebar/menu | Deve ver: Dashboard, Agendamentos, Agenda Barbeiro, Avaliações, Notificações. NÃO deve ver: Clientes (CRUD), Secretárias, Serviços (CRUD), Produtos (CRUD), Pagamentos (CRUD), Promoções, Barbearias, Relatórios. | ☐ |

### 4.2 Dashboard

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-03 | Visualizar dashboard | 1. Acessar `/dashboard` | Dashboard carregado com dados relevantes ao barbeiro. | ☐ |

### 4.3 Minha Agenda (`/agenda-barbeiro`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-04 | Ver minha agenda | 1. Acessar `/agenda-barbeiro` | Mostra agenda pessoal do barbeiro logado. | ☐ |
| B-05 | Bloquear meu horário | 1. Bloquear período na agenda 2. Salvar | Horário bloqueado para o barbeiro logado. | ☐ |
| B-06 | Cadastrar minha folga | 1. Registrar dia de folga | Dia bloqueado na agenda. | ☐ |
| B-07 | Cadastrar minhas férias | 1. Registrar período de férias | Período bloqueado na agenda. | ☐ |
| B-08 | Definir meu almoço | 1. Definir horário de pausa | Horário bloqueado diariamente. | ☐ |

### 4.4 Agendamentos

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-09 | Ver meus agendamentos futuros | 1. Endpoint `/appointments/future/barber/own` | Lista agendamentos futuros do barbeiro logado. | ☐ |
| B-10 | Ver meu histórico | 1. Endpoint `/appointments/history` | Lista agendamentos passados do barbeiro logado. | ☐ |
| B-11 | Ver todos os agendamentos | 1. Acessar `/agendamentos` | Lista todos os agendamentos (visualização). | ☐ |

### 4.5 Perfil do Barbeiro

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-12 | Ver meu perfil | 1. Endpoint `GET /barber/logged-barber` | Retorna dados do barbeiro logado: nome, serviços, etc. | ☐ |
| B-13 | Ver minha foto | 1. Endpoint `GET /barber/logged-barber/picture` | Retorna foto de perfil ou 404 se não tem. | ☐ |

### 4.6 Avaliações

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-14 | Ver minhas avaliações | 1. Acessar `/avaliacoes` | Lista avaliações recebidas pelo barbeiro. | ☐ |
| B-15 | Ver minha média | 1. Endpoint `/review/barber/{myId}/average` | Retorna nota média do barbeiro. | ☐ |

### 4.7 Notificações

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-16 | Ver notificações | 1. Acessar `/notificacoes` | Lista notificações do barbeiro. | ☐ |

### 4.8 Controle de Acesso (Negativo)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| B-17 | Tentar criar barbeiro | 1. `POST /barber` | Retorna 403 Forbidden. | ☐ |
| B-18 | Tentar criar cliente | 1. `POST /client` | Retorna 403 Forbidden. | ☐ |
| B-19 | Tentar criar pagamento | 1. `POST /payment` | Retorna 403 Forbidden. | ☐ |
| B-20 | Tentar solicitar agendamento como cliente | 1. `POST /appointments/request` | Retorna 403 Forbidden (endpoint exclusivo CLIENT). | ☐ |

---

## 5. Perfil CLIENT (Cliente)

**Login:** `ricardo.gomes@email.com` / `password`  
**Acesso:** Solicitar agendamentos, ver/cancelar seus agendamentos, criar avaliações, ver notificações, acessar barbearias e loja.

### 5.1 Auto-Registro (Público)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-01 | Registro público de cliente | 1. Acessar `http://localhost:3000/register` 2. Preencher nome, email, telefone, senha 3. Submeter | Conta criada. Recebe token JWT. Redireciona para área logada. Resposta contém `role: "CLIENT"`. | ☐ |
| C-02 | Registro com email duplicado | 1. Tentar registrar com email já existente | Mensagem de erro: email já cadastrado. Status 409. | ☐ |
| C-03 | Registro com dados inválidos | 1. Tentar registrar sem nome ou email | Erro de validação. Status 400. | ☐ |

### 5.2 Autenticação

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-04 | Login cliente | 1. Acessar `/login` 2. Informar `ricardo.gomes@email.com` / `password` 3. Entrar | Redireciona ao painel do cliente. Menus de cliente visíveis. | ☐ |
| C-05 | Verificar menus visíveis | 1. Verificar sidebar/menu | Deve ver: Meus Agendamentos, Avaliações, Notificações, Loja, Configurações. NÃO deve ver: Dashboard admin, Barbeiros (CRUD), Clientes (CRUD), Secretárias, Serviços (CRUD), Pagamentos (CRUD), etc. | ☐ |

### 5.3 Meus Agendamentos (`/meus-agendamentos`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-06 | Ver meus agendamentos | 1. Acessar `/meus-agendamentos` | Lista agendamentos do cliente logado. | ☐ |
| C-07 | Solicitar agendamento | 1. Solicitar novo agendamento 2. Selecionar barbeiro, serviço, data/hora 3. Confirmar | Agendamento criado com status PENDING. Aguarda aprovação. | ☐ |
| C-08 | Cancelar meu agendamento | 1. Selecionar agendamento existente 2. Cancelar | Agendamento cancelado. Respeita regras de cancelamento (taxa se dentro do prazo). | ☐ |

### 5.4 Agendamento Público (sem login prévio)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-09 | Agendar via página da barbearia | 1. Acessar `http://localhost:3000/b/{slug}/agendar` 2. Selecionar serviço e barbeiro 3. Escolher data/hora | Fluxo de agendamento público funcional. | ☐ |
| C-10 | Cadastro durante agendamento | 1. Na página de agendamento, clicar em "Cadastrar-se" 2. Preencher dados 3. Continuar | Cadastro criado e agendamento pode prosseguir. | ☐ |

### 5.5 Avaliações

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-11 | Criar avaliação | 1. Acessar `/avaliacoes` 2. Avaliar atendimento (nota 1-5 + comentário) 3. Salvar | Avaliação criada. Visível na lista de avaliações do barbeiro. | ☐ |
| C-12 | Ver minhas avaliações | 1. Acessar `/avaliacoes` | Lista avaliações feitas pelo cliente. | ☐ |

### 5.6 Notificações

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-13 | Ver minhas notificações | 1. Acessar `/notificacoes` | Lista notificações do cliente. | ☐ |
| C-14 | Marcar como lida | 1. Clicar em notificação não lida | Notificação marcada como lida. Contador decrementado. | ☐ |
| C-15 | Marcar todas como lidas | 1. Clicar em "Marcar todas como lidas" | Todas notificações marcadas como lidas. | ☐ |
| C-16 | Ver contagem de não lidas | 1. Endpoint `/notification/client/{id}/unread/count` | Retorna número de notificações não lidas. | ☐ |

### 5.7 Loja (`/loja`)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-17 | Ver loja de produtos | 1. Acessar `/loja` | Lista produtos disponíveis com preço e descrição. | ☐ |

### 5.8 Barbearias

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-18 | Ver barbearias ativas | 1. Endpoint `GET /barbershop/active` | Lista barbearias ativas disponíveis. | ☐ |
| C-19 | Ver barbearia por slug | 1. Acessar `http://localhost:3000/b/{slug}` | Página pública da barbearia com info, serviços e barbeiros. | ☐ |

### 5.9 Controle de Acesso (Negativo)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| C-20 | Tentar acessar `/clientes` | 1. Navegar para `/clientes` | Acesso negado ou redirecionado. | ☐ |
| C-21 | Tentar criar barbeiro | 1. `POST /barber` | Retorna 403 Forbidden. | ☐ |
| P-10 | Buscar barbearias na landing page | 1. Acessar `http://localhost:3000` 2. Digitar no campo de busca "GoBarber" 3. Endpoint `GET /public/barbershops/search?name=GoBarber` | Lista barbearias que correspondem à busca exibida na landing page. | ☐ |
| P-11 | Ver barbeiros da barbearia (slug) | 1. Acessar `/b/gobarber-principal` 2. Endpoint `GET /public/barbershops/gobarber-principal/barbers` | Lista barbeiros vinculados à barbearia com serviços e fotos. | ☐ |
| P-12 | Ver detalhe do barbeiro | 1. Na página da barbearia, clicar em um barbeiro 2. Endpoint `GET /public/barbers/{id}` | Modal exibe dados completos do barbeiro: nome, serviços, avaliações. | ☐ |
| P-13 | Ver disponibilidade de horários | 1. Acessar `/b/gobarber-principal/agendar` 2. Selecionar barbeiro e data 3. `GET /public/barbers/{barberId}/availability?date=2026-03-01` | Lista horários disponíveis para agendamento. | ☐ |
| P-14 | Realizar agendamento público | 1. No fluxo de agendamento, selecionar serviço, barbeiro, data/hora 2. `POST /public/booking` com dados 3. Confirmar | Agendamento criado com status PENDING. Mensagem de confirmação exibida. | ☐ |
| C-22 | Tentar acessar dashboard admin | 1. Navegar para `/dashboard` | Acesso negado ou dados limitados. | ☐ |
| C-23 | Tentar aprovar agendamento | 1. `POST /appointments/{id}/approve` | Retorna 403 Forbidden. | ☐ |
| C-24 | Tentar criar pagamento | 1. `POST /payment` | Retorna 403 Forbidden. | ☐ |

---

## 6. Fluxos Públicos (sem autenticação)

| # | Caso de Teste | Passos | Resultado Esperado | Status |
|---|--------------|--------|-------------------|--------|
| P-01 | Página inicial | 1. Acessar `http://localhost:3000` | Landing page carregada. | ☐ |
| P-02 | Página de login | 1. Acessar `/login` | Formulário de login exibido. | ☐ |
| P-03 | Página de registro | 1. Acessar `/register` | Formulário de cadastro de cliente (nome, email, telefone, senha). | ☐ |
| P-04 | Página de agendamento público | 1. Acessar `/agendar` | Fluxo de agendamento público. | ☐ |
| P-05 | Página da barbearia (slug) | 1. Acessar `/b/gobarber-principal` | Página pública com informações da barbearia. | ☐ |
| P-06 | Agendar na barbearia específica | 1. Acessar `/b/gobarber-principal/agendar` | Formulário de agendamento para a barbearia. | ☐ |
| P-07 | Cadastro via barbearia | 1. Acessar `/b/gobarber-principal/cadastro` | Formulário de cadastro do cliente na barbearia. | ☐ |
| P-08 | API sem token — endpoint protegido | 1. `GET /client` sem Authorization header | Retorna 401 Unauthorized. | ☐ |
| P-09 | API pública — registro | 1. `POST /public/register` com dados válidos | Retorna 201 com token e role CLIENT. | ☐ |

---

## 7. Testes de Integração Cross-Perfil

Estes cenários testam fluxos que envolvem múltiplos perfis de usuário.

| # | Cenário | Passos | Resultado Esperado | Status |
|---|---------|--------|-------------------|--------|
| I-01 | Cliente solicita → Secretária aprova | 1. Cliente solicita agendamento (PENDING) 2. Secretária acessa `/agendamentos` 3. Aprova o agendamento | Agendamento muda para CONFIRMED. Notificação enviada ao cliente. | ☐ |
| I-02 | Cliente solicita → Secretária rejeita | 1. Cliente solicita agendamento 2. Secretária rejeita | Agendamento muda para REJECTED. Cliente notificado. | ☐ |
| I-03 | Admin cria barbeiro → Barbeiro faz login | 1. Admin cria novo barbeiro com email/senha 2. Barbeiro faz login com credenciais | Barbeiro logado com sucesso. Vê sua agenda e agendamentos. | ☐ |
| I-04 | Cliente avalia → Admin responde | 1. Cliente cria avaliação (5 estrelas, comentário) 2. Admin responde à avaliação | Avaliação com resposta visível. | ☐ |
| I-05 | Secretária cria pagamento → Confirma | 1. Secretária cria pagamento para agendamento concluído 2. Confirma pagamento | Pagamento CONFIRMED. Receita atualizada no dashboard. | ☐ |
| I-06 | Admin cria promoção → Cliente visualiza | 1. Admin cria promoção/cupom 2. Notificação enviada 3. Cliente vê notificação | Fluxo de promoção completo. | ☐ |
| I-07 | Barbeiro bloqueia horário → Cliente tenta agendar | 1. Barbeiro bloqueia horário 2. Cliente tenta solicitar agendamento no mesmo horário | Sistema impede agendamento no horário bloqueado. | ☐ |
| I-08 | Registro público → Login → Solicitar agendamento | 1. Novo usuário se registra em `/register` 2. Faz login 3. Solicita agendamento em `/meus-agendamentos` | Fluxo completo do cliente desde o registro até o agendamento. | ☐ |

---

## 8. Checklist de Regressão

Verificações rápidas para garantir que as correções recentes não quebraram nada.

### 8.1 Correções Aplicadas

| # | Correção | Verificação | Status |
|---|----------|-------------|--------|
| R-01 | HV000151 — AuthController `@Valid` | Login e registro funcionam sem erro 500 | ☐ |
| R-02 | HV000151 — ClientController `@Valid` | Criar/editar cliente sem erro 500 | ☐ |
| R-03 | HV000151 — PaymentController `@Valid` | Criar pagamento sem erro 500 | ☐ |
| R-04 | HV000151 — SaleController `@Valid` | Criar/editar promoção sem erro 500 | ☐ |
| R-05 | PublicController — Registro público | `POST /public/register` retorna 201 com token | ☐ |
| R-06 | ROLE_CLIENT — Liquibase | Role CLIENT existe no banco. Clientes podem logar. | ☐ |
| R-07 | Barbeiro update — multipart/form-data | Editar barbeiro no frontend não dá erro 415 | ☐ |
| R-08 | Barbeiro remover serviço — query params | Remover serviço do barbeiro funciona (não 400) | ☐ |
| R-09 | Cliente gênero vazio | Criar cliente sem gênero não dá erro de enum | ☐ |
| R-10 | Cliente telefone — strip non-digits | Telefone enviado apenas com dígitos `\d{10,11}` | ☐ |
| R-11 | Secretária salário/carga — tipo numérico | Criar/editar secretária com salário e carga horária funciona | ☐ |
| R-12 | 403 vs 401 — Redirect fix | Acessar endpoint sem permissão retorna 403 (e NÃO redireciona para login). Só 401 redireciona. | ☐ |
| R-13 | Loja acessível para CLIENT | Cliente acessa `/loja` e vê produtos e promoções válidas. | ☐ |
| R-14 | JWT user ID — jti vs sub | Token JWT decodificado: `jti` contém user ID, `sub` contém email. AuthContext usa `jti`. | ☐ |
| R-15 | Dashboard barbeiro — só seus agendamentos | Barbeiro logado vê apenas seus próprios agendamentos no dashboard. | ☐ |
| R-16 | Notificação teste — clientId correto | Enviar notificação de teste usa ID do cliente (não do empregado logado). | ☐ |
| R-17 | Endpoints públicos funcionais | `/public/barbershops/search`, `/public/barbershops/{slug}/barbers`, `/public/barbers/{id}/availability`, `POST /public/booking` retornam dados. | ☐ |
| R-18 | ClientController 501s corrigidos | 11 endpoints (top-spenders, inactive-clients, loyalty-discount, etc.) retornam dados reais, não 501. | ☐ |

### 8.2 Smoke Tests (API via cURL)

```bash
# 1. Login admin
curl -s -X POST http://localhost:8082/auth \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@gobarber.com","password":"password"}'
# Esperado: {"token":"Bearer eyJ..."}

# 2. Registro público de cliente
curl -s -X POST http://localhost:8082/public/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Script","email":"teste.script@email.com","phone":"81999998888","password":"password"}'
# Esperado: 201 com {role, token, name}

# 3. Listar barbeiros (autenticado)
TOKEN=$(curl -s -X POST http://localhost:8082/auth \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@gobarber.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s http://localhost:8082/barber \
  -H "Authorization: $TOKEN"
# Esperado: Lista de barbeiros

# 4. Listar clientes
curl -s http://localhost:8082/client \
  -H "Authorization: $TOKEN"
# Esperado: Lista de clientes

# 5. Listar servicos
curl -s http://localhost:8082/services \
  -H "Authorization: $TOKEN"
# Esperado: Lista de 12 serviços

# 6. Listar pagamentos
curl -s http://localhost:8082/payment \
  -H "Authorization: $TOKEN"
# Esperado: Lista de pagamentos

# 7. Dashboard
curl -s http://localhost:8082/dashboard \
  -H "Authorization: $TOKEN"
# Esperado: Dados do dashboard

# 8. Teste 403 - Barbeiro tentando criar cliente
TOKEN_BARBER=$(curl -s -X POST http://localhost:8082/auth \
  -H "Content-Type: application/json" \
  -d '{"login":"carlos.barbeiro@gobarber.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8082/client/create-without-photo \
  -H "Authorization: $TOKEN_BARBER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nao Deve Criar","email":"x@x.com","phone":"11999990000","cpf":"00000000000"}'
# Esperado: 403

# 9. Teste 401 - Sem token
curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/client
# Esperado: 401

# 10. Buscar barbearias (público)
curl -s "http://localhost:8082/public/barbershops/search?name=GoBarber"
# Esperado: Lista de barbearias

# 11. Ver barbeiros da barbearia por slug (público)
curl -s http://localhost:8082/public/barbershops/gobarber-principal/barbers
# Esperado: Lista de barbeiros da barbearia

# 12. Ver disponibilidade (público)
curl -s "http://localhost:8082/public/barbers/1/availability?date=2026-03-01"
# Esperado: Lista de horários disponíveis

# 13. Dashboard KPIs (autenticado)
curl -s http://localhost:8082/dashboard/kpis \
  -H "Authorization: $TOKEN"
# Esperado: KPIs do sistema

# 14. ClientController (antes 501)
curl -s http://localhost:8082/client/total-clients \
  -H "Authorization: $TOKEN"
# Esperado: Número total de clientes (não 501)
```

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **PENDING** | Agendamento/pagamento aguardando confirmação |
| **CONFIRMED** | Agendamento/pagamento confirmado |
| **REJECTED** | Agendamento rejeitado pela secretária/admin |
| **CANCELLED** | Agendamento/pagamento cancelado |
| **REFUNDED** | Pagamento reembolsado |
| **HV000151** | Erro Hibernate Validator ao redefinir constraints em métodos sobrecarregados |
| **Seed Data** | Dados pré-carregados no banco para testes (`docker/seed-data.sql`) |
| **JWT** | JSON Web Token usado para autenticação da API |
| **Tier** | Nível de fidelidade do cliente (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND) |

---

> **Total de Casos de Teste:** 289  
> - ADMIN: 178 casos (A-01 a A-97 + A-98 a A-178)  
> - SECRETARY: 27 casos (S-01 a S-27)  
> - BARBER: 20 casos (B-01 a B-20)  
> - CLIENT: 24 casos (C-01 a C-24)  
> - Público: 14 casos (P-01 a P-14)  
> - Integração: 8 casos (I-01 a I-08)  
> - Regressão: 18 casos (R-01 a R-18)