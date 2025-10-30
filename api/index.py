from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response, StreamingResponse
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from cachetools import TTLCache
import asyncio
from pydantic import BaseModel
import re
import base64

# Configuração Vercel: Tempo máximo de execução (5 minutos no plano gratuito)
# Isso permite que requisições pesadas (scraping, proxy) tenham tempo suficiente
maxDuration = 300  # 300 segundos = 5 minutos

app = FastAPI(title="LerMangas API", description="API rápida para scraping de mangás")

# Configurar CORS para o frontend acessar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache com TTL de 5 minutos (300 segundos)
cache = TTLCache(maxsize=100, ttl=300)

# Cache de imagens com TTL de 24 horas (86400 segundos)
image_cache = TTLCache(maxsize=1000, ttl=86400)

# URL base do site
BASE_URL = "https://lermangas.me"

# Lista de User-Agents para rotação (anti-bot)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
]

def get_random_headers():
    """Gera headers com User-Agent aleatório"""
    import random
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": BASE_URL + "/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    }

# Headers padrão (manter compatibilidade)
HEADERS = get_random_headers()

# Modelos de resposta
class MangaCard(BaseModel):
    title: str
    slug: str
    url: str
    cover_image: str
    rating: Optional[float] = None
    latest_chapter: Optional[str] = None
    badges: List[str] = []

class Chapter(BaseModel):
    number: str
    title: Optional[str] = None
    url: str
    release_date: Optional[str] = None

class MangaDetail(BaseModel):
    title: str
    slug: str
    cover_image: str
    rating: Optional[float] = None
    summary: Optional[str] = None
    author: Optional[str] = None
    artist: Optional[str] = None
    status: Optional[str] = None
    genres: List[str] = []
    badges: List[str] = []
    chapters: List[Chapter] = []

class ChapterImages(BaseModel):
    manga_title: str
    chapter_number: str
    images: List[str] = []
    prev_chapter: Optional[str] = None
    next_chapter: Optional[str] = None

class HomeData(BaseModel):
    popular: List[MangaCard] = []
    trending: List[MangaCard] = []
    recent_updates: List[MangaCard] = []

class Genre(BaseModel):
    name: str
    slug: str
    count: Optional[int] = None

# Funções auxiliares de parsing
def extract_manga_card(item) -> MangaCard:
    """Extrai dados de um card de mangá"""
    try:
        # Link e título
        link_elem = item.select_one("a[title]")
        title = link_elem.get("title", "").strip() if link_elem else ""
        url = link_elem.get("href", "") if link_elem else ""
        slug = url.rstrip('/').split('/')[-1] if url else ""
        
        # Imagem de capa
        img_elem = item.select_one("img")
        cover_image = img_elem.get("data-src") or img_elem.get("src", "") if img_elem else ""
        
        # Rating
        rating = None
        rating_elem = item.select_one(".total_votes")
        if rating_elem:
            try:
                rating = float(rating_elem.text.strip())
            except:
                pass
        
        # Último capítulo
        latest_chapter = None
        chapter_elem = item.select_one(".chapter .chapter-link")
        if chapter_elem:
            latest_chapter = chapter_elem.text.strip()
        
        # Badges (manhwa, manga, webtoon, etc)
        badges = []
        badge_elems = item.select(".manga-title-badges a")
        for badge in badge_elems:
            badges.append(badge.text.strip())
        
        return MangaCard(
            title=title,
            slug=slug,
            url=url,
            cover_image=cover_image,
            rating=rating,
            latest_chapter=latest_chapter,
            badges=badges
        )
    except Exception as e:
        print(f"Erro ao extrair card: {e}")
        return None

def get_proxied_url(url: str) -> str:
    """Retorna URL proxiada através do AllOrigins para bypass de Cloudflare"""
    import os
    from urllib.parse import quote
    
    use_proxy = os.getenv("USE_ALLORIGINS_PROXY", "true").lower() == "true"
    
    if use_proxy:
        # Usar AllOrigins como proxy
        return f"https://api.allorigins.win/raw?url={quote(url)}"
    
    return url

