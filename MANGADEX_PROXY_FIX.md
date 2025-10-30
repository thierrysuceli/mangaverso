# Fix: MangaDex Image Proxy Implementation

## Problema Identificado

O MangaDex possui políticas anti-fraude rigorosas documentadas em: https://api.mangadex.org/docs/2-limitations/

### Requisitos do MangaDex:

1. **User-Agent obrigatório** - A requisição DEVE ter um User-Agent header real (não pode ser spoofed)
2. **Sem header Via** - Não permite proxies não-transparentes (header Via proibido)
3. **Sem CORS direto** - Não envia respostas CORS para outros websites; DEVE proxiar as requisições
4. **Sem hotlinking** - Serve resposta errada para imagens hotlinked; DEVE proxiar as imagens

## Solução Implementada

### 1. Backend: Novo Endpoint `/api/mangadex-proxy`

**Arquivo**: `api/index.py`

```python
@app.get("/api/mangadex-proxy")
async def mangadex_proxy(url: str = Query(...)):
    """
    Proxy específico para imagens do MangaDex
    Implementa requisitos da documentação oficial
    """
    # Headers conforme documentação
    mangadex_headers = {
        "User-Agent": "MangaVerso/1.0 (https://github.com/thierrysuceli/mangaverso)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Referer": "https://mangadex.org/",
        # NÃO incluir Via header
    }
    
    # Cache de 30 dias (imagens MangaDex são imutáveis)
    # ... código de cache e proxy ...
```

**Características**:
- ✅ User-Agent real e identificável
- ✅ Sem header Via (proxy transparente)
- ✅ Cache de 30 dias para imagens imutáveis
- ✅ Headers CORS corretos
- ✅ Referer apropriado

### 2. Frontend: Atualização do `mangaDexService.js`

**Arquivo**: `src/services/mangaDexService.js`

**Mudanças**:

1. **Nova helper function**:
```javascript
const proxyMangaDexImage = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/256x360?text=No+Cover';
  return `${BACKEND_API_BASE}/mangadex-proxy?url=${encodeURIComponent(imageUrl)}`;
};
```

2. **Funções atualizadas para usar proxy**:
   - ✅ `fetchPopularMangas()` - Covers e hero images proxiadas
   - ✅ `searchMangas()` - Covers e hero images proxiadas
   - ✅ `fetchMangaDetails()` - Cover proxiada
   - ✅ `fetchChapterPages()` - **CRÍTICO** - Todas as páginas proxiadas
   - ✅ `filterMangasByTags()` - Covers e hero images proxiadas

3. **Exemplo de transformação**:
```javascript
// ANTES (hotlink direto - VIOLA políticas)
cover: `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.256.jpg`

// DEPOIS (proxiado - CONFORME políticas)
cover: proxyMangaDexImage(`${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.256.jpg`)
```

## Benefícios

### Performance
- ✅ Cache de 30 dias no backend reduz chamadas ao MangaDex
- ✅ Headers `Cache-Control` otimizados (`immutable`)
- ✅ Compressão automática pelo httpx

### Conformidade
- ✅ Respeita todas as políticas anti-fraude do MangaDex
- ✅ Evita ban de IP/subnet
- ✅ User-Agent identificável para troubleshooting

### Estabilidade
- ✅ Elimina problema de imagens "erradas" servidas pelo anti-fraude
- ✅ Elimina mensagens "leia no original" inseridas pelo MangaDex
- ✅ Funciona tanto em produção (Vercel) quanto local (localhost:8000)

## Deployment

As mudanças foram commitadas e pushed para:
- **Repositório**: https://github.com/thierrysuceli/mangaverso
- **Branch**: main
- **Deploy automático**: Vercel detectará e fará deploy automaticamente

## Testing

### Local (Desenvolvimento)
```bash
# Terminal 1: Backend
cd mangaverso-react
python api/index.py

# Terminal 2: Frontend
npm run dev
```

### Produção (Vercel)
- Deploy automático ao detectar push no GitHub
- Endpoint: https://seu-dominio.vercel.app/api/mangadex-proxy

## Notas Importantes

1. **Bandwidth**: Com cache de 30 dias, o consumo de bandwidth do Vercel será reduzido drasticamente
2. **Latência**: Primeira requisição pode ser lenta (miss de cache), subsequentes serão instantâneas (hit de cache)
3. **User-Agent**: Mantém identificação real do projeto para troubleshooting com MangaDex
4. **Fallback**: Se proxy falhar, placeholder genérico é exibido (não quebra UI)

## Referências

- [MangaDex API Limitations](https://api.mangadex.org/docs/2-limitations/)
- [MangaDex Reading Flow](https://api.mangadex.org/docs/reading-chapter/)
- [httpx Documentation](https://www.python-httpx.org/)
