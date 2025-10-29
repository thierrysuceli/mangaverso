# 📚 Mangaverso - Aplicação React PWA

Aplicação moderna de leitura de mangás desenvolvida com React, Vite e TailwindCSS. Integra tanto a API MangaDex quanto a API LerManga customizada para fornecer uma experiência completa de descoberta e leitura.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **Vite 7** - Build tool e dev server ultra-rápido
- **React Router** - Navegação SPA
- **TanStack Query** - Data fetching e cache
- **Zustand** - State management
- **Tailwind CSS** - Estilização utility-first
- **Lucide React** - Ícones
- **Vite PWA** - Progressive Web App

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── layout/         # Layout components (Header, BottomNav, Layout)
│   └── ui/             # Componentes reutilizáveis (MangaCard, Hero, SearchBar)
├── pages/              # Páginas da aplicação
│   ├── Hub.jsx         # Home com carrosséis
│   ├── MangaDetails.jsx # Detalhes do mangá
│   └── Reader.jsx      # Leitor vertical
├── services/           # Camada de API
│   ├── mangaDexService.js   # API MangaDex
│   ├── lerMangaService.js   # API LerManga (localhost:8000)
│   └── apiAdapter.js        # Abstração de APIs
├── store/              # Zustand stores
│   └── authStore.js    # Estado de autenticação
├── App.jsx             # Router setup
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## 🎨 Design System

### Cores
- **Background**: `#000000` (Preto puro)
- **Surface**: `#1e1e1e` (Cinza escuro)
- **Accent**: `#9d00ff` (Roxo vibrante)
- **Text Primary**: `#f4f4f4` (Branco)
- **Text Secondary**: `#a0a0a0` (Cinza claro)

### Fontes
- **Sans**: Inter (UI geral)
- **Serif**: Playfair Display (Logo)

## 🔌 APIs

### MangaDex API
Usado exclusivamente para a **home** (destaques e carrosséis):
- Popular mangas
- Manga details
- Chapter lists
- Chapter pages

### LerManga API (FastAPI - localhost:8000)
Usado para **busca por texto e filtros**:
- Search by query
- Filter by genres
- Genre list
- Manga details
- Chapter reading

### API Adapter
Camada de abstração que permite trocar entre APIs sem modificar componentes UI.

## 🌐 PWA Features

- ✅ Instalável em dispositivos móveis e desktop
- ✅ Cache de API com Workbox (24h para dados, 7d para imagens)
- ✅ Funciona offline após primeira visita
- ✅ Auto-update do service worker
- ✅ Manifest configurado (ícones 192x192 e 512x512)

## 📱 Responsividade

- Mobile-first design
- Bottom navigation em mobile
- Carrosséis com scroll horizontal
- Grid adaptativo
- Hero section responsivo

## 🎯 Features

- [x] Home com hero e carrosséis
- [x] Busca de mangás (MangaDex + LerManga)
- [x] Detalhes do mangá com lista de capítulos
- [x] Leitor vertical com navegação entre capítulos
- [x] Sistema de autenticação simulado (Zustand)
- [x] PWA instalável
- [x] Cache inteligente de dados
- [ ] Página de busca dedicada
- [ ] Sistema de favoritos
- [ ] Página de perfil

## 🚦 Como Usar

1. **Inicie o backend FastAPI** (se quiser usar a LerManga API):
```bash
# Na pasta raiz do projeto
python main.py
```

2. **Inicie o frontend React**:
```bash
# Na pasta mangaverso-react
npm run dev
```

3. **Acesse**: `http://localhost:5173`

## 📝 Notas de Desenvolvimento

- A aplicação é **API-agnostica** - todos os componentes importam de `apiAdapter.js`
- TanStack Query fornece cache automático (5 min padrão)
- Zustand persiste auth no localStorage
- Tailwind classes customizadas: `carousel-scrollbar-hide`, `reader-page`
- Imagens lazy-loaded por padrão (exceto 3 primeiras páginas do reader)

## 🎨 Baseado em

Design e funcionalidades baseados no protótipo `base.html` com vanilla JavaScript + MangaDex API.

## 📄 Licença

MIT
