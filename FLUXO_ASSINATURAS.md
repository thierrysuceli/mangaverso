# Sistema de Autenticação com Assinaturas

## 🎯 Fluxo Completo

### 1. **Cliente Compra Assinatura**
- Cliente acessa seu site/sistema de vendas
- Escolhe plano de assinatura (mensal, anual, etc.)
- Realiza pagamento (Stripe, PayPal, PagSeguro, etc.)

### 2. **Automação Cria Usuário Autenticado**
Quando o pagamento é confirmado, sua automação deve:

```javascript
// Exemplo usando Supabase Admin API
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Chave de admin (backend only)
)

async function createSubscriptionUser(email, subscriptionId, plan) {
  // 1. Gerar senha temporária segura
  const tempPassword = generateSecurePassword() // ex: 'Tmp_' + randomBytes(12)
  
  // 2. Criar usuário autenticado no Supabase
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: tempPassword,
    email_confirm: true, // ✅ Email já confirmado
    user_metadata: {
      subscription_id: subscriptionId,
      subscription_plan: plan,
      subscription_date: new Date().toISOString(),
      source: 'payment_automation'
    }
  })
  
  if (error) {
    console.error('Erro ao criar usuário:', error)
    throw error
  }
  
  // 3. Enviar email com credenciais
  await sendWelcomeEmail(email, tempPassword, {
    login_url: 'https://seuapp.com/login',
    subscription_plan: plan
  })
  
  console.log(`✅ Usuário criado: ${user.id}`)
  return user
}

function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = 'Tmp_'
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
```

### 3. **Cliente Recebe Email de Boas-Vindas**

Template de email:
```
Assunto: Bem-vindo ao MangaVerso! 🎉

Olá!

Sua assinatura Premium foi ativada com sucesso!

📧 Email: cliente@email.com
🔑 Senha temporária: Tmp_x7K9mP2nQ5wL

🔗 Acesse agora: https://seuapp.com/login

⚠️ IMPORTANTE: Ao fazer o primeiro login, você será solicitado a:
- Escolher um nome de usuário único
- Personalizar seu perfil
- Alterar sua senha (recomendado)

Após isso, você terá acesso completo a:
✅ Milhares de mangás
✅ Histórico de leitura
✅ Favoritos ilimitados
✅ Sistema de comentários
✅ E muito mais!

Aproveite sua leitura!
Equipe MangaVerso
```

### 4. **Primeiro Acesso do Cliente**

#### a) Login
- Cliente acessa `/login`
- Insere email e senha temporária
- ✅ Autenticação bem-sucedida

#### b) Redirecionamento Automático
- Sistema detecta que `profile_completed = false`
- Redireciona para `/complete-profile`

#### c) Completar Perfil
Cliente preenche:
- **Username** (obrigatório, único, min 3 caracteres)
- **Nome de Exibição** (opcional)
- **Bio** (opcional, max 200 caracteres)

#### d) Perfil Criado
- Sistema salva perfil no banco
- Marca `profile_completed = true`
- Redireciona para `/` (home)

### 5. **Acesso Total**
Cliente agora tem acesso a todas as funcionalidades:
- Ler mangás
- Favoritar
- Comentar
- Ver histórico
- Editar perfil
- Etc.

---

## 🔧 Configuração Necessária

### 1. Executar Migration 003
```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: supabase/migrations/003_disable_auto_profile_creation.sql

-- Remove trigger automático
-- Adiciona campos profile_completed e email
-- Atualiza políticas RLS
```

### 2. Configurar Service Role Key
No seu backend/automação:
```env
SUPABASE_URL=https://rcyqkooivpcgvonrkgbb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **NUNCA** exponha a Service Role Key no frontend!

### 3. Desabilitar Signup Público
No Supabase Dashboard:
1. **Authentication** → **Settings**
2. **Email Auth**
   - ✅ Enable sign ups: **DESMARCADO** (desabilitado)
3. Save changes

Agora apenas admins podem criar usuários (via Admin API).

---

## 🧪 Testando o Fluxo

### Opção 1: Via Node.js Script

```javascript
// test-create-user.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCreateUser() {
  const testUser = {
    email: 'teste-assinante@example.com',
    password: 'SenhaTemp123!'
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
    user_metadata: {
      subscription_plan: 'premium',
      subscription_id: 'test_sub_123',
      subscription_date: new Date().toISOString()
    }
  })

  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Usuário criado com sucesso!')
    console.log('ID:', data.user.id)
    console.log('Email:', data.user.email)
    console.log('\n🔑 Credenciais de teste:')
    console.log('Email:', testUser.email)
    console.log('Senha:', testUser.password)
    console.log('\n🌐 Faça login em: http://localhost:5173/login')
  }
}

