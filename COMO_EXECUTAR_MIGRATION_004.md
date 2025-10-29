# Como Executar a Migration 004 - Corrigir Erros 403 e 406

## Passo 1: Acessar Supabase SQL Editor

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto: `rcyqkooivpcgvonrkgbb`
3. No menu lateral, clique em **SQL Editor**

## Passo 2: Executar a Migration

1. Clique em **New Query**
2. Copie TODO o conteúdo do arquivo `supabase/migrations/004_fix_rls_policies.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione Ctrl+Enter)

## Passo 3: Verificar se funcionou

Após executar, você deve ver no final uma tabela mostrando todas as policies criadas:

```
tablename    | policyname                        | cmd    
-------------|-----------------------------------|--------
mangas       | Enable read access for all...     | SELECT
mangas       | Enable insert for authenticated.. | INSERT
mangas       | Enable update for authenticated.. | UPDATE
favorites    | Users can view own favorites      | SELECT
favorites    | Users can add favorites           | INSERT
...
```

## Passo 4: Testar no Site

1. Recarregue a página do site (F5)
2. Tente favoritar um mangá
3. Tente ler um capítulo
4. **NÃO deve mais aparecer erros 403 ou 406**

## O que essa migration faz:

✅ **Corrige erro 403** - Permite usuários autenticados inserir/atualizar dados nas tabelas
✅ **Corrige erro 406** - Policies corretas para SELECT retornam dados corretamente
✅ **Permite favoritos** - Usuários podem adicionar/remover favoritos
✅ **Permite progresso** - Sistema de leitura pode salvar onde o usuário parou
✅ **Segurança mantida** - Usuários só podem modificar seus próprios dados

## Se der algum erro:

**Erro: "policy already exists"**
- Normal! Significa que alguma policy já existia
- A migration usa `DROP POLICY IF EXISTS` para remover antes de criar
- Continue executando até o final

**Erro: "permission denied"**
- Você precisa estar logado como owner/admin do projeto
- Verifique se está na conta correta do Supabase
