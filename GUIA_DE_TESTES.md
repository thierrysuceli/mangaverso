# 🧪 GUIA DE TESTES - Sistema Completo

## ⚠️ IMPORTANTE: Execute a Migration 002 Primeiro!

Antes de testar, você **PRECISA** executar a nova migration no Supabase:

1. Acesse: https://rcyqkooivpcgvonrkgbb.supabase.co
2. Menu lateral → **SQL Editor**
3. Clique em **+ New query**
4. Copie **TUDO** do arquivo: `supabase/migrations/002_add_chapter_comments.sql`
5. Cole no editor
6. Clique em **Run** (ou Ctrl+Enter)
7. Aguarde mensagem de sucesso

**Sem esta migration, os comentários em capítulos NÃO vão funcionar!**

---

## 🚀 Passo a Passo para Testar

### 1. **Preparação**

```powershell
# Terminal 1: Frontend
cd mangaverso-react
npm run dev
# Acesse: http://localhost:5174
```

Se precisar do backend LerManga (opcional):
```powershell
# Terminal 2: Backend (opcional)
cd ..
python -m uvicorn main:app --reload --port 8000
```

---

### 2. **Autenticação** ✅

#### a) Criar Conta
1. Acesse http://localhost:5174 → Redireciona para `/login`
2. Clique em **"Cadastre-se"**
3. Preencha:
   - **Email**: seu@email.com
   - **Username**: testuser123 (mínimo 3 caracteres)
   - **Nome de exibição**: Seu Nome (opcional)
   - **Senha**: 123456 (mínimo 6 caracteres)
   - **Confirmar senha**: 123456
4. Clique em **"Cadastrar"**
5. ✅ Deve redirecionar para home

#### b) Verificar Header
- ✅ Nome deve aparecer no canto superior direito
- ✅ Clique no nome → deve mostrar menu com "Sair"

---

### 3. **Explorar Mangás** 📚

#### a) Home Page
1. Veja os mangás em carrosséis
2. Clique em um mangá qualquer
3. ✅ Deve abrir página de detalhes

#### b) Detalhes do Mangá
1. Veja cover, título, descrição
2. **Role até os stats** → Procure o botão **❤️ Favoritos**
3. Clique no ❤️
4. ✅ Coração deve ficar preenchido
5. ✅ Contador deve aumentar
6. Clique novamente
7. ✅ Coração deve esvaziar
8. ✅ Contador deve diminuir

---

### 4. **Sistema de Favoritos** ⭐

#### a) Adicionar Favorito
1. Nos detalhes do mangá, clique no ❤️
2. ✅ Feedback visual instantâneo

#### b) Ver Favoritos
1. Navegue para `/favorites` (ícone ❤️ no menu inferior ou URL)
2. ✅ Deve ver grid com o mangá favoritado
3. **Hover no card** → ✅ Botão 🗑️ vermelho aparece
4. Clique no 🗑️
5. Confirme remoção
6. ✅ Card some da lista

#### c) Re-favoritar
1. Volte para detalhes do mangá
2. Clique no ❤️ novamente
3. Volte para `/favorites`
4. ✅ Mangá deve estar lá novamente

---

### 5. **Progresso de Leitura** 📖

#### a) Ler Capítulo
1. Nos detalhes do mangá, clique em **qualquer capítulo**
2. ✅ Leitor vertical abre
3. **Role para baixo** lentamente
4. Veja o contador de página mudando no topo
5. Continue rolando até página 5+
6. ✅ Progresso está sendo salvo automaticamente (a cada 2s)

#### b) Verificar Histórico
1. Navegue para `/history` (URL ou menu)
2. ✅ Deve ver o mangá que você acabou de ler
3. ✅ Deve mostrar: "Capítulo X - Página Y"
4. ✅ Deve mostrar tempo relativo ("Agora mesmo")

#### c) Continuar Leitura
1. Clique em **"Continuar"** no histórico
2. ✅ Deve voltar para a página de detalhes do mangá

---