async def fetch_page(url: str) -> str:
    """Faz requisição HTTP assíncrona com retry e delay anti-bot"""
    cache_key = f"page_{url}"
    if cache_key in cache:
        return cache[cache_key]
    
    import random
    
    # Usar proxy AllOrigins
    proxied_url = get_proxied_url(url)
    
    # Tentar até 3 vezes com delays crescentes
    for attempt in range(3):
        try:
            # Delay aleatório entre 0.5s e 2s (simular humano)
            if attempt > 0:
                await asyncio.sleep(random.uniform(1.0, 3.0))
            
            # Se estiver usando proxy, não precisa de headers especiais
            # Se não, usar headers aleatórios
            headers = {} if proxied_url != url else get_random_headers()
            
            async with httpx.AsyncClient(
                headers=headers if headers else None, 
                timeout=30.0, 
                follow_redirects=True,
                cookies={}  # Aceitar cookies
            ) as client:
                response = await client.get(proxied_url)  # Usar URL proxiada
                
                # Se 403, tentar novamente
                if response.status_code == 403:
                    if attempt < 2:
                        continue
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Acesso bloqueado por anti-bot após {attempt+1} tentativas. URL: {url}"
                    )
                
                response.raise_for_status()
                html = response.text
                cache[cache_key] = html
                return html
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403 and attempt < 2:
                continue
            raise HTTPException(status_code=e.response.status_code, detail=f"Erro HTTP {e.response.status_code}: {url}")
        except Exception as e:
            if attempt < 2:
                continue
            raise HTTPException(status_code=500, detail=f"Erro ao acessar {url}: {str(e)}")

async def get_manga_cover(slug: str) -> str:
    """Busca a imagem de capa real de um mangá fazendo scraping rápido"""
    try:
        manga_url = f"{BASE_URL}/manga/{slug}/"
        cache_key = f"cover_{slug}"
        
        # Verificar cache primeiro
        if cache_key in cache:
            return cache[cache_key]
        
        # Usar proxy AllOrigins
        proxied_url = get_proxied_url(manga_url)
        
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(proxied_url)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Buscar imagem de capa
                img_elem = soup.select_one(".summary_image img, .tab-summary img, .manga-cover img")
                if img_elem:
                    cover = img_elem.get("data-src") or img_elem.get("src", "")
                    if cover:
                        cache[cache_key] = cover
                        return cover
        
        return ""
    except:
        return ""

# ENDPOINTS DA API

@app.get("/api/")
async def root():
    return {
        "message": "LerMangas API - Web Scraping de Mangás",
        "endpoints": {
            "/api/home": "Dados da home (populares, quentes, atualizações)",
            "/api/search?q={query}": "Buscar mangás por título",
            "/api/manga/{slug}": "Detalhes de um mangá",
            "/api/manga/{slug}/chapter/{number}": "Imagens de um capítulo",
            "/api/manga/list?page={n}": "Lista todos os mangás paginado",
            "/api/genres": "Lista todos os gêneros/tags disponíveis",
            "/api/genre/{slug}?page={n}": "Mangás filtrados por gênero",
            "/api/filter?genres=acao,aventura&status=ongoing&order=popular": "Busca avançada com múltiplos filtros"
        }
    }

