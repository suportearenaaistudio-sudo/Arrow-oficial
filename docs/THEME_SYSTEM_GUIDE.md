# Sistema de Temas Arrow — Guia Completo de Implementação

Código-fonte completo + prompt para reimplementar em qualquer projeto React + TypeScript.

> **Arquivos prontos para copiar** estão em `docs/source/`. Basta ajustar seletores e prefixos.

---

## Arquivos do Sistema

| Arquivo | Local no Projeto | Descrição |
|---|---|---|
| `ThemeContext.tsx` | `docs/source/ThemeContext.tsx` | Tipos, paletas, CSS variables, Provider, hook |
| `RainSoundContext.tsx` | `docs/source/RainSoundContext.tsx` | Web Audio API, 3 intensidades, trovão |
| `RainBackground.tsx` | `docs/source/RainBackground.tsx` | Canvas: gotas, raios, splashes nos cards |
| `StarfieldBackground.tsx` | `docs/source/StarfieldBackground.tsx` | SVG: estrelas parallax, twinkle |
| `AppLayout.tsx` | `docs/source/AppLayout.tsx` | Layout com backgrounds condicionais |

---

## Estrutura de Pastas

```
src/
├── contexts/
│   ├── ThemeContext.tsx        ← copie docs/source/ThemeContext.tsx
│   └── RainSoundContext.tsx    ← copie docs/source/RainSoundContext.tsx
├── components/ui/
│   ├── StarfieldBackground.tsx ← copie docs/source/StarfieldBackground.tsx
│   └── RainBackground.tsx     ← copie docs/source/RainBackground.tsx
└── components/layout/
    └── AppLayout.tsx           ← referência em docs/source/AppLayout.tsx
```

---

## Temas Disponíveis

### Temas Escuros (com Starfield)

```tsx
cosmos: {
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#0B0B0B', accent: '#A2FF4C',   // verde neon
  gradientFrom: '#A2FF4C', gradientTo: '#4CFFA2',
},
midnight: {
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#0a0e1a', accent: '#60a5fa',   // azul
  gradientFrom: '#3b82f6', gradientTo: '#8b5cf6',
},
lavender: {
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#0f0a1a', accent: '#a78bfa',   // roxo
  gradientFrom: '#8b5cf6', gradientTo: '#ec4899',
},
sunset: {
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#150a05', accent: '#f59e0b',   // laranja/vermelho
  gradientFrom: '#f59e0b', gradientTo: '#ef4444',
},
monochrome: {
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#080808', accent: '#ffffff',   // branco puro
  gradientFrom: '#e4e4e7', gradientTo: '#a1a1aa',
},
```

### Temas Claros (com Starfield)

```tsx
aurora: {
  isDark: false, hasStarfield: true, hasRain: false,
  bg: '#f8f8fb', accent: '#f97316',   // laranja/azul
  gradientFrom: '#f97316', gradientTo: '#3b82f6',
},
crimson: {
  isDark: false, hasStarfield: true, hasRain: false,
  bg: '#fff5f5', accent: '#FF0000',   // vermelho puro
  gradientFrom: '#FF0000', gradientTo: '#CC0000',
},
ocean: {
  isDark: false, hasStarfield: true, hasRain: false,
  bg: '#f0f7ff', accent: '#0066FF',   // azul puro
  gradientFrom: '#0066FF', gradientTo: '#0044CC',
},
rose: {
  isDark: false, hasStarfield: true, hasRain: false,
  bg: '#fdf2f8', accent: '#ec4899',   // rosa/roxo
  gradientFrom: '#ec4899', gradientTo: '#a855f7',
},
```

### Temas com Chuva

