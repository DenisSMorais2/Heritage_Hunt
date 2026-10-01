// ============================================================
// Heritage Hunt CV — Álbum do monumento (interface)
//
// O álbum deixou de ser "galeria + formulário". É uma página
// editorial que se lê de cima a baixo:
//
//     capa · o que vi · o que senti · o que descobri · onde foi
//
// E que MUDA conforme é preenchida. Um álbum acabado de descobrir
// mostra a imagem oficial e um convite; um álbum vivido mostra a
// fotografia da própria pessoa, a memória que escreveu e as
// etiquetas que escolheu.
//
// O QUE ESTE FICHEIRO NÃO FAZ:
//   - não guarda nada: pede ao `script.js` por handlers;
//   - não faz contas sobre o álbum (pergunta ao `album.js`);
//   - não atribui XP nem conhece as suas regras;
//   - não inventa conteúdo cultural: desenha o que existe;
//   - não cria um segundo álbum — as fotografias, a experiência e
//     as etiquetas continuam a ser as mesmas de sempre.
// ============================================================

const AlbumUI = (function () {
    'use strict';

    // Quanto tempo o aviso discreto fica no ecrã. Curto de
    // propósito: a celebração grande pertence à descoberta.
    const TOAST_MS = 2600;

    const handlers = {
        onClose: null,
        onAddPhoto: null,
        onDeletePhoto: null,
        onSetCover: null,
        onOpenEditor: null,
        onSaveMemory: null,
        onToggleTag: null,
        onOpenMap: null,
        // Ponto 15: do monumento para a conversa daquele monumento.
        // E a porta que fecha o ciclo duvida -> conversa -> dica ->
        // descoberta sem passar pela lista de conversas.
        onOpenConversation: null,
        // As pistas daquele monumento, a partir do monumento.
        onOpenClues: null,
        onRetrySync: null
    };

    const sources = {
        getAlbum: function () { return null; },
        getTagCatalog: function () { return []; },
        getSignedUrls: function () { return Promise.resolve({}); },
        getUserName: function () { return ''; },
        getZoneName: function () { return ''; },
        getCityName: function () { return ''; },
        getCountryName: function () { return ''; },
        formatShortDate: function () { return ''; },
        formatLongDate: function () { return ''; }
    };

    const elements = {};

    // O monumento aberto. `null` = a página está fechada.
    let currentId = null;

    // Estado do editor da memória, só enquanto está aberto
    let draftTags = [];

    // Índice da fotografia no visualizador, ou null
    let viewerIndex = null;

    // Fotografias já com link assinado, por caminho. Vive só
    // enquanto a página está aberta — os links expiram.
    let signedUrls = {};

    // A primeira fotografia de sempre anima à entrada UMA vez
    let animateNextPhoto = false;

    let toastTimer = null;

    // ==========================================================
    // Utilitários
    // ==========================================================
    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function prefersReducedMotion() {
        return typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function safe(fn, fallback) {
        try {
            const value = fn();
            return value === undefined || value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function album() {
        if (currentId === null || currentId === undefined) return null;
        return safe(function () { return sources.getAlbum(currentId); }, null);
    }

    // Pixel transparente enquanto o link assinado não chega — em
    // vez do ícone de imagem partida.
    const BLANK =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // O `src` de uma fotografia: a pendente traz a imagem consigo,
    // a que já subiu espera pelo link assinado.
    function photoSrc(photo) {
        if (!photo) return BLANK;
        if (photo.pending && photo.data) return photo.data;
        if (photo.path && signedUrls[photo.path]) return signedUrls[photo.path];
        return BLANK;
    }

    function photoAlt(index, monumentName) {
        return t('album.openPhoto', { n: index + 1 }) + ' — ' + monumentName;
    }

    // ==========================================================
    // O HERÓI (pontos 5, 6, 7, 40 e 45)
    // ==========================================================
    function renderHero(data) {
        const monument = data.monument || {};
        const cover = data.cover;

        const src = cover.photo ? photoSrc(cover.photo) : (cover.image || BLANK);

        elements.heroImg.src = src;
        // A capa é decorativa: o nome do lugar está no título ao
        // lado, e repeti-lo aqui só duplicava o anúncio do leitor.
        elements.heroImg.alt = '';
        elements.heroImg.dataset.path = (cover.photo && cover.photo.path) || '';
        elements.heroImg.onerror = function () {
            this.src = cover.image || BLANK;
            this.onerror = null;
        };

        const city = safe(sources.getCityName, '');
        const country = safe(sources.getCountryName, '');
        elements.heroKicker.textContent = [city, country]
            .filter(Boolean).join(' · ');

        elements.title.textContent = monument.name || '';
        elements.topName.textContent = monument.name || '';

        const zone = data.place.zoneId
            ? safe(function () { return sources.getZoneName(data.place.zoneId); }, '')
            : '';
        elements.heroZone.textContent = zone;
        elements.heroZone.hidden = !zone;

        renderStamp(data);
    }

    // O selo: DESCOBERTO enquanto não há nada de pessoal, MEMÓRIA
    // GUARDADA a partir da primeira contribuição (pontos 6, 7, 39).
    function renderStamp(data) {
        const saved = data.stamp.saved;
        const date = safe(function () {
            return sources.formatLongDate(data.stamp.discoveredAt);
        }, '');

        elements.stamp.className = 'hh-al-stamp' + (saved ? ' is-saved' : '');
        elements.stamp.innerHTML =
            '<i class="' + (saved ? 'fas fa-landmark' : 'fas fa-check-circle') + '" aria-hidden="true"></i>' +
            '<span class="hh-al-stamp-text">' +
                '<b>' + escapeHtml(t(saved ? 'album.memorySaved' : 'album.discovered')) + '</b>' +
                (date
                    ? '<small>' + escapeHtml(t('album.discoveredOn', { d: date })) + '</small>'
                    : '') +
            '</span>';
    }

    // ==========================================================
    // NAVEGAÇÃO INTERNA (pontos 10 e 11)
    //
    // Âncoras dentro da MESMA página, não quatro páginas. A aba
    // activa acompanha a secção visível; tocar leva lá com scroll
    // suave (ou salta, com movimento reduzido).
    // ==========================================================
    const NAV_ICONS = {
        visit: 'fas fa-camera',
        memory: 'fas fa-file-lines',
        story: 'fas fa-book-open',
        summary: 'fas fa-chart-simple'
    };

    const NAV_LABELS = {
        visit: 'album.navVisit',
        memory: 'album.navMemory',
        story: 'album.navStory',
        summary: 'album.navSummary'
    };

    const SECTION_OF = {
        visit: 'albumVisit',
        memory: 'albumMemory',
        story: 'albumStory',
        summary: 'albumSummary'
    };

    function renderNav(data) {
        elements.nav.innerHTML = data.sections.map(function (section, index) {
            return '<button type="button" role="tab"' +
                ' class="hh-al-tab' + (index === 0 ? ' is-on' : '') + '"' +
                ' data-album-tab="' + escapeHtml(section.id) + '"' +
                ' aria-selected="' + (index === 0 ? 'true' : 'false') + '"' +
                ' aria-controls="' + SECTION_OF[section.id] + '">' +
                '<i class="' + NAV_ICONS[section.id] + '" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(t(NAV_LABELS[section.id])) + '</span>' +
            '</button>';
        }).join('');
    }

    function goToSection(id) {
        const target = document.getElementById(SECTION_OF[id]);
        if (!target || !elements.scroll) return;

        // A barra fica por cima: descontamos a altura dela para o
        // título da secção não aterrar escondido.
        const navHeight = elements.nav ? elements.nav.offsetHeight : 0;
        const top = target.offsetTop - navHeight - 8;

        elements.scroll.scrollTo({
            top: Math.max(0, top),
            behavior: prefersReducedMotion() ? 'auto' : 'smooth'
        });
    }

    // A aba activa segue a secção visível. Um observador chega —
    // ouvir o scroll a cada pixel seria trabalho a mais para uma
    // barra de quatro botões.
    let spy = null;

    function watchSections(data) {
        if (spy) { spy.disconnect(); spy = null; }
        if (typeof IntersectionObserver !== 'function') return;

        const map = {};
        data.sections.forEach(function (section) {
            const element = document.getElementById(SECTION_OF[section.id]);
            if (element) map[SECTION_OF[section.id]] = section.id;
        });

        spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const id = map[entry.target.id];
                if (id) markTab(id);
            });
        }, {
            root: elements.scroll,
            // A secção conta como "a que estou a ler" quando ocupa
            // a faixa de cima do ecrã, não quando assoma em baixo.
            rootMargin: '-20% 0px -65% 0px',
            threshold: 0
        });

        Object.keys(map).forEach(function (domId) {
            const element = document.getElementById(domId);
            if (element) spy.observe(element);
        });
    }

    function markTab(id) {
        elements.nav.querySelectorAll('[data-album-tab]').forEach(function (tab) {
            const on = tab.dataset.albumTab === id;
            tab.classList.toggle('is-on', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
    }

    // ==========================================================
    // A MINHA VISITA — as fotografias (pontos 12, 13, 14)
    //
    // Composição editorial, não grelha uniforme: a capa grande em
    // cima, as restantes em cartões menores, e o "adicionar" como
    // parte da composição.
    // ==========================================================
    function photoCardHtml(photo, index, data, options) {
        const config = options || {};
        const isCover = data.cover.photo && data.cover.photo.id === photo.id;
        const classes = ['hh-al-photo'];
        if (config.lead) classes.push('is-lead');
        if (photo.pending) classes.push('is-pending');
        if (config.animate) classes.push('is-new');

        return '' +
            '<figure class="' + classes.join(' ') + '" data-album-photo="' + escapeHtml(photo.id) + '">' +
                '<button type="button" class="hh-al-photo-open"' +
                    ' data-album-view="' + index + '"' +
                    ' aria-label="' + escapeHtml(photoAlt(index, (data.monument || {}).name || '')) + '">' +
                    '<img src="' + escapeHtml(photoSrc(photo)) + '" alt=""' +
                        ' data-path="' + escapeHtml(photo.path || '') + '"' +
                        ' loading="' + (config.lead ? 'eager' : 'lazy') + '"' +
                        ' decoding="async">' +
                '</button>' +
                (isCover
                    ? '<span class="hh-al-photo-badge">' +
                          '<i class="fas fa-landmark" aria-hidden="true"></i>' +
                          '<span>' + escapeHtml(t('album.mainPhoto')) + '</span>' +
                      '</span>'
                    : '') +
                (photo.pending
                    ? '<span class="hh-al-photo-sync" title="' + escapeHtml(t('album.pendingSync')) + '">' +
                          '<i class="fas fa-cloud-arrow-up" aria-hidden="true"></i>' +
                          '<span>' + escapeHtml(t('album.pendingSync')) + '</span>' +
                      '</span>'
                    : '') +
                '<button type="button" class="hh-al-photo-menu"' +
                    ' data-album-photo-menu="' + escapeHtml(photo.id) + '"' +
                    ' aria-haspopup="true" aria-expanded="false"' +
                    ' aria-label="' + escapeHtml(t('album.photoOptions')) + '">' +
                    '<i class="fas fa-ellipsis" aria-hidden="true"></i>' +
                '</button>' +
            '</figure>';
    }

    function addTileHtml(data) {
        if (data.slots.isFull) {
            return '' +
                '<div class="hh-al-add is-full">' +
                    '<i class="fas fa-circle-check" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(t('album.albumFull')) + '</span>' +
                '</div>';
        }

        return '' +
            '<button type="button" class="hh-al-add" data-album-action="add">' +
                '<span class="hh-al-add-ring" aria-hidden="true"><i class="fas fa-plus"></i></span>' +
                '<span>' + escapeHtml(t('album.addPhoto')) + '</span>' +
            '</button>';
    }

    function renderVisit(data) {
        const photos = data.photos;

        elements.visitCount.textContent = t('album.photosSavedCount', {
            n: data.slots.used,
            max: data.slots.max
        });

        // Vazio: um convite, não uma grelha com um buraco (ponto 36)
        if (!photos.length) {
            elements.visitBody.innerHTML = '' +
                '<div class="hh-al-empty">' +
                    '<span class="hh-al-empty-crest" aria-hidden="true"><i class="fas fa-camera"></i></span>' +
                    '<p class="hh-al-empty-line">' + escapeHtml(t('album.storyStarted')) + '</p>' +
                    '<p class="hh-al-empty-note">' + escapeHtml(t('album.noMemoryYet')) + '</p>' +
                    '<button type="button" class="hh-al-cta is-ghost" data-album-action="add">' +
                        '<i class="fas fa-plus" aria-hidden="true"></i>' +
                        '<span>' + escapeHtml(t('album.firstPhoto')) + '</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        // A capa em destaque; as restantes pela ordem em que foram
        // guardadas, com o "adicionar" a fechar a composição.
        const coverId = data.cover.photo ? data.cover.photo.id : null;
        const lead = photos.filter(function (p) { return p.id === coverId; })[0] || photos[0];
        const rest = photos.filter(function (p) { return p.id !== lead.id; });

        const leadIndex = photos.indexOf(lead);
        const animate = animateNextPhoto;
        animateNextPhoto = false;

        elements.visitBody.innerHTML = '' +
            photoCardHtml(lead, leadIndex, data, { lead: true, animate: animate }) +
            '<div class="hh-al-strip">' +
                rest.map(function (photo) {
                    return photoCardHtml(photo, photos.indexOf(photo), data, {});
                }).join('') +
                addTileHtml(data) +
            '</div>';
    }

    // ==========================================================
    // A MINHA MEMÓRIA (pontos 19, 20, 23)
    //
    // Página de diário quando existe; convite editorial quando
    // não. Nunca um textarea permanente à espera.
    // ==========================================================
    function tagChipsHtml(data) {
        if (!data.tags.length) return '';

        const catalog = safe(sources.getTagCatalog, []);

        const labels = data.tags.map(function (id) {
            const entry = catalog.filter(function (tag) { return tag.id === id; })[0];
            return entry ? t(entry.key) : null;
        }).filter(Boolean);

        if (!labels.length) return '';

        return '<div class="hh-al-chips">' +
            labels.map(function (label) {
                return '<span class="hh-al-chip">' + escapeHtml(label) + '</span>';
            }).join('') +
        '</div>';
    }

    function renderMemory(data) {
        const date = safe(function () {
            return sources.formatLongDate(data.stamp.discoveredAt);
        }, '');

        if (!data.hasExperience) {
            elements.memoryEdit.hidden = true;
            elements.memoryBody.innerHTML = '' +
                '<div class="hh-al-invite">' +
                    '<p class="hh-al-invite-q">' + escapeHtml(t('album.memoryPrompt')) + '</p>' +
                    '<button type="button" class="hh-al-cta is-ghost" data-album-action="write">' +
                        '<i class="fas fa-feather-pointed" aria-hidden="true"></i>' +
                        '<span>' + escapeHtml(t('album.writeMemory')) + '</span>' +
                    '</button>' +
                '</div>' +
                tagChipsHtml(data);
            return;
        }

        const name = safe(sources.getUserName, '');

        elements.memoryEdit.hidden = false;
        elements.memoryBody.innerHTML = '' +
            '<article class="hh-al-diary">' +
                (date ? '<p class="hh-al-diary-date">' + escapeHtml(date) + '</p>' : '') +
                '<p class="hh-al-diary-text">' + escapeHtml(data.note) + '</p>' +
                (name ? '<p class="hh-al-diary-sign">— ' + escapeHtml(name) + '</p>' : '') +
                tagChipsHtml(data) +
            '</article>';
    }

    // ==========================================================
    // A HISTÓRIA DO LUGAR (pontos 25 a 30)
    //
    // Só se desenha o que existe. Sem fotografia histórica, o
    // cartão do "Sabias que" fica sozinho — e fica bem. Nunca se
    // inventa um facto para encher um espaço (ponto 27).
    // ==========================================================
    function renderStory(data) {
        const story = data.story;

        elements.storySection.hidden = !story.hasAny;
        if (!story.hasAny) {
            elements.storyBody.innerHTML = '';
            return;
        }

        elements.storyBody.innerHTML =
            (story.hasImage
                ? '<figure class="hh-al-plate">' +
                      '<img src="' + escapeHtml(story.image) + '" alt=""' +
                          ' loading="lazy" decoding="async">' +
                  '</figure>'
                : '') +
            (story.hasStory
                ? '<div class="hh-al-know">' +
                      '<h4 class="hh-al-know-title">' + escapeHtml(t('album.didYouKnow')) + '</h4>' +
                      '<p class="hh-al-know-text">' + escapeHtml(story.story) + '</p>' +
                  '</div>'
                : '') +
            (story.hasCuriosity
                ? '<div class="hh-al-curio">' +
                      '<p class="hh-al-curio-label">' + escapeHtml(t('album.curiosity')) + '</p>' +
                      '<p class="hh-al-curio-text">' + escapeHtml(story.curiosity) + '</p>' +
                  '</div>'
                : '');
    }

    // ==========================================================
    // A VISITA EM NÚMEROS (pontos 31 e 32)
    //
    // Três indicadores pessoais. XP não entra: o álbum é memória,
    // não painel de progressão.
    // ==========================================================
    function renderSummary(data) {
        const stat = function (icon, value, label) {
            return '<div class="hh-al-stat">' +
                '<i class="' + icon + '" aria-hidden="true"></i>' +
                '<b>' + value + '</b>' +
                '<span>' + escapeHtml(label) + '</span>' +
            '</div>';
        };

        elements.summaryBody.innerHTML =
            stat('fas fa-camera', data.stats.photos, t('album.statPhotos')) +
            stat('fas fa-file-lines', data.stats.memories, t('album.statMemory')) +
            stat('fas fa-tag', data.stats.tags, t('album.statTags'));
    }

    // ==========================================================
    // A MINHA JORNADA (pontos 33 e 34)
    //
    // DECISÃO: cartão visual com localização e CTA, sem segunda
    // instância de Leaflet. O mapa desta app é UM só, e criar
    // outro dentro de cada álbum — que abre e fecha constantemente
    // — custava muito para mostrar um ponto que não se manipula.
    // ==========================================================
    function renderJourney(data) {
        const zone = data.place.zoneId
            ? safe(function () { return sources.getZoneName(data.place.zoneId); }, '')
            : '';
        const city = safe(sources.getCityName, '');

        elements.journeyBody.innerHTML = '' +
            '<div class="hh-al-place">' +
                '<span class="hh-al-place-pin" aria-hidden="true"><i class="fas fa-location-dot"></i></span>' +
                '<span class="hh-al-place-text">' +
                    (city ? '<b>' + escapeHtml(city) + '</b>' : '') +
                    (zone ? '<span>' + escapeHtml(zone) + '</span>' : '') +
                '</span>' +
                (data.place.hasCoords
                    ? '<button type="button" class="hh-al-place-btn" data-album-action="map">' +
                          '<span>' + escapeHtml(t('album.viewOnMap')) + '</span>' +
                          '<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>' +
                      '</button>'
                    : '') +
            '</div>';
    }

    // ==========================================================
    // A ACÇÃO FINAL (ponto 35)
    //
    // O convite muda com o estado. Quando não há nada a propor —
    // álbum cheio e memória escrita — não se força um botão.
    // ==========================================================
    function renderCta(data) {
        if (data.isEmpty) {
            elements.cta.hidden = false;
            elements.cta.innerHTML =
                '<button type="button" class="hh-al-cta" data-album-action="add">' +
                    '<i class="fas fa-camera" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(t('album.firstPhoto')) + '</span>' +
                '</button>';
            return;
        }

        if (!data.slots.isFull) {
            elements.cta.hidden = false;
            elements.cta.innerHTML =
                '<button type="button" class="hh-al-cta" data-album-action="add">' +
                    '<i class="fas fa-camera" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(t(data.hasExperience ? 'album.addMoreMemories' : 'album.addPhoto')) + '</span>' +
                '</button>';
            return;
        }

        if (!data.hasExperience) {
            elements.cta.hidden = false;
            elements.cta.innerHTML =
                '<button type="button" class="hh-al-cta" data-album-action="write">' +
                    '<i class="fas fa-feather-pointed" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(t('album.writeMemory')) + '</span>' +
                '</button>';
            return;
        }

        // Nada por fazer: um botão artificial só ocupava o fim da
        // página a dizer nada.
        elements.cta.hidden = true;
        elements.cta.innerHTML = '';
    }

    // ==========================================================
    // O MENU DO TOPO (ponto 48)
    //
    // Só entra o que existe mesmo. Sem fotografias não há capa
    // para trocar; sem espaço não há fotografia para juntar.
    // ==========================================================
    function renderTopMenu(data) {
        const items = [];

        if (!data.slots.isFull) {
            items.push({ action: 'add', icon: 'fas fa-camera', label: t('album.addPhoto') });
        }

        items.push({
            action: 'write',
            icon: 'fas fa-feather-pointed',
            label: t(data.hasExperience ? 'album.editMemory' : 'album.writeMemory')
        });

        if (data.place.hasCoords) {
            items.push({ action: 'map', icon: 'fas fa-map-location-dot', label: t('album.viewOnMap') });
        }

        if (handlers.onOpenClues) {
            items.push({ action: 'clues', icon: 'fas fa-lightbulb', label: t('cluesTitle') });
        }

        if (handlers.onOpenConversation) {
            items.push({ action: 'talk', icon: 'fas fa-comments', label: t('chatConversation') });
        }

        elements.menu.innerHTML = items.map(function (item) {
            return '<button type="button" role="menuitem" class="hh-al-menu-item"' +
                ' data-album-action="' + item.action + '">' +
                '<i class="' + item.icon + '" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(item.label) + '</span>' +
            '</button>';
        }).join('');
    }

    function closeTopMenu() {
        elements.menu.classList.add('hidden');
        elements.menuBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleTopMenu() {
        const open = elements.menu.classList.contains('hidden');
        elements.menu.classList.toggle('hidden', !open);
        elements.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // ==========================================================
    // O MENU DE UMA FOTOGRAFIA (ponto 14)
    // ==========================================================
    function openPhotoMenu(photoId, button) {
        const data = album();
        if (!data) return;

        const isCover = data.cover.photo && data.cover.photo.id === photoId;

        const items = [];
        if (!isCover) {
            items.push({ action: 'cover', icon: 'fas fa-landmark', label: t('album.setAsCover') });
        }
        items.push({ action: 'remove', icon: 'fas fa-trash-can', label: t('album.removePhoto'), danger: true });

        elements.photoMenu.innerHTML =
            (isCover
                ? '<p class="hh-al-menu-note">' + escapeHtml(t('album.isCover')) + '</p>'
                : '') +
            items.map(function (item) {
                return '<button type="button" role="menuitem"' +
                    ' class="hh-al-menu-item' + (item.danger ? ' is-danger' : '') + '"' +
                    ' data-album-photo-action="' + item.action + '"' +
                    ' data-album-photo-id="' + escapeHtml(photoId) + '">' +
                    '<i class="' + item.icon + '" aria-hidden="true"></i>' +
                    '<span>' + escapeHtml(item.label) + '</span>' +
                '</button>';
            }).join('');

        elements.photoMenu.classList.remove('hidden');
        elements.photoMenu.dataset.for = photoId;
        if (button) button.setAttribute('aria-expanded', 'true');
    }

    function closePhotoMenu() {
        elements.photoMenu.classList.add('hidden');
        elements.photoMenu.innerHTML = '';
        delete elements.photoMenu.dataset.for;

        elements.visitBody.querySelectorAll('[data-album-photo-menu]').forEach(function (button) {
            button.setAttribute('aria-expanded', 'false');
        });
    }

    // ==========================================================
    // O VISUALIZADOR (ponto 18)
    //
    // Sem biblioteca nenhuma: uma imagem, um contador, as setas e
    // um gesto. Carregar uma dependência para deslizar entre três
    // fotografias custava mais do que resolvia.
    // ==========================================================
    function openViewer(index) {
        const data = album();
        if (!data || !data.photos.length) return;

        viewerIndex = Math.max(0, Math.min(index, data.photos.length - 1));
        elements.viewer.classList.remove('hidden');
        elements.viewer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('hh-no-scroll');
        renderViewer();
        elements.viewerClose.focus();
    }

    function closeViewer() {
        viewerIndex = null;
        elements.viewer.classList.add('hidden');
        elements.viewer.setAttribute('aria-hidden', 'true');
        // A página do álbum continua aberta por trás e mantém o
        // bloqueio de scroll — só o tiramos ao fechar tudo.
        if (currentId === null) document.body.classList.remove('hh-no-scroll');
    }

    function renderViewer() {
        const data = album();
        if (!data || viewerIndex === null) return;

        const photo = data.photos[viewerIndex];
        if (!photo) { closeViewer(); return; }

        elements.viewerImg.src = photoSrc(photo);
        elements.viewerImg.alt = photoAlt(viewerIndex, (data.monument || {}).name || '');

        elements.viewerCount.textContent = t('album.photoOf', {
            n: viewerIndex + 1,
            total: data.photos.length
        });

        const date = safe(function () {
            return sources.formatLongDate(photo.createdAt);
        }, '');
        elements.viewerDate.textContent = date;
        elements.viewerDate.hidden = !date;

        elements.viewerPending.hidden = !photo.pending;

        const many = data.photos.length > 1;
        elements.viewerPrev.hidden = !many;
        elements.viewerNext.hidden = !many;
    }

    function stepViewer(delta) {
        const data = album();
        if (!data || viewerIndex === null || !data.photos.length) return;

        const total = data.photos.length;
        viewerIndex = (viewerIndex + delta + total) % total;
        renderViewer();
    }

    // ==========================================================
    // O EDITOR DA MEMÓRIA (pontos 20, 21, 23)
    //
    // Só existe depois de uma acção explícita. As etiquetas vivem
    // aqui dentro, como parte da memória — não numa caixa à parte.
    // ==========================================================
    function openEditor() {
        const data = album();
        if (!data) return;

        draftTags = data.tags.slice();

        elements.editorInput.value = data.note || '';
        renderEditorTags();

        elements.editor.classList.remove('hidden');
        elements.editor.setAttribute('aria-hidden', 'false');
        closeTopMenu();

        // Sem foco automático em ecrãs de toque: o teclado a subir
        // sozinho tapava a pergunta que se acabou de fazer.
        if (!('ontouchstart' in window)) elements.editorInput.focus();
    }

    function closeEditor() {
        elements.editor.classList.add('hidden');
        elements.editor.setAttribute('aria-hidden', 'true');
        draftTags = [];
    }

    function isEditorOpen() {
        return !elements.editor.classList.contains('hidden');
    }

    function renderEditorTags() {
        const catalog = safe(sources.getTagCatalog, []);

        elements.editorTags.innerHTML = catalog.map(function (tag) {
            const on = draftTags.indexOf(tag.id) !== -1;
            return '<button type="button" class="hh-al-tag' + (on ? ' is-on' : '') + '"' +
                ' data-album-tag="' + escapeHtml(tag.id) + '"' +
                ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
                '<i class="' + tag.icon + '" aria-hidden="true"></i>' +
                '<span>' + escapeHtml(t(tag.key)) + '</span>' +
            '</button>';
        }).join('');
    }

    function toggleDraftTag(id) {
        const at = draftTags.indexOf(id);
        if (at === -1) draftTags.push(id);
        else draftTags.splice(at, 1);
        renderEditorTags();
    }

    function submitEditor() {
        if (!handlers.onSaveMemory) return;
        handlers.onSaveMemory(elements.editorInput.value, draftTags.slice());
        closeEditor();
    }

    // ==========================================================
    // Aviso discreto (ponto 17)
    //
    // Pequeno, e só. A celebração grande pertence à descoberta, ao
    // nível, à zona, à medalha e à jornada.
    // ==========================================================
    function toast(message) {
        if (!message) return;

        elements.toast.textContent = message;
        elements.toast.classList.remove('hidden');
        elements.toast.classList.add('is-on');

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            elements.toast.classList.remove('is-on');
            toastTimer = setTimeout(function () {
                elements.toast.classList.add('hidden');
            }, 250);
        }, TOAST_MS);
    }

    // ==========================================================
    // Links assinados
    //
    // A página pinta-se de imediato com o que tem; as fotografias
    // que vivem no Storage recebem o link a seguir. Se a página
    // entretanto mudou de monumento, nada é pintado.
    // ==========================================================
    function hydrate(monumentId) {
        const data = album();
        if (!data) return;

        const paths = data.photos
            .filter(function (photo) { return !!photo.path && !signedUrls[photo.path]; })
            .map(function (photo) { return photo.path; });

        const coverPath = data.cover.photo && data.cover.photo.path;
        if (coverPath && !signedUrls[coverPath] && paths.indexOf(coverPath) === -1) {
            paths.push(coverPath);
        }

        if (!paths.length) return;

        Promise.resolve(safe(function () { return sources.getSignedUrls(paths); }, {}))
            .then(function (urls) {
                if (currentId !== monumentId) return;
                if (!urls) return;

                signedUrls = Object.assign({}, signedUrls, urls);
                paintSignedUrls();
            })
            .catch(function () { /* sem links, ficam os espaços */ });
    }

    function paintSignedUrls() {
        elements.page.querySelectorAll('img[data-path]').forEach(function (img) {
            const url = signedUrls[img.dataset.path];
            if (url && img.src !== url) img.src = url;
        });

        if (viewerIndex !== null) renderViewer();
    }

    // ==========================================================
    // Render completo
    // ==========================================================
    function render() {
        const data = album();
        if (!data || !data.monument) return;

        elements.page.dataset.stage = data.stage;

        renderHero(data);
        renderNav(data);
        renderVisit(data);
        renderMemory(data);
        renderStory(data);
        renderSummary(data);
        renderJourney(data);
        renderCta(data);
        renderTopMenu(data);

        // Uma fotografia apagada pode ter fechado o visualizador
        if (viewerIndex !== null) renderViewer();

        watchSections(data);
        paintSignedUrls();
        hydrate(currentId);
    }

    // ==========================================================
    // Abrir e fechar
    // ==========================================================
    function open(monumentId) {
        currentId = monumentId;
        signedUrls = {};
        viewerIndex = null;

        elements.overlay.classList.remove('hidden');
        document.body.classList.add('hh-no-scroll');

        render();

        // Cada álbum abre no princípio da sua própria história
        if (elements.scroll) elements.scroll.scrollTop = 0;
        markTabFirst();

        elements.backBtn.focus();
    }

    function markTabFirst() {
        const first = elements.nav.querySelector('[data-album-tab]');
        if (first) markTab(first.dataset.albumTab);
    }

    function close() {
        closeTopMenu();
        closePhotoMenu();
        closeEditor();
        closeViewer();

        if (spy) { spy.disconnect(); spy = null; }

        currentId = null;
        signedUrls = {};
        elements.overlay.classList.add('hidden');
        document.body.classList.remove('hh-no-scroll');
    }

    function isOpen() {
        return currentId !== null && currentId !== undefined;
    }

    function getMonumentId() {
        return currentId;
    }

    // A próxima fotografia entra com animação (ponto 38)
    function markNewPhoto() {
        animateNextPhoto = true;
    }

    // ==========================================================
    // Ligações
    // ==========================================================
    function runAction(action) {
        closeTopMenu();

        if (action === 'add' && handlers.onAddPhoto) handlers.onAddPhoto();
        else if (action === 'write') openEditor();
        else if (action === 'map' && handlers.onOpenMap) handlers.onOpenMap(currentId);
        else if (action === 'clues' && handlers.onOpenClues) handlers.onOpenClues(currentId);
        else if (action === 'talk' && handlers.onOpenConversation) handlers.onOpenConversation(currentId);
        else if (action === 'retry' && handlers.onRetrySync) handlers.onRetrySync();
    }

    // O nome sobe para a barra quando a capa sai do ecra: em cima
    // dela ja esta escrito em grande, e escreve-lo duas vezes ao
    // mesmo tempo nao ajudava ninguem.
    function watchScroll() {
        if (!elements.scroll || !elements.page) return;

        let frame = null;

        elements.scroll.addEventListener('scroll', function () {
            if (frame) return;
            frame = requestAnimationFrame(function () {
                frame = null;
                const hero = elements.scroll.querySelector('.hh-al-hero');
                const limit = hero ? hero.offsetHeight - 72 : 240;
                elements.page.classList.toggle(
                    'hh-al-scrolled',
                    elements.scroll.scrollTop > Math.max(80, limit)
                );
            });
        }, { passive: true });
    }

    function bind() {
        watchScroll();

        elements.backBtn.addEventListener('click', function () {
            if (handlers.onClose) handlers.onClose();
            else close();
        });

        elements.menuBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleTopMenu();
        });

        // Um clique em qualquer sítio fecha os menus abertos
        elements.page.addEventListener('click', function (event) {
            if (!event.target.closest('.hh-al-menu')) closeTopMenu();
            if (!event.target.closest('.hh-al-photo-menu') &&
                !event.target.closest('#albumPhotoMenu')) {
                closePhotoMenu();
            }
        });

        // Delegação: a página é redesenhada muitas vezes, e ligar
        // os botões um a um deixava ouvintes para trás.
        elements.page.addEventListener('click', function (event) {
            const tab = event.target.closest('[data-album-tab]');
            if (tab) { goToSection(tab.dataset.albumTab); markTab(tab.dataset.albumTab); return; }

            const action = event.target.closest('[data-album-action]');
            if (action) { runAction(action.dataset.albumAction); return; }

            const view = event.target.closest('[data-album-view]');
            if (view) { openViewer(Number(view.dataset.albumView)); return; }

            const menu = event.target.closest('[data-album-photo-menu]');
            if (menu) {
                event.stopPropagation();
                const id = menu.dataset.albumPhotoMenu;
                const already = elements.photoMenu.dataset.for === id &&
                    !elements.photoMenu.classList.contains('hidden');
                closePhotoMenu();
                if (!already) openPhotoMenu(id, menu);
                return;
            }

            const photoAction = event.target.closest('[data-album-photo-action]');
            if (photoAction) {
                const id = photoAction.dataset.albumPhotoId;
                const what = photoAction.dataset.albumPhotoAction;
                closePhotoMenu();

                if (what === 'cover' && handlers.onSetCover) handlers.onSetCover(id);
                if (what === 'remove' && handlers.onDeletePhoto) handlers.onDeletePhoto(id);
            }
        });

        // --- Visualizador ---
        elements.viewerClose.addEventListener('click', closeViewer);
        elements.viewerPrev.addEventListener('click', function () { stepViewer(-1); });
        elements.viewerNext.addEventListener('click', function () { stepViewer(1); });
        elements.viewer.addEventListener('click', function (event) {
            if (event.target === elements.viewer) closeViewer();
        });

        // Deslizar: dois pontos e uma subtracção, sem biblioteca
        let touchX = null;
        elements.viewer.addEventListener('touchstart', function (event) {
            touchX = event.changedTouches[0].clientX;
        }, { passive: true });

        elements.viewer.addEventListener('touchend', function (event) {
            if (touchX === null) return;
            const delta = event.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(delta) < 48) return;
            stepViewer(delta < 0 ? 1 : -1);
        }, { passive: true });

        // --- Editor ---
        elements.memoryEdit.addEventListener('click', openEditor);
        elements.editorCancel.addEventListener('click', closeEditor);
        elements.editorSave.addEventListener('click', submitEditor);
        elements.editor.addEventListener('click', function (event) {
            if (event.target === elements.editor) closeEditor();
        });
        elements.editorTags.addEventListener('click', function (event) {
            const tag = event.target.closest('[data-album-tag]');
            if (tag) toggleDraftTag(tag.dataset.albumTag);
        });

        // --- Teclado ---
        //
        // A ordem é a das camadas: o que está por cima responde
        // primeiro, e nunca se fecham duas coisas de uma vez.
        document.addEventListener('keydown', function (event) {
            if (!isOpen()) return;

            if (event.key === 'Escape') {
                if (!elements.photoMenu.classList.contains('hidden')) { closePhotoMenu(); return; }
                if (!elements.menu.classList.contains('hidden')) { closeTopMenu(); return; }
                if (viewerIndex !== null) { event.stopPropagation(); closeViewer(); return; }
                if (isEditorOpen()) { event.stopPropagation(); closeEditor(); return; }

                event.stopPropagation();
                if (handlers.onClose) handlers.onClose();
                else close();
                return;
            }

            if (viewerIndex === null) return;
            if (event.key === 'ArrowLeft') stepViewer(-1);
            if (event.key === 'ArrowRight') stepViewer(1);
        }, true);
    }

    function init(options) {
        const config = options || {};

        Object.keys(sources).forEach(function (key) {
            if (typeof config[key] === 'function') sources[key] = config[key];
        });

        Object.keys(handlers).forEach(function (key) {
            if (typeof config[key] === 'function') handlers[key] = config[key];
        });

        elements.overlay = document.getElementById('monumentPhotosModal');
        if (!elements.overlay) return;

        elements.page = document.getElementById('albumPage');
        elements.scroll = document.getElementById('albumScroll');
        elements.backBtn = document.getElementById('albumBackBtn');
        elements.menuBtn = document.getElementById('albumMenuBtn');
        elements.menu = document.getElementById('albumMenu');
        elements.photoMenu = document.getElementById('albumPhotoMenu');
        elements.topName = document.getElementById('albumTopName');

        elements.heroImg = document.getElementById('albumHeroImg');
        elements.heroKicker = document.getElementById('albumHeroKicker');
        elements.title = document.getElementById('albumTitle');
        elements.heroZone = document.getElementById('albumHeroZone');
        elements.stamp = document.getElementById('albumStamp');

        elements.nav = document.getElementById('albumNav');

        elements.visitCount = document.getElementById('albumVisitCount');
        elements.visitBody = document.getElementById('albumVisitBody');
        elements.memoryBody = document.getElementById('albumMemoryBody');
        elements.memoryEdit = document.getElementById('albumMemoryEdit');
        elements.storySection = document.getElementById('albumStory');
        elements.storyBody = document.getElementById('albumStoryBody');
        elements.summaryBody = document.getElementById('albumSummaryBody');
        elements.journeyBody = document.getElementById('albumJourneyBody');
        elements.cta = document.getElementById('albumCta');
        elements.toast = document.getElementById('albumToast');

        elements.viewer = document.getElementById('albumViewer');
        elements.viewerImg = document.getElementById('albumViewerImg');
        elements.viewerCount = document.getElementById('albumViewerCount');
        elements.viewerDate = document.getElementById('albumViewerDate');
        elements.viewerPending = document.getElementById('albumViewerPending');
        elements.viewerClose = document.getElementById('albumViewerClose');
        elements.viewerPrev = document.getElementById('albumViewerPrev');
        elements.viewerNext = document.getElementById('albumViewerNext');

        elements.editor = document.getElementById('albumEditor');
        elements.editorInput = document.getElementById('albumEditorInput');
        elements.editorTags = document.getElementById('albumEditorTags');
        elements.editorSave = document.getElementById('albumEditorSave');
        elements.editorCancel = document.getElementById('albumEditorCancel');

        bind();
    }

    return {
        init: init,
        open: open,
        close: close,
        isOpen: isOpen,
        render: render,
        getMonumentId: getMonumentId,
        markNewPhoto: markNewPhoto,
        openEditor: openEditor,
        toast: toast
    };
})();
