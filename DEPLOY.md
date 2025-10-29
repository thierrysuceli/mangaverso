# Mangaverso - Deploy Guide

## 📦 Deploy na Vercel

### Pré-requisitos
- Conta no GitHub
- Conta na Vercel (pode fazer login com GitHub)
- Projeto Supabase configurado

### Passo 1: Preparar o Repositório Git

```bash
# Inicializar git (se ainda não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit - Mangaverso React App"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/seu-usuario/mangaverso-react.git
git branch -M main
git push -u origin main
```

### Passo 2: Configurar Variáveis de Ambiente

No painel da Vercel, configure as seguintes variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### Passo 3: Deploy

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New" → "Project"
3. Importe seu repositório do GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione as variáveis de ambiente
6. Clique em "Deploy"

### Passo 4: Configurar Supabase

No painel do Supabase:

1. **Authentication** → **URL Configuration**
   - Adicione a URL do seu site Vercel em "Site URL"
   - Adicione em "Redirect URLs": `https://seu-app.vercel.app/**`

2. **Database** → **Tables**
   - Certifique-se que todas as tabelas estão criadas:
     - profiles
     - mangas
     - reading_progress
     - favorites
     - comments
     - comment_likes

3. **Storage** (opcional)
   - Configure bucket para avatars se necessário

### Estrutura do Projeto

```
mangaverso-react/
├── public/           # Arquivos estáticos (avatares, favicon)
├── src/
│   ├── components/   # Componentes reutilizáveis
│   ├── pages/        # Páginas da aplicação
│   ├── services/     # Serviços (API, database)
│   ├── store/        # Estado global (Zustand)
│   └── lib/          # Configurações (Supabase)
├── .env.example      # Exemplo de variáveis de ambiente
├── vercel.json       # Configuração da Vercel
└── package.json      # Dependências
```

### APIs Necessárias

- **Supabase**: Autenticação e banco de dados
- **MangaDex API**: API de mangás (não requer chave)
- **LerManga API**: Backend Python local (http://localhost:8000)

⚠️ **Importante**: A API Python (LerManga) roda localmente. Para produção, você precisará hospedar ela separadamente (Railway, Render, etc.)

### Atualizações

Para atualizar o site após mudanças:

```bash
git add .
git commit -m "Sua mensagem de commit"
git push
```

A Vercel vai fazer o deploy automaticamente! 🚀