```tsx
rain: {
  isDark: true, hasStarfield: false, hasRain: true, rainDensity: 1.0,
  bg: '#0c1117', accent: '#74b9ff',   // azul frio noturno
},
tempestade: {
  isDark: true, hasStarfield: false, hasRain: true, rainDensity: 1.3,
  bg: '#050505', accent: '#808080',   // monocromático sombrio
},
chuvisco: {
  isDark: false, hasStarfield: false, hasRain: true, rainDensity: 0.3,
  bg: '#faf5ef', accent: '#e67e22',   // claro, pôr do sol, chuvisco leve
},
```

### rainDensity — Referência

| Valor | Gotas | Velocidade | Uso |
|---|---|---|---|
| `0.2` | Poucas | Lenta | Chuvisco muito leve |
| `0.3` | Poucas | Lenta | Chuvisco / chuva fina |
| `0.8` | Médio | Média | Chuva moderada |
| `1.0` | Normal | Normal | Chuva padrão |
| `1.3` | Muitas | Rápida | Tempestade |
| `1.6+` | Densa | Muito rápida | Dilúvio |

---

## Adaptações Necessárias ao Copiar

### 1. Seletor de Cards

No `RainBackground.tsx`, linha onde faz o querySelectorAll:

```tsx
// ORIGINAL (Arrow):
const cards = document.querySelectorAll('.arrow-card');

// MUDE PARA O SEU:
const cards = document.querySelectorAll('.meu-card');
// ou
const cards = document.querySelectorAll('[data-card]');
// ou qualquer seletor que identifique seus cards
```

### 2. Prefixo das CSS Variables

No `ThemeContext.tsx`, função `applyThemeVars`:

```tsx
// ORIGINAL (Arrow):
root.style.setProperty('--arrow-bg', t.bg);
root.style.setProperty('--arrow-accent', t.accent);

// MUDE PARA:
root.style.setProperty('--app-bg', t.bg);
root.style.setProperty('--app-accent', t.accent);
```

### 3. localStorage keys

```tsx
// ThemeContext.tsx
localStorage.getItem('arrow-theme')     → 'meu-app-theme'
localStorage.setItem('arrow-theme', id) → 'meu-app-theme'

// RainSoundContext.tsx
localStorage.getItem('arrow-rain-intensity') → 'meu-app-rain'
```

### 4. Tema padrão

```tsx
// ThemeContext.tsx — ThemeProvider
return (saved && saved in THEMES) ? saved as ThemeId : 'cosmos'; // ← mude aqui
```

---

## Integration no App.tsx

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RainSoundProvider } from '@/contexts/RainSoundContext';

// ORDEM IMPORTA: RainSoundProvider usa useTheme, então deve ficar dentro de ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <RainSoundProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              {/* suas rotas */}
            </Route>
          </Routes>
        </BrowserRouter>
      </RainSoundProvider>
    </ThemeProvider>
  );
}
```

## Integration no Layout

```tsx
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { RainBackground } from '@/components/ui/RainBackground';

