# Supabase Database Setup

## Como executar as migrations

### 1. Acesse o Dashboard do Supabase
- Vá para: https://rcyqkooivpcgvonrkgbb.supabase.co
- Faça login no projeto

### 2. Execute as Migrations

#### Migration 001 (Schema Inicial) - JÁ EXECUTADA ✅
1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**
3. Copie todo o conteúdo do arquivo `migrations/001_initial_schema.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)

#### Migration 002 (Comentários em Capítulos) - ⚠️ EXECUTAR AGORA
1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**
3. Copie todo o conteúdo do arquivo `migrations/002_add_chapter_comments.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)

Esta migration adiciona:
- Coluna `chapter_id` na tabela `comments` para comentários em capítulos
- Colunas `chapter_title` e `chapter_number` para melhor UX
- Constraint para garantir que comentário seja de manga OU capítulo (não ambos)
- View `chapter_stats` para estatísticas de comentários por capítulo
- Índices para melhor performance

### 3. Verifique a instalação
Execute esta query para verificar se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver as seguintes tabelas:
- `profiles`
- `mangas`
- `reading_progress`
- `favorites`
- `comments`
- `comment_likes`

## Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `profiles`
Perfis públicos dos usuários (extende auth.users)
- `id` - UUID (referência ao auth.users)
- `username` - Nome de usuário único (3-20 caracteres, alfanumérico)
- `display_name` - Nome de exibição
- `avatar_url` - URL do avatar
- `bio` - Biografia do usuário

#### 2. `mangas`
Catálogo de mangás de ambas as APIs
- `id` - UUID
- `mangadex_id` - ID do MangaDex (único)
- `lermanga_slug` - Slug do LerManga (único)
- `title` - Título do mangá
- `description` - Descrição
- `cover_url` - URL da capa
- `source` - Fonte ('mangadex' ou 'lermanga')

#### 3. `reading_progress`
Progresso de leitura dos usuários
- `user_id` - Referência ao usuário
- `manga_id` - Referência ao mangá
- `last_chapter_id` - ID do último capítulo lido
- `last_chapter_number` - Número do último capítulo
- `last_page` - Última página lida
- `last_read_at` - Data/hora da última leitura

#### 4. `favorites`
Mangás favoritos dos usuários
- `user_id` - Referência ao usuário
- `manga_id` - Referência ao mangá

#### 5. `comments`
Comentários em mangás **e capítulos**
- `user_id` - Autor do comentário
- `manga_id` - Mangá comentado (opcional se for comentário de capítulo)
- `chapter_id` - Capítulo comentado (opcional se for comentário de mangá)
- `chapter_title` - Título do capítulo (para exibição)
- `chapter_number` - Número do capítulo (para ordenação)
- `content` - Texto do comentário (máx 1000 caracteres)
- `parent_id` - ID do comentário pai (para respostas)
- `edited` - Se foi editado

**Nota**: Um comentário deve ter OU `manga_id` OU `chapter_id`, nunca ambos

#### 6. `comment_likes`
Curtidas em comentários
- `user_id` - Usuário que curtiu
- `comment_id` - Comentário curtido

### Views

#### `manga_stats`
Estatísticas de cada mangá (favoritos, comentários)

#### `reading_history`
Histórico de leitura com detalhes dos mangás

#### `chapter_stats`
Estatísticas de cada capítulo (número de comentários, comentadores únicos)

## Row Level Security (RLS)

Todas as tabelas têm RLS ativado com as seguintes políticas:

- **Profiles**: Todos podem ver, apenas dono pode editar
- **Mangas**: Todos podem ver, autenticados podem criar
- **Reading Progress**: Apenas dono pode ver/editar
- **Favorites**: Apenas dono pode ver/editar
- **Comments**: Todos podem ver, autenticados podem criar, apenas dono pode editar/deletar
- **Comment Likes**: Todos podem ver, autenticados podem curtir

## Triggers Automáticos

- **Auto-criação de profile**: Quando um usuário se registra, um perfil é criado automaticamente
- **Updated_at**: Atualiza automaticamente o campo `updated_at` quando há modificações

## Segurança

- Senhas gerenciadas pelo Supabase Auth
- Row Level Security ativado em todas as tabelas
- Validações de dados (constraints)
- Proteção contra SQL injection
