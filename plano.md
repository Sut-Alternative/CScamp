# CONTEXTO E OBJETIVO GLOBAL
Você é um Engenheiro de Software Full-Stack Sênior. Sua missão é arquitetar e desenvolver do zero uma plataforma web (SaaS-like) de acompanhamento em tempo real para campeonatos de Counter-Strike 2 (CS2) em rede local (Corujão). 
O sistema receberá dados instantâneos do jogo através de webhooks do sistema oficial de Game State Integration (GSI) da Valve e refletirá essas estatísticas ao vivo no frontend para os usuários.

# DIRETRIZES DE SEGURANÇA E ANTI-BAN (VAC)
O sistema utilizará EXCLUSIVAMENTE o Game State Integration (GSI) oficial da Valve. 
- É estritamente proibido criar qualquer código que injete DLLs, leia a memória do jogo ou simule inputs.
- O GSI é uma ferramenta nativa, legal e aprovada pela Valve para torneios oficiais. Portanto, o risco de banimento (VAC Ban) é ZERO.

# STACK TECNOLÓGICA
- Frontend & Backend: Next.js (App Router) com React.
- Estilização: Tailwind CSS.
- Banco de Dados & Tempo Real: Supabase (PostgreSQL + Realtime Channels) ou Firebase (Firestore).
- Deploy: Vercel.

# ARQUITETURA DO BANCO DE DADOS (ENTIDADES)
Crie o schema relacional contemplando:
1. **Championships (Campeonatos):** `id`, `name`, `status` (pending, active, finished), `created_at`.
2. **Teams (Equipes):** `id`, `championship_id`, `name`, `logo_url`.
3. **Players (Jogadores):** `id`, `team_id`, `name` (Nick), `steam_id` (CRÍTICO: string exata que vem do GSI para cruzar os dados).
4. **Matches (Partidas):** `id`, `championship_id`, `team_a_id`, `team_b_id`, `status`, `map_name`, `team_a_score`, `team_b_score`, `gsi_endpoint_slug` (ex: "partida1").
5. **Match_Stats (Estatísticas em Tempo Real):** `id`, `match_id`, `player_id`, `kills`, `deaths`, `assists`, `headshots`, `hs_percent`, `adr`, `mvps`, `score`.

# REQUISITOS DO BACKEND (API ROUTES / WEBHOOK GSI)
1. Crie uma rota POST em `/api/gsi/[slug_da_partida]`.
2. O payload recebido será o JSON oficial do GSI do CS2 no modo espectador (objeto `allplayers`).
3. Lógica do Webhook:
   - Receber o payload e identificar qual é a partida ativa no banco baseada no `slug_da_partida`.
   - Fazer um map no objeto `allplayers`.
   - Para cada jogador no JSON, extrair o `provider.steamid` e cruzar com a tabela de `Players`.
   - Atualizar a tabela `Match_Stats` com as kills, assists, mortes e headshots (calcular a % de HS = (headshots / kills) * 100).
   - Atualizar a tabela `Matches` com o placar geral (CT x TR).
   - Retornar 200 OK rapidamente para não engalar o fluxo do jogo.

# REQUISITOS DO FRONTEND
1. **Área Pública (Acesso via Link/QR Code):**
   - Tela de listagem de campeonatos ativos.
   - Tela de "Chaveamento" (Brackets).
   - Tela da Partida (Live Scoreboard): Consumir os dados da tabela `Match_Stats` e `Matches` utilizando WebSockets (Supabase Realtime ou Firebase onSnapshot). A tela DEVE atualizar sozinha sem reload. Mostrar K/D/A, HS% e Placar.
2. **Área Admin (Host):**
   - Protegida por senha simples ou autenticação.
   - Botão "Criar Novo Campeonato".
   - Formulário para cadastrar Equipes e adicionar Jogadores (exigindo o SteamID).
   - Painel para iniciar uma Partida, gerando o slug da rota GSI (ex: /api/gsi/corujao-mesa-1).

# MANUAL DO SISTEMA (GERAR NA INTERFACE DO ADMIN)
O agente deve criar uma página estática `/admin/manual` no sistema com as seguintes instruções exatas para o Host e os Espectadores:

## Manual de Operação do Campeonato
**Passo 1: Cadastro (No Celular ou PC do Host)**
(o agente nao deve executar as seguintes açoes e sim inclui-las no manual)
1. Crie o campeonato e cadastre os times.
2. Adicione os jogadores informando o Nick e o SteamID exato de cada um.
3. Crie a partida entre Time A x Time B. O sistema gerará um link GSI exclusivo (Ex: https://seusite.com/api/gsi/mesa1).

**Passo 2: Configurando o PC Espectador**
(o agente nao deve executar as seguintes açoes e sim inclui-las no manual)
1. No notebook que ficará de espectador, crie um arquivo chamado `gamestate_integration_mesa1.cfg`.
2. Cole o seguinte código dentro dele (o sistema deve gerar esse código dinamicamente para o Host copiar):
   "vlo" {
      "uri" "URL_GERADA_PELO_SISTEMA"
      "timeout" "5.0"
      "buffer"  "0.1"
      "throttle" "0.5"
      "heartbeat" "30.0"
      "data" {
         "provider" "1"
         "map" "1"
         "round" "1"
         "player_id" "1"
         "player_match_stats" "1"
         "player_state" "1"
         "player_weapons" "1"
         "allplayers_id" "1"
         "allplayers_match_stats" "1"
         "allplayers_state" "1"
         "allplayers_weapons" "1"
      }
   }
3. Salve o arquivo na pasta: `C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg`.
4. Entre no jogo com uma conta secundária (sem risco de deslogar a principal), conecte na partida como Espectador.
5. Abra o console do jogo e digite `fps_max 30` para o notebook não superaquecer. Deixe o jogo rodando e acompanhe o placar pelo celular!

# EXECUÇÃO DO AGENTE
Por favor, inicie gerando a estrutura de pastas do Next.js, as dependências necessárias e o schema inicial do banco de dados. Confirme quando estiver pronto para iniciarmos a codificação dos componentes.