function AppLayout() {
  const { theme } = useTheme();

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      {/* Backgrounds ficam em z-0/z-1, conteúdo em z-10 */}
      {theme.hasStarfield && <StarfieldBackground isDark={theme.isDark} />}
      {theme.hasRain && <RainBackground />}

      <Sidebar />

      <div className="relative z-10">
        <TopBar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## UI de Seleção de Temas (Settings)

```tsx
import { useTheme, THEMES, ThemeId } from '@/contexts/ThemeContext';
import { useRainSound, RainIntensity } from '@/contexts/RainSoundContext';

function ThemeSettings() {
  const { theme, themeId, setTheme } = useTheme();
  const { intensity, setIntensity, isPlaying } = useRainSound();

  return (
    <div>
      {/* Grid de temas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {Object.values(THEMES).map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              border: `2px solid ${themeId === t.id ? t.accent : 'transparent'}`,
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {/* Mini preview */}
            <div style={{ background: t.bg, height: 60, position: 'relative' }}>
              <div style={{
                position: 'absolute', bottom: 4, left: 4, right: 4,
                height: 3, borderRadius: 2,
                background: `linear-gradient(90deg, ${t.gradientFrom}, ${t.gradientTo})`
              }} />
            </div>
            <div style={{ padding: '6px 8px', background: t.bgCard }}>
              <span style={{ color: t.textPrimary, fontSize: 11 }}>{t.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Controle de som (só para temas de chuva) */}
      {theme.hasRain && (
        <div style={{ marginTop: 24 }}>
          <h4>Som de Chuva</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['off', 'sutil', 'moderada', 'intensa'] as RainIntensity[]).map(level => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `1px solid ${intensity === level ? theme.accent : theme.border}`,
                  background: intensity === level ? theme.accentLight : theme.bgCard,
                  color: theme.textPrimary,
                  cursor: 'pointer',
                }}
              >
                {level === 'off' ? 'Desligado' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          {isPlaying && <span style={{ color: theme.accent }}>● Reproduzindo...</span>}
        </div>
      )}
    </div>
  );
}
```

---

## CSS Base Necessário

```css
/* Aplique estas classes nos elementos do seu app */

body {
  background: var(--arrow-bg); /* ou --app-bg se mudou o prefixo */
  color: var(--arrow-text-primary);
  transition: background 0.3s ease, color 0.3s ease;
}

/* CRÍTICO: esta classe é detectada pelo RainBackground para splashes */
.arrow-card {
  background: var(--arrow-bg-card);
  border: 1px solid var(--arrow-border);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

.arrow-sidebar {
  background: var(--arrow-bg-sidebar);
}

.arrow-topbar {
  background: var(--arrow-bg-topbar);
}

.arrow-gradient-text {
  background: linear-gradient(135deg, var(--arrow-gradient-from), var(--arrow-gradient-to));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Prompt Completo para IA

Cole este prompt em qualquer IA para reimplementar o sistema do zero:

```
Implemente um sistema de temas dinâmicos com efeitos visuais e sonoros para meu projeto React + TypeScript.

## SISTEMA DE TEMAS

Crie contexts/ThemeContext.tsx com:
- ThemeId union type com todos os temas
- ThemeConfig interface com: id, name, isDark, hasStarfield, hasRain, rainDensity, bg, bgCard, bgSidebar, bgTopbar, textPrimary, textSecondary, textMuted, border, accent, accentLight, gradientFrom, gradientTo
- THEMES: Record<ThemeId, ThemeConfig> com estes temas:
  * CLAROS (hasStarfield: true): aurora (laranja/azul, bg #f8f8fb), crimson (vermelho puro, bg #fff5f5), ocean (azul puro, bg #f0f7ff), rose (rosa/roxo, bg #fdf2f8)
  * ESCUROS (hasStarfield: true): cosmos (verde neon #A2FF4C, bg #0B0B0B), midnight (azul #60a5fa, bg #0a0e1a), sunset (laranja/vermelho, bg #150a05), lavender (roxo, bg #0f0a1a), monochrome (branco, bg #080808)
  * CHUVA (hasRain: true): rain (azul frio, bg #0c1117, density 1.0), tempestade (monocromático sombrio, bg #050505, density 1.3), chuvisco (pôr do sol claro, bg #faf5ef, isDark false, density 0.3)
- Função applyThemeVars que aplica CSS variables no :root (prefixo --arrow-)
- ThemeProvider com useState + useEffect + localStorage
- useTheme hook

## STARFIELD BACKGROUND

Crie components/ui/StarfieldBackground.tsx com:
- Canvas SVG (não WebGL) com 3 camadas paralaxe
- 260 estrelas total (120+90+50) com posições determinísticas via seed RNG
- Estrelas como path SVG de 4 pontas (sparkle shape)
- 4% das estrelas com cor accent (default laranja/lima), 96% brancas/azuladas
- 22% das estrelas com animação CSS twinkle (fade in/out, duração 1.5-5s)
- Parallax no scroll: camada 1 speed 0.06, camada 2 speed 0.13, camada 3 speed 0.22
- rAF polling para detectar scroll em containers internos (main, .overflow-y-auto)
- Props: isDark (boolean) — adapta cores para tema claro/escuro
- position: fixed, z-index 0, pointer-events none

## RAIN BACKGROUND

Crie components/ui/RainBackground.tsx com:
- Canvas 2D (não WebGL) fullscreen fixed, z-index 1, pointer-events none
- Interface Drop: x, y, speed, length, opacity
- Interface Splash: x, y, vx, vy, life, maxLife, size
- Interface Lightning: startTime, duration, intensity, branches[]
- initDrops: count = (w*h/3000) * rainDensity, velocidade e tamanho escalam com density, opacidade 50% menor em isDark=false
- Função generateLightningBranches: 8-16 segmentos com desvio aleatório, 30% chance de ramo lateral
- Loop 60fps com requestAnimationFrame
- GOTAS: windAngle 0.12 (vento), desenha linha de length pixels inclinada
- RAIOS: a cada 6000-15000ms, flash de tela rgba(200,210,255) + fork desenhado com glow/shadowBlur
- TROVÃO: via window.__playThunder (injetado pelo RainSoundContext), delay 200-1400ms, skip se sutil
- SPLASHES NO CHÃO: quando gota sai da tela, 2-4 partículas com vx±1.5, vy -1 a -4, vida 10-25
- SPLASHES NOS CARDS: querySelectorAll('.arrow-card') a cada 500ms, detecta colisão prevY < cardTop <= y, cria 1-2 micro-splashes menores (vx±0.75, vy -0.5 a -2, vida 6-14, tamanho 0.3-0.8)
- Cores: isDark ? 'rgba(160,185,220,alpha)' : 'rgba(80,100,140,alpha)'
- useTheme() para ler rainDensity e isDark

## RAIN SOUND CONTEXT

Crie contexts/RainSoundContext.tsx com:
- RainIntensity type: 'off' | 'sutil' | 'moderada' | 'intensa'
- INTENSITY_CONFIG com 3 níveis de: master gain, rain gain, ambience gain, hiss gain, rainFreq (Hz), ambFreq (Hz)
  * sutil: master 0.12, rainFreq 3500Hz, ambFreq 200Hz (sem trovão)
  * moderada: master 0.30, rainFreq 2500Hz, ambFreq 300Hz
  * intensa: master 0.50, rainFreq 2000Hz, ambFreq 400Hz
- startSound(level): AudioContext, MasterGain com fade-in linearRamp 2s
  * Layer 1 Rain: buffer stereo 4s, BandPass(rainFreq), loop
  * Layer 2 Ambience: buffer stereo 3s, LowPass(ambFreq), loop
  * Layer 3 Hiss: buffer mono 2s, HighPass(5000Hz), loop
- stopSound: linearRamp para 0 em 0.5s, close() após 600ms
- Trovão via window.__playThunder: buffer stereo 4s, envelope = crack (exp(-t*30) para t<0.1s) + rumble (exp(-t*0.8)), LowPass(200Hz)
- setIntensity salva no localStorage
- useEffect: para som se !theme.hasRain ou intensity === 'off'
- useEffect: inicia som se theme.hasRain && intensity !== 'off'

## LAYOUT INTEGRATION

Em AppLayout.tsx:
- Importar StarfieldBackground e RainBackground
- Renderizar condicionalmente: {theme.hasStarfield && <StarfieldBackground isDark={theme.isDark} />}
- Renderizar condicionalmente: {theme.hasRain && <RainBackground />}
- Conteúdo principal com relative z-10

Em App.tsx:
- <ThemeProvider><RainSoundProvider>...<BrowserRouter>

## ADAPTAÇÕES NECESSÁRIAS
- Seletor de cards: .arrow-card → mude para seu seletor
- Prefixo CSS: --arrow- → mude para --seu-app-
- localStorage key: 'arrow-theme' → 'seu-app-theme'
- Tema padrão: 'cosmos' → seu tema preferido
```

---

## Exemplo de Novo Tema Customizado

```tsx
// Adicione em THEMES no ThemeContext.tsx

// Tema escuro com acento verde esmeralda
esmeralda: {
  id: 'esmeralda', name: 'Esmeralda',
  isDark: true, hasStarfield: true, hasRain: false,
  bg: '#061612',
  bgCard: 'rgba(255,255,255,0.04)',
  bgSidebar: 'rgba(255,255,255,0.03)',
  bgTopbar: 'rgba(255,255,255,0.04)',
  textPrimary: '#d1fae5',
  textSecondary: '#6ee7b7',
  textMuted: '#34d399',
  border: 'rgba(52,211,153,0.12)',
  accent: '#10b981',
  accentLight: 'rgba(16,185,129,0.12)',
  gradientFrom: '#10b981',
  gradientTo: '#06b6d4',
},

// Tema de chuva roxo cyberpunk
matrix: {
  id: 'matrix', name: 'Matrix',
  isDark: true, hasStarfield: false, hasRain: true, rainDensity: 1.1,
  bg: '#030a03',
  bgCard: 'rgba(0,255,65,0.03)',
  bgSidebar: 'rgba(0,255,65,0.02)',
  bgTopbar: 'rgba(0,255,65,0.03)',
  textPrimary: '#00ff41',
  textSecondary: '#008f11',
  textMuted: '#005c0b',
  border: 'rgba(0,255,65,0.08)',
  accent: '#00ff41',
  accentLight: 'rgba(0,255,65,0.08)',
  gradientFrom: '#00ff41',
  gradientTo: '#00b300',
},
```

---

## Como o Som é Gerado (Web Audio API)

```
Ruído Branco → Filtro → Gain → MasterGain → Speakers

Rain Layer:
  WhiteNoise × sin-modulation → BandPass(2500Hz, Q=0.3) → Gain(0.5)

Ambience Layer:
  WhiteNoise → LowPass(300Hz) → Gain(0.35)

Hiss Layer:
  WhiteNoise × sin-modulation → HighPass(5000Hz) → Gain(0.2)

Thunder (on lightning):
  WhiteNoise × (crack_envelope + rumble_envelope) → LowPass(200Hz) → Gain
  crack  = exp(-t × 30) para t < 0.1s  ← som agudo inicial
  rumble = exp(-t × 0.8) × rand        ← eco grave prolongado
```

---

## Checklist de Implementação

```
[ ] Instalar dependências: react, lucide-react (opcional para ícones)
[ ] Copiar ThemeContext.tsx de docs/source/
[ ] Copiar RainSoundContext.tsx de docs/source/
[ ] Copiar StarfieldBackground.tsx de docs/source/
[ ] Copiar RainBackground.tsx de docs/source/
[ ] Ajustar seletor .arrow-card para seu seletor
[ ] Ajustar prefixo --arrow- para seu prefixo
[ ] Ajustar chaves localStorage
[ ] Ajustar tema padrão
[ ] Adicionar ThemeProvider + RainSoundProvider no App.tsx
[ ] Adicionar StarfieldBackground e RainBackground no Layout
[ ] Adicionar CSS variables ao index.css
[ ] Adicionar .arrow-card (ou seu seletor) nos cards
[ ] Criar UI de seleção de temas nas Settings
[ ] Criar UI de controle de som nas Settings (só aparece em hasRain)
[ ] Testar troca de tema — deve limpar efeito anterior
[ ] Testar trovão — deve aparecer 0.2-1.4s após o raio visual
[ ] Testar modo sutil — sem trovão
[ ] Verificar performance no DevTools (Target: 60fps estável)
```

---

*Arrow v2.0 — Sistema de Temas | docs/source/ contém os arquivos prontos para copiar*