testCreateUser()
```

Execute:
```bash
npm install @supabase/supabase-js dotenv
node test-create-user.js
```

### Opção 2: Via Supabase Dashboard

1. **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Preencha:
   - Email: `teste@example.com`
   - Password: `SenhaTemp123!`
   - ✅ Auto Confirm User: **marcado**
4. **Create user**

### Opção 3: Via SQL (última opção)

```sql
-- Use apenas se as opções acima não funcionarem
-- Veja arquivo: create_subscription_user.sql
```

---

## 🔍 Verificações

### Verificar usuário sem perfil
```sql
SELECT 
  au.email,
  au.email_confirmed_at,
  p.username,
  p.profile_completed
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'teste@example.com';
```

Resultado esperado:
```
email                 | email_confirmed_at | username | profile_completed
----------------------|-------------------|----------|------------------
teste@example.com     | 2025-10-29...     | null     | null
```

### Após completar perfil
```sql
SELECT 
  au.email,
  p.username,
  p.display_name,
  p.profile_completed,
  p.created_at
FROM auth.users au
INNER JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'teste@example.com';
```

Resultado esperado:
```
email             | username  | display_name | profile_completed | created_at
------------------|-----------|--------------|-------------------|-------------------
teste@example.com | joao123   | João Silva   | true             | 2025-10-29...
```

---

## 🚨 Troubleshooting

### Erro: "Email address is invalid"
- ✅ Certifique-se de usar **Service Role Key** (não anon key)
- ✅ Verifique se está usando `admin.createUser()` (não `signUp()`)

### Erro: "Signup is disabled"
- ✅ Correto! Signup público está desabilitado
- ✅ Use apenas Admin API para criar usuários

### Usuário não redireciona para /complete-profile
- ✅ Verifique se migration 003 foi executada
- ✅ Confirme que `profile_completed` está null ou false
- ✅ Verifique console do navegador para erros

### Erro ao criar perfil: "duplicate key value"
- ✅ Username já existe, tente outro
- ✅ Verifique com: `SELECT * FROM profiles WHERE username = 'username_aqui'`

---

## 📊 Dashboard de Controle

### Query útil para admin
```sql
-- Ver todos os assinantes ativos
SELECT 
  au.email,
  au.created_at as subscription_date,
  p.username,
  p.profile_completed,
  p.created_at as profile_created_at,
  COALESCE(f.favorites_count, 0) as total_favorites,
  COALESCE(r.mangas_read, 0) as total_mangas_read
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as favorites_count 
  FROM favorites 
  GROUP BY user_id
) f ON f.user_id = au.id
LEFT JOIN (
  SELECT user_id, COUNT(DISTINCT manga_id) as mangas_read 
  FROM reading_progress 
  GROUP BY user_id
) r ON r.user_id = au.id
ORDER BY au.created_at DESC;
```

---

## ✅ Checklist de Implementação

- [ ] Executar migration 003 no Supabase
- [ ] Desabilitar signup público no dashboard
- [ ] Configurar Service Role Key no backend
- [ ] Implementar função de criação de usuário na automação
- [ ] Configurar template de email de boas-vindas
- [ ] Testar criação de usuário via Admin API
- [ ] Testar login com usuário criado
- [ ] Verificar redirecionamento para /complete-profile
- [ ] Testar preenchimento do perfil
- [ ] Verificar acesso às funcionalidades após completar perfil
- [ ] Documentar processo para equipe
- [ ] Criar queries de monitoramento no Supabase

---

## 🔗 Links Úteis

- [Supabase Admin API Docs](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização**: 29/10/2025
**Versão do sistema**: 2.0 (Com assinaturas)