@app.get("/api/home", response_model=HomeData)
async def get_home():
    """Retorna dados da página inicial"""
    html = await fetch_page(BASE_URL)
    soup = BeautifulSoup(html, 'lxml')
    
    result = HomeData()
    
    # Mangás populares do dia
    popular_section = soup.find("div", class_="popular-manga-section")
    if popular_section:
        # CORRIGIDO para pegar todos os itens
        items = popular_section.select(".page-item-detail")
        for item in items[:12]:  # Limitar a 12
            card = extract_manga_card(item)
            if card:
                result.popular.append(card)
    
    # Mangás em alta/quentes
    trending_section = soup.find("div", class_="trending-manga-section")
    if not trending_section:
        # Tentar outras classes comuns
        trending_section = soup.find("div", class_="hot-manga") or soup.find("div", class_="manga-slider")
    if trending_section:
        # CORRIGIDO
        items = trending_section.select(".page-item-detail")
        for item in items[:12]:
            card = extract_manga_card(item)
            if card:
                result.trending.append(card)
    
    # Atualizações recentes
    recent_section = soup.find("div", class_="latest-updates") or soup.find("div", class_="page-content-listing")
    if recent_section:
        # CORRIGIDO
        items = recent_section.select(".page-item-detail")
        for item in items[:20]:
            card = extract_manga_card(item)
            if card:
                result.recent_updates.append(card)
    
    return result

