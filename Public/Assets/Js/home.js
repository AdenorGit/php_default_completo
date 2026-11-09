/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});