# Changelog — Arrow

Todas as alterações notáveis do projeto Arrow estão documentadas neste arquivo.

---

## [alpha-0.5.0] — 2026-05-06

**Commit:** `feat: Arrow alpha 0.5.0 — Auth, Themes, Rain Effects & Full App`

### Autenticação & Perfil
- Implementação completa de **Supabase Auth** (email/senha + Google OAuth)
- Página de autenticação com design **Dark Mode permanente** e **Starfield animado** (estrelas com drift horizontal + acentos laranja)
- Card de login com **glassmorphism** e animações suaves
- Sistema de **perfil de usuário** com sincronização automática com tabela `profiles`
- **AvatarCropper** — componente de corte de imagem com zoom, rotação e centralização antes do upload
- Upload de avatar para **Supabase Storage** (bucket `avatars`, formato WebP 400x400)
- **Proteção de rotas** — redirecionamento automático para `/auth` para usuários não autenticados
- Avatar dinâmico no **TopBar** com fallback para iniciais

### Sistema de Temas (12 temas)
- **4 temas claros:** Aurora Boreal, Vermelho, Oceano, Rose
- **5 temas escuros:** Cosmos, Meia-Noite, Por do Sol, Lavanda, Monocromatico
- **3 temas com efeito de chuva:**
  - **Chuva** — escuro, azul frio, chuva padrão (100% densidade)
  - **Tempestade** — escuro monocromático, sombrio, 130% de densidade de gotas
  - **Chuvisco** — claro, tons de pôr do sol/bege, apenas 30% de gotas (chuvisco leve)
- Remoção dos temas **Menta** e **Floresta**
- Persistência de tema via `localStorage`
- CSS variables dinâmicas aplicadas em tempo real

### Efeito de Chuva (Canvas)
- **Gotas de chuva** com velocidade, comprimento e opacidade variáveis por tema
- **Respingos na base** da tela — partículas com gravidade e fade
- **Respingos nos cards** (`.arrow-card`) — detecção de colisão com bordas superiores, micro-splashes sutis
- **Raios procedurais** a cada 6-15 segundos — ramificações aleatórias, flash na tela, glow azulado
- **Densidade adaptativa** via `rainDensity` no tema
- Cores adaptativas para temas claros e escuros

### Som de Chuva (Web Audio API)
- Som gerado **proceduralmente** (sem arquivos externos)
- **3 camadas de áudio stereo:**
  - Rain patter (frequência média, modulação orgânica)
  - Deep ambience (grave profundo)
  - Surface hiss (agudo suave)
- **3 intensidades configuráveis:** Sutil, Moderada, Intensa
- **Trovão** sincronizado com raios visuais (desativado no modo Sutil)
- Fade in/out suave (2s entrada, 0.5s saída)
- **Controle nas Configurações** com ícones Lucide (VolumeX, Volume, Volume1, Volume2)
- Indicador de reprodução animado (pulsing dot)
- Persistência de intensidade via `localStorage`

### Starfield Background
- **Canvas animado** com estrelas de fundo para temas claros e escuros
- Estrelas com drift horizontal suave
- Acentos em laranja para branding consistente

### Páginas do App
- **Dashboard** — visão geral com cards de resumo
- **Planejamento** — planejamento semanal
- **Ciclos** — gerenciamento de sprints/ciclos
- **Metas** — definição e acompanhamento de metas com página de detalhe
- **Tarefas** — to-do list com prioridades
- **Hábitos** — tracking de hábitos
- **Finanças** — controle financeiro com transações
- **Notas** — editor de notas
- **Análise** — relatórios e insights
- **Configurações** — perfil, temas, som, idioma, exportação, exclusão de conta

### Infraestrutura
- **Supabase** como backend (Auth, Database, Storage)
- **React Query** para gerenciamento de estado assíncrono
- **Framer Motion** para animações
- **Lucide React** para ícones
- Integração com **shadcn/ui** (AlertDialog, Tooltip, Sonner)
- Hooks customizados: `useCycles`, `useTasks`, `useGoals`, `useHabits`, `useNotes`, `useTransactions`, `useDailyCheckin`, `useNotification`
- **RainSoundContext** — contexto global para gerenciamento de som
- **ThemeContext** — contexto global para temas com CSS variables
- **AuthContext** — contexto global para autenticação e perfil
- **SidebarContext** — contexto para sidebar colapsável

### Layout
- **AppSidebar** — navegação lateral colapsável com ícones e labels
- **TopBar** — barra superior com busca, avatar e dropdown de perfil
- **AppLayout** — layout protegido com route guards

---

> Arrow v2.0 — Produtividade com proposito