@app.get("/api/search", response_model=List[MangaCard])
async def search_manga(q: str = Query(..., min_length=1)):
    """Busca mangás com autocomplete dinâmico usando AJAX do WordPress"""
    
    # Primeiro, tentar o endpoint AJAX de autocomplete do WordPress/Madara
    autocomplete_url = f"{BASE_URL}/wp-admin/admin-ajax.php"
    
    # Form data para o autocomplete (WordPress usa POST)
    form_data = {
        "action": "wp-manga-search-manga",
        "title": q
    }
    
    ajax_headers = {
        **HEADERS,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
    
    results = []
    
    # Tentar busca via AJAX (autocomplete) - USAR POST!
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(autocomplete_url, data=form_data, headers=ajax_headers)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # O WordPress retorna um formato específico
                    if isinstance(data, dict) and data.get("success") and data.get("data"):
                        items_data = data["data"]
                        
                        if isinstance(items_data, list):
                            # Buscar capas em paralelo para todos os resultados
                            tasks = []
                            for item_data in items_data:
                                if isinstance(item_data, dict) and not item_data.get("error"):
                                    title = item_data.get("title", "")
                                    url = item_data.get("url", "")
                                    slug = url.rstrip('/').split('/')[-1] if url else ""
                                    
                                    if title and slug:
                                        tasks.append((title, slug, url))
                            
                            # Buscar todas as capas em paralelo
                            import asyncio
                            covers = await asyncio.gather(*[get_manga_cover(slug) for _, slug, _ in tasks])
                            
                            # Criar os resultados com as capas
                            for (title, slug, url), cover_image in zip(tasks, covers):
                                results.append(MangaCard(
                                    title=title,
                                    slug=slug,
                                    url=url,
                                    cover_image=cover_image,
                                    badges=[]
                                ))
                    
                    # Se retornou HTML em vez de JSON, parsear
                    elif response.text and '<' in response.text:
                        soup = BeautifulSoup(response.text, 'lxml')
                        items = soup.select("a, .item, li")
                        
                        for item in items[:10]:
                            link = item if item.name == 'a' else item.select_one("a")
                            if link:
                                title = link.get("title", "") or link.text.strip()
                                url = link.get("href", "")
                                slug = url.rstrip('/').split('/')[-1] if url and '/manga/' in url else ""
                                
                                img = item.select_one("img")
                                cover_image = ""
                                if img:
                                    cover_image = img.get("data-src") or img.get("src", "")
                                
                                if title and slug and '/manga/' in url:
                                    results.append(MangaCard(
                                        title=title,
                                        slug=slug,
                                        url=url,
                                        cover_image=cover_image,
                                        badges=[]
                                    ))
                except:
                    pass
    except:
        pass
    
    # Se não encontrou via AJAX, fazer busca normal
    if not results:
        search_url = f"{BASE_URL}/?s={q}&post_type=wp-manga"
        html = await fetch_page(search_url)
        soup = BeautifulSoup(html, 'lxml')
        
        # Tentar estrutura de busca (.c-tabs-item)
        search_items = soup.select(".c-tabs-item")
        if search_items:
            for item in search_items:
                try:
                    link_elem = item.select_one(".tab-thumb a, h3 a, .post-title a")
                    if not link_elem:
                        continue
                        
                    title = link_elem.get("title", "") or link_elem.text.strip()
                    url = link_elem.get("href", "")
                    slug = url.rstrip('/').split('/')[-1] if url else ""
                    
                    img_elem = item.select_one(".tab-thumb img, img")
                    cover_image = ""
                    if img_elem:
                        cover_image = img_elem.get("data-src") or img_elem.get("src", "")
                    
                    latest_chapter = None
                    chapter_elem = item.select_one(".tab-meta .latest-chap .chapter a, .chapter a")
                    if chapter_elem:
                        latest_chapter = chapter_elem.text.strip()
                    
                    badges = []
                    badge_elems = item.select(".mg_genres a, .summary-content a")
                    for badge in badge_elems[:3]:
                        badges.append(badge.text.strip())
                    
                    if title and slug:
                        results.append(MangaCard(
                            title=title,
                            slug=slug,
                            url=url,
                            cover_image=cover_image,
                            latest_chapter=latest_chapter,
                            badges=badges
                        ))
                except Exception as e:
                    print(f"Erro ao processar item de busca: {e}")
                    continue
        
        # Fallback: tentar estrutura padrão - CORRIGIDO
        if not results:
            items = soup.select(".page-item-detail")
            for item in items:
                card = extract_manga_card(item)
                if card:
                    results.append(card)
    
    return results

@app.get("/api/manga/{slug}", response_model=MangaDetail)
async def get_manga_detail(slug: str):
    """Retorna detalhes de um mangá"""
    url = f"{BASE_URL}/manga/{slug}/"
    html = await fetch_page(url)
    soup = BeautifulSoup(html, 'lxml')
    
    # DEBUG: Log HTML length
    print(f"[DEBUG] HTML length for {slug}: {len(html)} chars")
    
    # Título - Tentar múltiplos seletores
    title_elem = soup.select_one(".post-title h1, .post-title h3, h1.entry-title, .manga-title")
    title = title_elem.text.strip() if title_elem else slug
    print(f"[DEBUG] Title: {title}")
    
    # Capa - Tentar múltiplos seletores
    cover_elem = soup.select_one(
        ".summary_image img, "
        ".tab-summary img, "
        ".manga-cover img, "
        "img.wp-post-image, "
        ".post-thumb img"
    )
    cover_image = ""
    if cover_elem:
        cover_image = cover_elem.get("data-src") or cover_elem.get("src", "")
    print(f"[DEBUG] Cover: {cover_image[:100] if cover_image else 'NOT FOUND'}")
    
    # Rating
    rating = None
    rating_elem = soup.select_one(".total_votes")
    if rating_elem:
        try:
            rating = float(rating_elem.text.strip())
        except:
            pass
    
    # Sinopse
    summary = None
    summary_elem = soup.select_one(".summary__content p")
    if summary_elem:
        summary = summary_elem.text.strip()
    
    # Tenta outros seletores se não encontrou
    if not summary:
        summary_elem = soup.select_one(".description-summary .summary__content")
        if summary_elem:
            summary = summary_elem.get_text(strip=True)
    
    if not summary:
        summary_elem = soup.select_one(".summary_content")
        if summary_elem:
            summary = summary_elem.get_text(strip=True)
    
    print(f"[DEBUG] Summary for {slug}: {summary[:100] if summary else 'NOT FOUND'}")
    
    # Metadata
    author = None
    artist = None
    status = None
    
    post_content = soup.select(".post-content_item")
    for item in post_content:
        header = item.select_one(".summary-heading h5")
        if not header:
            continue
        
        header_text = header.text.strip().lower()
        content = item.select_one(".summary-content")
        
        if "autor" in header_text and content:
            author = content.text.strip()
        elif "artist" in header_text and content:
            artist = content.text.strip()
        elif "status" in header_text and content:
            status = content.text.strip()
    
    # Gêneros - Tentar múltiplos seletores
    genres = []
    genre_elems = soup.select(".genres-content a, .manga-genres a, .genres a, .post-content .genres a")
    for genre in genre_elems:
        genres.append(genre.text.strip())
    print(f"[DEBUG] Genres: {genres}")
    
    # Badges
    badges = []
    badge_elems = soup.select(".manga-title-badges a, .badges a")
    for badge in badge_elems:
        badges.append(badge.text.strip())
    
    # Capítulos - Tentar múltiplos seletores
    chapters = []
    chapter_elems = soup.select(
        ".listing-chapters_wrap ul.main li, "
        ".wp-manga-chapter li, "
        ".chapter-list li, "
        ".main li.wp-manga-chapter"
    )
    print(f"[DEBUG] Found {len(chapter_elems)} chapter elements")
    for ch_elem in chapter_elems:
        ch_link = ch_elem.select_one("a")
        if not ch_link:
            continue
        
        ch_url = ch_link.get("href", "")
        ch_text = ch_link.text.strip()
        
        # Extrair número do capítulo
        ch_number = ""
        match = re.search(r'cap[íi]tulo[- ](\d+(?:\.\d+)?)', ch_text, re.IGNORECASE)
        if match:
            ch_number = match.group(1)
        
        # Data de lançamento
        date_elem = ch_elem.select_one(".chapter-release-date")
        release_date = date_elem.text.strip() if date_elem else None
        
        chapters.append(Chapter(
            number=ch_number or ch_text,
            title=ch_text,
            url=ch_url,
            release_date=release_date
        ))
    
    return MangaDetail(
        title=title,
        slug=slug,
        cover_image=cover_image,
        rating=rating,
        summary=summary,
        author=author,
        artist=artist,
        status=status,
        genres=genres,
        badges=badges,
        chapters=chapters
    )

@app.get("/api/manga/{slug}/chapter/{chapter_number}", response_model=ChapterImages)
async def get_chapter_images(slug: str, chapter_number: str):
    """Retorna as imagens de um capítulo"""
    url = f"{BASE_URL}/manga/{slug}/capitulo-{chapter_number}/"
    html = await fetch_page(url)
    soup = BeautifulSoup(html, 'lxml')
    
    # Título do mangá
    title_elem = soup.select_one(".breadcrumb li:nth-child(2) a")
    manga_title = title_elem.text.strip() if title_elem else slug
    
    # Imagens do capítulo
    images = []
    img_container = soup.select_one(".reading-content")
    if img_container:
        img_elems = img_container.select("img")
        for img in img_elems:
            img_url = img.get("data-src") or img.get("src", "")
            if img_url and not img_url.endswith(".gif"):  # Ignorar GIFs de loading
                images.append(img_url.strip())
    
    # Navegação (capítulo anterior/próximo)
    prev_chapter = None
    next_chapter = None
    
    nav_elems = soup.select(".select-pagination option")
    for i, option in enumerate(nav_elems):
        if option.get("selected"):
            if i > 0:
                prev_url = nav_elems[i - 1].get("value")
                if prev_url:
                    prev_chapter = prev_url
            if i < len(nav_elems) - 1:
                next_url = nav_elems[i + 1].get("value")
                if next_url:
                    next_chapter = next_url
            break
    
    return ChapterImages(
        manga_title=manga_title,
        chapter_number=chapter_number,
        images=images,
        prev_chapter=prev_chapter,
        next_chapter=next_chapter
    )

@app.get("/api/manga/list", response_model=List[MangaCard])
async def list_all_manga(page: int = Query(1, ge=1)):
    """Lista todos os mangás com paginação"""
    url = f"{BASE_URL}/manga/page/{page}/" if page > 1 else f"{BASE_URL}/manga/"
    html = await fetch_page(url)
    soup = BeautifulSoup(html, 'lxml')
    
    results = []
    # Corrigido: usar .page-item-detail que retorna todos os 20 mangás
    items = soup.select(".page-item-detail")
    
    for item in items:
        card = extract_manga_card(item)
        if card:
            results.append(card)
    
    return results

@app.get("/api/proxy-image")
async def proxy_image(url: str = Query(..., description="URL da imagem a ser carregada")):
    """Proxy para carregar imagens com os headers corretos e evitar CORS/hotlinking"""
    
    # Verificar cache primeiro
    cache_key = f"img_{url}"
    if cache_key in image_cache:
        cached_data = image_cache[cache_key]
        return Response(
            content=cached_data['content'],
            media_type=cached_data['content_type'],
            headers={
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
                "X-Cache": "HIT"
            }
        )
    
    try:
        # Headers específicos para imagens
        image_headers = {
            "User-Agent": HEADERS["User-Agent"],
            "Referer": BASE_URL + "/",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=image_headers)
            response.raise_for_status()
            
            # Detectar tipo de conteúdo
            content_type = response.headers.get("content-type", "image/jpeg")
            content = response.content
            
            # Salvar no cache
            image_cache[cache_key] = {
                'content': content,
                'content_type': content_type
            }
            
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*",
                    "X-Cache": "MISS"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar imagem: {str(e)}")

@app.get("/api/mangadex-proxy")
async def mangadex_proxy(url: str = Query(..., description="URL da imagem do MangaDex")):
    """
    Proxy específico para imagens do MangaDex
    MangaDex exige:
    - User-Agent real (não pode ser spoofed)
    - SEM header Via (não permite proxies não-transparentes)
    - Imagens devem ser proxiadas (não hotlinked)
    """
    
    # Verificar cache primeiro
    cache_key = f"mdx_{url}"
    if cache_key in image_cache:
        cached_data = image_cache[cache_key]
        return Response(
            content=cached_data['content'],
            media_type=cached_data['content_type'],
            headers={
                "Cache-Control": "public, max-age=2592000, immutable",  # 30 dias
                "Access-Control-Allow-Origin": "*",
                "X-Cache": "HIT"
            }
        )
    
    try:
        # Headers conforme documentação do MangaDex
        # https://api.mangadex.org/docs/2-limitations/
        mangadex_headers = {
            "User-Agent": "MangaVerso/1.0 (https://github.com/thierrysuceli/mangaverso)",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "Referer": "https://mangadex.org/",
            # NÃO incluir Via header - MangaDex bloqueia proxies não-transparentes
        }
        
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(url, headers=mangadex_headers)
            response.raise_for_status()
            
            # Detectar tipo de conteúdo
            content_type = response.headers.get("content-type", "image/jpeg")
            content = response.content
            
            # Salvar no cache (imagens MangaDex são imutáveis)
            image_cache[cache_key] = {
                'content': content,
                'content_type': content_type
            }
            
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=2592000, immutable",  # 30 dias
                    "Access-Control-Allow-Origin": "*",
                    "X-Cache": "MISS"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar imagem do MangaDex: {str(e)}")

@app.get("/api/genres", response_model=List[Genre])
async def get_genres():
    """Retorna lista de todos os gêneros/tags disponíveis"""
    cache_key = "genres_list"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        # Buscar página com filtros avançados
        search_url = f"{BASE_URL}/?s=&post_type=wp-manga"
        html = await fetch_page(search_url)
        soup = BeautifulSoup(html, 'lxml')
        
        # Extrair checkboxes de gêneros
        genres_inputs = soup.select('#search-advanced .form-group.checkbox-group input[name="genre[]"]')
        
        genres = []
        for genre_input in genres_inputs:
            slug = genre_input.get('value', '')
            label = genre_input.find_next('label')
            
            if label and slug:
                name = label.get_text(strip=True)
                genres.append(Genre(name=name, slug=slug))
        
        # Cachear resultado
        cache[cache_key] = genres
        return genres
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar gêneros: {str(e)}")

@app.get("/api/genre/{genre_slug}", response_model=List[MangaCard])
async def get_manga_by_genre(
    genre_slug: str,
    page: int = Query(1, ge=1, description="Número da página")
):
    """Retorna mangás filtrados por gênero/tag"""
    cache_key = f"genre_{genre_slug}_page_{page}"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        # URL padrão do WordPress Madara para gêneros
        if page == 1:
            genre_url = f"{BASE_URL}/manga-genre/{genre_slug}/"
        else:
            genre_url = f"{BASE_URL}/manga-genre/{genre_slug}/page/{page}/"
        
        html = await fetch_page(genre_url)
        soup = BeautifulSoup(html, 'lxml')
        
        # Extrair cards de mangás - CORRIGIDO para pegar todos os 20 itens
        manga_items = soup.select('.page-item-detail')
        results = []
        
        for item in manga_items:
            card = extract_manga_card(item)
            if card:
                results.append(card)
        
        # Cachear resultado
        cache[cache_key] = results
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar mangás do gênero: {str(e)}")

@app.get("/api/filter", response_model=List[MangaCard])
async def filter_manga(
    genres: Optional[str] = Query(None, description="Gêneros separados por vírgula (ex: acao,aventura)"),
    status: Optional[str] = Query(None, description="Status do mangá (ongoing, completed, etc)"),
    order: Optional[str] = Query("latest", description="Ordenação (latest, popular, views, rating)"),
    page: int = Query(1, ge=1, description="Número da página")
):
    """Busca mangás com múltiplos filtros (gêneros, status, ordenação)"""
    
    cache_key = f"filter_{genres}_{status}_{order}_page_{page}"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        # OTIMIZAÇÃO: Se tem apenas 1 gênero e sem outros filtros, redirecionar para endpoint de gênero
        if genres and ',' not in genres and not status and order == "latest":
            # Redirecionar para endpoint otimizado de gênero único
            return await get_manga_by_genre(genres.strip(), page)
        
        # CASO 1: Múltiplos gêneros OU filtros complexos
        # WordPress Madara usa /manga-genre/ para filtros de gênero
        if genres:
            genre_list = [g.strip() for g in genres.split(',')]
            
            # Se tem múltiplos gêneros, usar endpoint de busca avançada
            if len(genre_list) > 1:
                search_url = f"{BASE_URL}/manga-genre/{'+'.join(genre_list)}/"
                if page > 1:
                    search_url += f"page/{page}/"
            else:
                # 1 gênero com filtros adicionais (status, order diferente)
                search_url = f"{BASE_URL}/manga-genre/{genre_list[0]}/"
                if page > 1:
                    search_url += f"page/{page}/"
        else:
            # Sem gênero: home page com filtros
            search_url = f"{BASE_URL}/page/{page}/" if page > 1 else BASE_URL
        
        # Adicionar parâmetros de query se necessário
        params = {}
        if status:
            params['status'] = status
        if order and order != "latest":
            params['m_orderby'] = order
        
        async with httpx.AsyncClient(headers=HEADERS, timeout=30.0) as client:
            response = await client.get(search_url, params=params if params else None)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            manga_items = soup.select('.page-item-detail')
            
            results = []
            for item in manga_items:
                card = extract_manga_card(item)
                if card:
                    results.append(card)
            
            cache[cache_key] = results
            return results
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao filtrar mangás: {str(e)}")

# Servidor local para desenvolvimento  
if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando servidor FastAPI em http://127.0.0.1:8000")
    print("📚 API LerManga pronta para uso!")
    uvicorn.run(app, host="127.0.0.1", port=8000)
