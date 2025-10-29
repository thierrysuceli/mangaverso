# 🧪 TESTE DE AUTENTICAÇÃO - PASSO A PASSO

## ✅ CORREÇÕES APLICADAS:

### 1. **REMOVIDO timeout artificial de 3s no getSession**
   - **Antes:** Promise.race com timeout causava rejeição prematura
   - **Agora:** Deixa Supabase trabalhar normalmente (< 100ms)
   
### 2. **REMOVIDO timeout de 5s no initialize**
   - **Antes:** Forçava clear do estado mesmo com operação válida
   - **Agora:** Confia no try-catch natural
   
### 3. **REMOVIDO validação manual de expires_at**
   - **Antes:** Verificava manualmente se token expirou
   - **Agora:** Supabase faz isso automaticamente com autoRefreshToken

### 4. **SIMPLIFICADO initialize**
   - **Antes:** 80+ linhas com validações complexas
   - **Agora:** 40 linhas, simples e direto

---

## 📋 COMO O SUPABASE FUNCIONA (DOCUMENTAÇÃO):

### Storage no localStorage:
```
Chave: sb-rcyqkooivpcgvonrkgbb-auth-token
Valor: {
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": 1234567890,
  "user": {...}
}
```

### getSession() - Comportamento:
1. Lê do localStorage (SÍNCRONO, < 50ms)
2. Se token NÃO expirou → retorna imediatamente
3. Se token expirou E tem refresh_token → renova automaticamente (200-500ms)
4. Se não tem refresh_token → retorna null
5. **NUNCA deveria demorar mais de 1 segundo**

### autoRefreshToken: true (já configurado):
- Supabase monitora expiração automaticamente
- Renova token 60 segundos ANTES de expirar
- Dispara evento SIGNED_IN quando renova
- **Usuário NUNCA é deslogado por expiração**

---

## 🧪 PLANO DE TESTE:

### TESTE 1: Login Fresh
```bash
1. Abra DevTools Console
2. Execute: localStorage.clear()
3. Recarregue (F5)
4. Deve ir para /login
5. Faça login com credenciais válidas
6. Deve redirecionar para / ou /complete-profile
7. Console deve mostrar: "Profile loaded: <username>"
```

**Resultado Esperado:**
- ✅ Login funciona
- ✅ Redirecionamento correto
- ✅ Estado atualizado (isLoggedIn: true)

---

### TESTE 2: Reload com Sessão Ativa
```bash
1. Após login (TESTE 1), recarregue (F5)
2. Deve carregar página em < 1 segundo
3. Deve CONTINUAR logado
4. Console deve mostrar: "Profile loaded: <username>"
5. NÃO deve ir para /login
```

**Resultado Esperado:**
- ✅ Carrega rápido (< 1s)
- ✅ Permanece logado
- ✅ Perfil carregado
- ✅ NÃO desloga

---

### TESTE 3: Fechar e Reabrir Navegador
```bash
1. Após login, FECHE o navegador completamente
2. Reabra o navegador
3. Navegue para http://localhost:5173
4. Deve CONTINUAR logado
5. Deve ir direto para /
```

**Resultado Esperado:**
- ✅ Sessão persistida
- ✅ Não pede login novamente
- ✅ Carrega home diretamente

---

### TESTE 4: Logout Manual
```bash
1. Estando logado, clique em Logout
2. Deve redirecionar para /login
3. localStorage deve estar limpo
4. Execute: localStorage.getItem('sb-rcyqkooivpcgvonrkgbb-auth-token')
5. Deve retornar null
```

**Resultado Esperado:**
- ✅ Logout funciona
- ✅ Redireciona para login
- ✅ Storage limpo

---

### TESTE 5: Token Expirado (Simulação)
```bash
1. Faça login normalmente
2. Abra DevTools Console
3. Execute:
   const key = 'sb-rcyqkooivpcgvonrkgbb-auth-token';
   const data = JSON.parse(localStorage.getItem(key));
   data.expires_at = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
   localStorage.setItem(key, JSON.stringify(data));
4. Recarregue (F5)
5. Supabase deve tentar renovar com refresh_token
6. Se renovar: continua logado
7. Se não renovar: redireciona para /login
```

**Resultado Esperado:**
- ✅ Token renovado automaticamente OU
- ✅ Desloga graciosamente (sem erro)

---

### TESTE 6: Stress Test - Múltiplos Reloads
```bash
1. Faça login
2. Recarregue (F5) 10 vezes seguidas
3. Deve permanecer logado em TODAS
4. Console NÃO deve mostrar erros
5. Tempo de carga: < 1s cada reload
```

**Resultado Esperado:**
- ✅ Permanece logado em todos
- ✅ Sem erros no console
- ✅ Performance consistente

---

## 🔍 DEBUGGING:

### Se AINDA der problema, execute no Console:

```javascript
// 1. Verificar o que está no localStorage
const authKey = 'sb-rcyqkooivpcgvonrkgbb-auth-token';
const authData = localStorage.getItem(authKey);
console.log('Auth Data:', authData ? JSON.parse(authData) : 'VAZIO');

// 2. Testar getSession diretamente
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient(
  'https://rcyqkooivpcgvonrkgbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeXFrb29pdnBjZ3ZvbnJrZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkxNjgsImV4cCI6MjA3NzI2NTE2OH0.a8KfFSnraHHlEF0Pzcx8mX6Sd-6An0QZU1Fww1SKPfk'
);

console.time('getSession');
const { data, error } = await supabase.auth.getSession();
console.timeEnd('getSession');
console.log('Session:', data.session);
console.log('Error:', error);

// 3. Verificar tempo de expiração
if (data.session) {
  const expiresAt = data.session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  console.log(`Token expira em ${Math.floor(remaining / 60)} minutos`);
}
```

---

## ✅ CHECKLIST FINAL:

- [ ] TESTE 1: Login Fresh → PASSOU
- [ ] TESTE 2: Reload com Sessão → PASSOU
- [ ] TESTE 3: Fechar/Reabrir → PASSOU
- [ ] TESTE 4: Logout Manual → PASSOU
- [ ] TESTE 5: Token Expirado → PASSOU
- [ ] TESTE 6: Stress Test → PASSOU

**Se TODOS passarem → Sistema funcionando 100%**
**Se ALGUM falhar → Me envie os logs do console**

---

## 📊 MÉTRICAS ESPERADAS:

- **Tempo de initialize:** < 500ms
- **Tempo de getSession:** < 100ms  
- **Tempo de getProfile:** < 300ms
- **Total carregamento:** < 1 segundo

Se qualquer operação demorar mais de 2 segundos, há um problema de rede ou Supabase.
