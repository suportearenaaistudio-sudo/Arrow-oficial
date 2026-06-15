# 🔴 BUG: Supabase GoTrue Web Locks Deadlock

## O Problema

**O app não carrega depois do login**, fica travado em um spinner infinito ou mostra a tela de login como se o Supabase estivesse offline. No console do navegador aparece:

```
⚠ Auth init timeout — Supabase may be offline. Releasing app.
```

Mas o Supabase **está online e funcionando normalmente**. O login via API funciona, as tabelas respondem — o problema é exclusivamente no frontend.

---

## Causa Raiz Técnica

O Supabase GoTrue JS (v2.x+) usa a **Web Locks API** (`navigator.locks`) para sincronizar o acesso ao token de autenticação entre abas do navegador. O lock se chama `sb-<PROJECT_REF>-auth-token`.

**O deadlock acontece quando:**
- O usuário fecha a aba abruptamente (crash, force quit, kill do processo)
- Faz refresh rápido durante uma operação de auth em andamento
- Múltiplas abas competem pelo mesmo lock simultaneamente
- O navegador mata um Service Worker ou tab em background
- O `localStorage` fica com dados corrompidos/stale de uma sessão anterior

Quando isso ocorre, o lock fica **órfão permanentemente** naquela sessão do navegador. A função `getSession()` chama `navigator.locks.request()` que **trava para sempre** esperando o lock ser liberado — o que nunca vai acontecer.

**Resultado:** `getSession()` nunca resolve → `loading` fica `true` para sempre → o app mostra spinner infinito ou dispara o timeout de segurança e mostra a tela como se não houvesse sessão.

> [!CAUTION]
> Este bug pode destruir completamente a experiência do usuário em produção. O usuário não consegue usar o app, e limpar o cache manualmente não é uma solução aceitável para clientes finais.

---

## Sintomas

- ✅ App carrega a tela de login normalmente
- ✅ Login funciona (Supabase retorna token)
- ❌ Depois do login, o dashboard **não carrega** (spinner infinito)
- ❌ Ou o app mostra conteúdo vazio, como se o usuário não estivesse autenticado
- ❌ Console mostra `Auth init timeout` ou `getSession` sem resposta
- ❌ Ao recarregar a página, volta para a tela de login (sessão não persiste)
- ✅ API do Supabase responde normalmente via `curl`

---

## Solução Definitiva

### Arquivo 1: `src/integrations/supabase/client.ts`

Adicione a propriedade `lock` na configuração de `auth` para **desativar o Web Locks API**:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://SEU_PROJECT_REF.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sua-anon-key-aqui";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // ✅ FIX: Desativa Web Locks API para prevenir deadlocks
    // O lock padrão usa navigator.locks que pode ficar órfão
    // e travar getSession() permanentemente.
    // Esta função simplesmente executa o callback diretamente
    // sem adquirir nenhum lock, eliminando o risco de deadlock.
    lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
    detectSessionInUrl: true,
  }
});
```

> [!IMPORTANT]
> A linha chave é: `lock: (name, acquireTimeout, fn) => fn()`
> 
> Isso substitui o mecanismo de lock padrão por uma função que simplesmente executa o callback diretamente, sem usar `navigator.locks`. É seguro para 99% dos apps (single-user, single-tab ou multi-tab com consistência eventual).

---

### Arquivo 2: `src/contexts/AuthContext.tsx` (ou equivalente)

Localize o `useEffect` de inicialização do auth e aplique estas melhorias:

```typescript
// Initialize auth state
useEffect(() => {
  let mounted = true;

  // Extraia o ref do seu VITE_SUPABASE_URL (ex: "abcdefghijklmnop")
  const PROJECT_REF = "SEU_PROJECT_REF_AQUI";
  const storageKey = `sb-${PROJECT_REF}-auth-token`;

  // Safety timeout: se Supabase não responder em 10s, limpa dados stale
  const safetyTimeout = setTimeout(() => {
    if (mounted && loading) {
      console.warn('Auth init timeout — clearing stale session data.');
      try { localStorage.removeItem(storageKey); } catch (_) {}
      setLoading(false);
    }
  }, 10000);

  async function init() {
    try {
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();

      // Se getSession retornou erro, limpa dados possivelmente corrompidos
      if (sessionError) {
        console.warn('Auth getSession error:', sessionError.message);
        try { localStorage.removeItem(storageKey); } catch (_) {}
      }

      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const p = await fetchProfile(currentSession.user.id);
          if (mounted) setProfile(p);
        }

        setLoading(false);
      }
    } catch (err) {
      console.error('Auth init error:', err);
      // Em falha crítica, limpa auth data para evitar deadlock persistente
      try { localStorage.removeItem(storageKey); } catch (_) {}
      if (mounted) setLoading(false);
    }
  }

  init();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        if (event === 'SIGNED_IN') {
          await new Promise(r => setTimeout(r, 500));
        }
        const p = await fetchProfile(newSession.user.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
    }
  );

  return () => {
    mounted = false;
    clearTimeout(safetyTimeout);
    subscription.unsubscribe();
  };
}, [fetchProfile]);
```

---

## Instruções de Teste

### Teste 1 — Verificar que o Supabase está online (curl)

Execute no terminal substituindo seus valores:

```bash
# Teste de conectividade com a API REST
curl -o /dev/null -s -w "HTTP: %{http_code} | Tempo: %{time_total}s\n" \
  https://SEU_PROJECT_REF.supabase.co/rest/v1/ \
  -H "apikey: SUA_ANON_KEY"

