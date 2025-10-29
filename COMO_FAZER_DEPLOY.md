# 🚀 Guia de Deploy - Mangaverso

## ✅ O que já está pronto:

- ✅ Git inicializado e primeiro commit feito
- ✅ `.gitignore` configurado
- ✅ `vercel.json` criado
- ✅ `.env.example` com exemplo de variáveis
- ✅ Todos os arquivos commitados

---

## 📋 PRÓXIMOS PASSOS (FAÇA VOCÊ):

### 1️⃣ Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `mangaverso-react` (ou outro nome)
3. **NÃO** adicione README, .gitignore ou licença (já temos)
4. Clique em "Create repository"

### 2️⃣ Conectar e Enviar o Código

Copie os comandos que o GitHub mostrar e execute no terminal:

```powershell
cd "c:\Users\silva\OneDrive\Área de Trabalho\APImanga\mangaverso-react"

# Adicione o remote (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/mangaverso-react.git

# Renomeie a branch para main
git branch -M main

# Envie o código
git push -u origin main
```

**IMPORTANTE**: O GitHub vai pedir suas credenciais. Use um **Personal Access Token** como senha.

#### Como criar um Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Selecione: `repo` (full control)
4. Copie o token e use como senha

---

### 3️⃣ Deploy na Vercel

1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em **"Add New"** → **"Project"**
4. Selecione o repositório `mangaverso-react`
5. Configure:

   **Framework Preset**: Vite
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`

6. **Environment Variables** (MUITO IMPORTANTE):
   
   Clique em "Add Environment Variable" e adicione:
   
   ```
   Name: VITE_SUPABASE_URL
   Value: https://rcyqkooivpcgvonrkgbb.supabase.co
   ```
   
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [sua chave anon do Supabase]
   ```
   
   ⚠️ **Onde pegar as chaves do Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto
   - Settings → API
   - Copie "Project URL" e "anon public"

7. Clique em **"Deploy"**

---

### 4️⃣ Configurar Supabase para aceitar a URL da Vercel

Depois que o deploy terminar:

1. Copie a URL do seu site (ex: `https://mangaverso-react.vercel.app`)
2. Acesse o Supabase: https://supabase.com/dashboard
3. Settings → Authentication → URL Configuration
4. Adicione em **"Site URL"**: `https://mangaverso-react.vercel.app`
5. Adicione em **"Redirect URLs"**: `https://mangaverso-react.vercel.app/**`

---

## ⚠️ IMPORTANTE: API Python (LerManga)

A API Python (localhost:8000) **NÃO VAI FUNCIONAR** em produção porque ela roda localmente.

### Opções:

**Opção 1 - Deploy da API Python (Recomendado)**

Hospede a API Python em:
- Railway: https://railway.app (gratuito)
- Render: https://render.com (gratuito)
- Fly.io: https://fly.io (gratuito)

Depois, atualize o `lerMangaService.js`:

```javascript
const LERMANGA_API_BASE = 'https://sua-api-python.railway.app';
```

**Opção 2 - Apenas MangaDex**

O site vai funcionar normalmente, mas apenas com mangás do MangaDex. Os mangás da LerManga não vão aparecer.

---

## 🎉 Pronto!

Seu site estará no ar em:
- **Production**: `https://seu-projeto.vercel.app`
- **Domínio customizado**: Configure nas settings da Vercel

### Para atualizar o site depois:

```powershell
cd "c:\Users\silva\OneDrive\Área de Trabalho\APImanga\mangaverso-react"
git add .
git commit -m "Sua mensagem"
git push
```

A Vercel vai fazer o deploy automaticamente! 🚀