### 6. **Comentários em Mangás** 💬

#### a) Comentar Mangá
1. Nos detalhes do mangá, **role até o final**
2. Veja seção **"Comentários"**
3. Clique em **"Comentários (0)"** se estiver fechado
4. No campo de texto, escreva:
   ```
   Esse mangá é incrível! Estou adorando a história.
   ```
5. Veja contador de caracteres (X/1000)
6. Clique em **"Comentar"**
7. ✅ Comentário deve aparecer imediatamente
8. ✅ Deve mostrar seu nome/username
9. ✅ Deve mostrar data formatada em português

#### b) Comentar Novamente
1. Adicione outro comentário
2. ✅ Contador deve atualizar para "Comentários (2)"
3. ✅ Comentários em ordem mais recente primeiro

---

### 7. **Comentários em Capítulos** 📝

#### a) Abrir Capítulo
1. Volte para detalhes do mangá
2. Clique em **um capítulo**
3. ✅ Leitor abre

#### b) Comentar Capítulo
1. **Role até o final das páginas**
2. Veja botão **"Comentários (0)"**
3. Clique para expandir
4. No campo de texto, escreva:
   ```
   Esse capítulo foi épico! Que reviravolta!
   ```
5. Clique em **"Comentar"**
6. ✅ Comentário aparece imediatamente
7. ✅ Avatar com inicial do seu nome
8. ✅ Data e hora formatadas

#### c) Comentar Outro Capítulo
1. Navegue para **outro capítulo** (use setas na parte inferior)
2. ✅ Comentários do capítulo anterior NÃO aparecem
3. Adicione novo comentário
4. ✅ Comentário é específico deste capítulo

---

### 8. **Perfil do Usuário** 👤

#### a) Acessar Perfil
1. Navegue para `/profile` (menu ou URL)
2. ✅ Veja avatar com inicial
3. ✅ Veja stats: X Favoritos, Y Mangás Lidos, 0 Comentários

#### b) Editar Perfil
1. Clique em **"Editar"**
2. Altere **Nome de Exibição** para: "Otaku Master"
3. Altere **Biografia** para: "Amante de mangás desde 2010"
4. Clique em **"Salvar Alterações"**
5. ✅ Mensagem de sucesso aparece
6. ✅ Dados atualizados na página
7. ✅ Header também atualiza com novo nome

#### c) Alterar Senha
1. Role até seção **"Alterar Senha"**
2. **Nova senha**: 654321
3. **Confirmar**: 654321
4. Clique em **"Alterar Senha"**
5. ✅ Mensagem de sucesso

#### d) Testar Nova Senha
1. Faça logout (clique no nome → "Sair")
2. Faça login novamente
3. Use email + senha **654321**
4. ✅ Login deve funcionar

---

### 9. **Navegação Completa** 🧭

#### a) Menu Inferior (Mobile)
Se em tela pequena, teste ícones:
- 🏠 **Início** → Home
- 🔍 **Buscar** → Busca
- ❤️ **Favoritos** → Seus favoritos
- 👤 **Perfil** → Seu perfil

#### b) Breadcrumbs
1. Mangá → Reader → Voltar
2. ✅ Navegação funcionando

---

### 10. **Cenários Avançados** 🚀

#### a) Lazy Loading de Mangás
1. Vá para **Search** (URL ou menu)
2. Busque por "Naruto" (ou qualquer termo)
3. Clique em um resultado da **LerManga**
4. Favorite o mangá
5. ✅ Mangá é criado no banco automaticamente
6. Veja no Supabase:
   ```sql
   SELECT * FROM mangas WHERE source = 'lermanga' ORDER BY created_at DESC LIMIT 1;
   ```
7. ✅ Registro existe!

#### b) Múltiplas Fontes
1. Favorite 1 mangá do **MangaDex**
2. Favorite 1 mangá do **LerManga**
3. Vá para `/favorites`
4. ✅ Ambos aparecem
5. ✅ Cada um tem badge da fonte correta

