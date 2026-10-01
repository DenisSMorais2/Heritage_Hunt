// ============================================================
// Heritage Hunt CV — arrastar uma folha para a fechar
//
// AS FOLHAS NAO TINHAM SAIDA
//
// `.hh-sheet` tem `pointer-events: none` no fundo, para o mapa
// continuar manipulavel por tras (ponto 13). O efeito colateral e
// que o toque fora NUNCA chega ao fundo — o `closeSheet` ligado a
// esse toque era codigo morto. Sobrava a tecla Escape, que num
// telemovel nao existe.
//
// Resultado: aberta a folha de opcoes, a unica saida era escolher
// uma opcao. Quem so queria ver o que havia ficava preso.
//
// A PEGA JA ESTAVA DESENHADA
//
// `.hh-sheet__grip` existe desde sempre no topo de cada folha.
// Uma pega e uma PROMESSA: diz "arrasta-me". Estava a prometer
// um gesto que nao acontecia. Este ficheiro cumpre a promessa.
//
// PORQUE E PARTILHADO
//
// Sao quatro folhas em tres modulos diferentes, cada um com o seu
// `closeSheet`. O gesto e o mesmo nas quatro; o que muda e so o
// que fazer no fim. Por isso entra um `onClose` e nao se duplica
// nada — cada modulo continua dono do seu fecho.
// ============================================================

const SHEET_DRAG = {
    // Abaixo disto volta para cima. E uma fraccao da altura da
    // propria folha, com tecto: numa folha alta, 28% seriam
    // centimetros de arrasto antes de ela ceder.
    CLOSE_RATIO: 0.28,
    CLOSE_MAX: 96,

    // Um impulso rapido fecha mesmo sem percorrer a distancia —
    // e o gesto de quem ja sabe o que quer.
    FLICK_SPEED: 0.5   // px por ms
};

const Sheets = (function () {
    'use strict';

    // Liga o gesto a uma folha. Chamar uma vez, no arranque do
    // modulo dono dela.
    function enableDrag(sheet, onClose) {
        if (!sheet || sheet.__dragReady) return;

        const panel = sheet.querySelector('.hh-sheet__panel');
        if (!panel) return;

        sheet.__dragReady = true;

        let dragging = false;
        let startY = 0;
        let startedAt = 0;
        let dy = 0;

        // O conteudo pode crescer (o perfil tem mais do que a
        // folha de opcoes). Sempre que a folha abre, remede-se: se
        // nao houver nada a deslizar, o dedo pode agarrar o painel
        // todo; se houver, so a pega — senao o gesto roubava o
        // scroll a quem queria ler.
        const observer = new MutationObserver(function () {
            if (sheet.classList.contains('is-open')) refreshTouchAction();
        });
        observer.observe(sheet, { attributes: true, attributeFilter: ['class'] });

        function refreshTouchAction() {
            const scrollable = panel.scrollHeight > panel.clientHeight + 1;
            panel.style.touchAction = scrollable ? 'pan-y' : 'none';
        }

        function start(event) {
            if (event.button != null && event.button !== 0) return;

            // Com conteudo por deslizar, so se arrasta de cima:
            // a meio da lista o dedo esta a ler, nao a fechar.
            const scrollable = panel.scrollHeight > panel.clientHeight + 1;
            const fromGrip = !!(event.target && event.target.closest('.hh-sheet__grip'));
            if (scrollable && !fromGrip && panel.scrollTop > 0) return;

            dragging = true;
            startY = event.clientY;
            startedAt = event.timeStamp || Date.now();
            dy = 0;

            panel.style.transition = 'none';
            sheet.classList.add('is-dragging');

            try { panel.setPointerCapture(event.pointerId); } catch (e) { /* rato antigo */ }
        }

        function move(event) {
            if (!dragging) return;

            const bruto = event.clientY - startY;

            // Para cima resiste em vez de seguir: a folha nao sobe
            // acima do sitio dela, mas o gesto continua a
            // responder ao dedo.
            dy = bruto < 0 ? bruto / 3 : bruto;

            panel.style.transform = 'translateY(' + dy + 'px)';
            if (event.cancelable) event.preventDefault();
        }

        function end(event) {
            if (!dragging) return;
            dragging = false;

            sheet.classList.remove('is-dragging');
            try { panel.releasePointerCapture(event.pointerId); } catch (e) { /* idem */ }

            const decorrido = Math.max(1, (event.timeStamp || Date.now()) - startedAt);
            const velocidade = dy / decorrido;

            const limite = Math.min(SHEET_DRAG.CLOSE_MAX, panel.offsetHeight * SHEET_DRAG.CLOSE_RATIO);
            const fecha = dy > limite || (dy > 12 && velocidade > SHEET_DRAG.FLICK_SPEED);

            // A transicao volta ANTES de mexer no transform, para
            // os dois caminhos — fechar e voltar — animarem a
            // partir de onde o dedo largou, e nao saltarem.
            panel.style.transition = '';
            panel.style.transform = '';

            if (fecha && typeof onClose === 'function') onClose();
        }

        panel.addEventListener('pointerdown', start);
        panel.addEventListener('pointermove', move, { passive: false });
        panel.addEventListener('pointerup', end);
        panel.addEventListener('pointercancel', end);

        refreshTouchAction();
    }

    return { enableDrag: enableDrag };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Sheets: Sheets, SHEET_DRAG: SHEET_DRAG };
}