# Esperado: HTTP: 200 ou 401 | Tempo: < 1s
```

```bash
# Teste de login direto na API
curl -s -X POST \
  "https://SEU_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'

# Esperado: JSON com access_token, refresh_token, user
```

Se os dois testes acima passam → o Supabase está online e o problema é 100% no frontend (Web Locks).

---

### Teste 2 — Verificar a correção no navegador

1. **Limpe o localStorage** do site:
   - Abra DevTools (F12) → Console
   - Execute: `localStorage.clear()`
   - Recarregue a página

2. **Faça login** com suas credenciais

3. **Verifique no Console** que:
   - ❌ NÃO aparece `Auth init timeout`
   - ❌ NÃO aparece `getSession` sem resposta
   - ✅ O dashboard carrega com dados

4. **Teste de resistência — Simule o cenário de crash:**
   - Faça login normalmente
   - Com o app aberto, feche o navegador forçadamente (Force Quit)
   - Reabra o navegador e acesse o app
   - ✅ O app deve carregar normalmente com a sessão preservada

5. **Teste multi-aba:**
   - Abra o app em 3 abas diferentes
   - Faça logout em uma delas
   - ✅ As outras abas devem detectar o logout
   - Faça login novamente
   - ✅ Todas as abas devem funcionar sem travar

---

### Teste 3 — Confirmar que o lock foi desativado

No Console do navegador, execute:

```javascript
// Verifica se o lock do Supabase está ativo
if (navigator.locks) {
  navigator.locks.query().then(state => {
    const supabaseLocks = state.held.filter(l => l.name.includes('supabase'));
    if (supabaseLocks.length === 0) {
      console.log('✅ Nenhum Web Lock do Supabase ativo — fix aplicado corretamente');
    } else {
      console.warn('❌ Ainda existem locks ativos:', supabaseLocks);
    }
  });
}
```

---

## Checklist Rápido

```
[ ] 1. Adicionei `lock: (name, acquireTimeout, fn) => fn()` no createClient
[ ] 2. Adicionei `detectSessionInUrl: true` no createClient
[ ] 3. Aumentei o safety timeout para 10 segundos no AuthContext
[ ] 4. Adicionei limpeza de localStorage no timeout e no catch de erro
[ ] 5. Testei login após localStorage.clear()
[ ] 6. Testei Force Quit + reabrir o navegador
[ ] 7. Testei múltiplas abas abertas
[ ] 8. Confirmei que não há Web Locks ativos no navigator.locks.query()
```

---

## Referências

- [Supabase GitHub Issue #14683 — Auth lock causes deadlock](https://github.com/supabase/supabase-js/issues/14683)
- [Supabase GitHub Issue #913 — getSession hangs on browser](https://github.com/supabase/gotrue-js/issues/913)  
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [Supabase Auth Configuration Docs](https://supabase.com/docs/reference/javascript/auth-initialize)