#### c) Progresso Persistente
1. Leia capítulo até página 10
2. Feche o navegador
3. Abra novamente e faça login
4. Vá para `/history`
5. ✅ Progresso salvo (Página 10)

---

## ✅ CHECKLIST COMPLETO

### Autenticação
- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Nome aparece no header
- [ ] Redirecionamento para login quando não logado

### Favoritos
- [ ] Botão ❤️ adiciona favorito
- [ ] Contador aumenta/diminui
- [ ] Página /favorites mostra lista
- [ ] Botão remover funciona
- [ ] Favoritos persistem após refresh

### Progresso
- [ ] Scroll tracking funciona
- [ ] Progresso salvo automaticamente
- [ ] Aparece em /history
- [ ] Data relativa correta
- [ ] Botão continuar funciona

### Comentários - Mangás
- [ ] Form de comentário aparece
- [ ] Contador de caracteres funciona
- [ ] Comentário é adicionado
- [ ] Avatar e nome aparecem
- [ ] Data formatada corretamente
- [ ] Múltiplos comentários funcionam

### Comentários - Capítulos
- [ ] Form no final do reader
- [ ] Comentário específico por capítulo
- [ ] Comentários não aparecem em outros capítulos
- [ ] Avatar e data corretos

### Perfil
- [ ] Stats aparecem (favoritos, lidos)
- [ ] Edição de nome funciona
- [ ] Edição de bio funciona
- [ ] Alteração de senha funciona
- [ ] Validações funcionam
- [ ] Mensagens de sucesso/erro aparecem

### Performance
- [ ] Loading states aparecem
- [ ] Não há erros no console
- [ ] Transições suaves
- [ ] Debouncing funciona

---

## 🐛 Se Algo Não Funcionar

### 1. Comentários em capítulos não aparecem
→ **Executou a Migration 002?** Volte ao topo deste arquivo!

### 2. Favoritos não salvam
→ Verifique console do navegador (F12)
→ Verifique se está logado

### 3. Progresso não salva
→ Aguarde 2 segundos após parar de rolar
→ Verifique console para erros

### 4. Erro "manga_id is null"
→ Migration 002 não foi executada corretamente
→ Re-execute a migration

### 5. Erro "constraint violation"
→ Pode estar tentando comentar sem chapter_id ou manga_id
→ Verifique código

---

## 📊 Queries Úteis para Debug

### Ver todos os mangás no banco
```sql
SELECT id, title, source, created_at 
FROM mangas 
ORDER BY created_at DESC;
```

### Ver todos os favoritos
```sql
SELECT p.username, m.title, f.created_at
FROM favorites f
JOIN profiles p ON p.id = f.user_id
JOIN mangas m ON m.id = f.manga_id
ORDER BY f.created_at DESC;
```

### Ver progresso de leitura
```sql
SELECT p.username, m.title, rp.last_chapter_number, rp.last_page, rp.last_read_at
FROM reading_progress rp
JOIN profiles p ON p.id = rp.user_id
JOIN mangas m ON m.id = rp.manga_id
ORDER BY rp.last_read_at DESC;
```

### Ver comentários (manga vs capítulo)
```sql
SELECT 
  p.username,
  COALESCE(m.title, c.chapter_title) as contexto,
  CASE 
    WHEN c.manga_id IS NOT NULL THEN 'Mangá'
    WHEN c.chapter_id IS NOT NULL THEN 'Capítulo'
  END as tipo,
  c.content,
  c.created_at
FROM comments c
JOIN profiles p ON p.id = c.user_id
LEFT JOIN mangas m ON m.id = c.manga_id
ORDER BY c.created_at DESC;
```

---

**BOA SORTE NOS TESTES! 🚀**

Se tudo funcionar, você tem um sistema completo de:
- ✅ Autenticação
- ✅ Favoritos
- ✅ Progresso de leitura
- ✅ Comentários (mangás + capítulos)
- ✅ Histórico
- ✅ Perfil editável
- ✅ Lazy loading de dados

**É ISSO! 🎉**
