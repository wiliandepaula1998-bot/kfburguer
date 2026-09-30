// =========================================================================
// 1. VARIÁVEIS GLOBAIS E CONTROLE DE ESTADO
// =========================================================================
let carrinho = [];
let totalCarrinho = 0;
let usuarioLogado = null;

// =========================================================================
// 2. INTEGRAÇÃO REAL DO LOGIN DO GOOGLE
// =========================================================================
window.onload = function () {
    google.accounts.id.initialize({
        // ⚠️ ATENÇÃO: Substitua o texto abaixo pelo seu Client ID numérico do Google Cloud
        client_id: "70123973234-d5tvduu1oudd9q959bi8338307usv9te.apps.googleusercontent.com", 
        callback: handleCredentialResponse
    });
};

// Função disparada automaticamente pelo Google após o cliente selecionar a conta
async function handleCredentialResponse(response) {
    // Decodifica os dados criptografados trazidos pelo Google (JWT Token)
    const dadosDecodificados = parseJwt(response.credential);

    const dadosCliente = {
        googleId: dadosDecodificados.sub,
        nome: dadosDecodificados.given_name,
        sobrenome: dadosDecodificados.family_name,
        email: dadosDecodificados.email
    };

    // Envia o perfil criado para o seu backend (server.js) salvar no arquivo JSON
    const resposta = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCliente)
    });

    const resultado = await resposta.json();
    
    if (resultado.login) {
        usuarioLogado = resultado.usuario;
        alert(`Olá ${usuarioLogado.nome}! Seu perfil único da KF Burguer foi carregado.`);
        mostrarPainelPerfil();
    }
}

// Função auxiliar obrigatória para conseguir ler o nome e email vindos do Google
function parseJwt(token) {
    var base64Url = token.split('.');
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Reescreve a seção do topo com o painel do cliente logado e inputs de endereço
function mostrarPainelPerfil() {
    const authSection = document.querySelector('.auth-section');
    if (!authSection) return;

    authSection.innerHTML = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; border: 1px solid #f3be22; max-width: 400px; margin: 0 auto; text-align: left;">
            <h3 style="color: #f3be22; margin-bottom: 10px;">👤 Cliente: ${usuarioLogado.nome} ${usuarioLogado.sobrenome}</h3>
            <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 15px;">Preencha o local de entrega em Conselheiro Pena:</p>
            
            <label style="font-size: 0.8rem; color: #f3be22;">Endereço de Entrega:</label>
            <input type="text" id="end-entrega" placeholder="Rua, Número, Bairro e Referência" value="${usuarioLogado.enderecoCompleto || ''}" style="width:100%; margin: 5px 0 15px 0; padding: 10px; background: #222; color: #fff; border: 1px solid #333; border-radius: 6px;">
            
            <label style="font-size: 0.8rem; color: #f3be22;">CPF (Opcional):</label>
            <input type="text" id="cpf-cliente" placeholder="000.000.000-00" value="${usuarioLogado.cpf || ''}" style="width:100%; margin: 5px 0 15px 0; padding: 10px; background: #222; color: #fff; border: 1px solid #333; border-radius: 6px;">
            
            <button id="btn-salvar-perfil" style="width: 100%; background: #f3be22; color: #000; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.9rem;">Salvar e Confirmar Dados</button>
        </div>
    `;
}

// =========================================================================
// 3. MONITORAMENTO DE CLIQUES INTELIGENTE (À PROVA DE FALHAS)
// =========================================================================
document.addEventListener('click', function(evento) {
    const alvo = evento.target;

    // A. CLIQUE NO BOTÃO ENTRAR COM O GOOGLE
    if (alvo.classList.contains('btn-google') || alvo.closest('.btn-google')) {
        // Dispara a janela nativa do Google para escolha de e-mails
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                google.accounts.id.prompt(); // Força abertura se houver bloqueio de pop-up
            }
        });
        return;
    }

    // B. CLIQUE NO BOTÃO DE SALVAR DADOS DO PERFIL
    if (alvo.id === 'btn-salvar-perfil') {
        const enderecoCompleto = document.getElementById('end-entrega').value;
        const cpf = document.getElementById('cpf-cliente').value;

        fetch('/api/usuario/perfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enderecoCompleto, cpf })
        })
        .then(res => res.json())
        .then(dadosAtualizados => {
            if (dadosAtualizados.sucesso) {
                usuarioLogado = dadosAtualizados.usuario;
                alert('Dados de entrega salvos no seu perfil com sucesso!');
            }
        })
        .catch(err => console.error("Erro ao salvar perfil:", err));
        return;
    }

    // C. CLIQUE EM QUALQUER BOTÃO DE ADICIONAR (PRODUTOS, MOLHOS OU ADICIONAIS)
    if (alvo.classList.contains('btn-add') || alvo.classList.contains('btn-add-mini')) {
        const elementoProduto = alvo.closest('.produto-overlay, .item-simples');
        if (!elementoProduto) return;

        // Captura o nome do item
        let nomeProduto = elementoProduto.querySelector('h3') ? elementoProduto.querySelector('h3').innerText : elementoProduto.querySelector('span').innerText;
        
        // Captura o preço ou assume o valor padrão de R\$ 2,00 para os seus molhos extras
        let precoTexto = elementoProduto.querySelector('.preco') ? elementoProduto.querySelector('.preco').innerText : "R\$ 2,00";
        let preco = parseFloat(precoTexto.replace('R\$', '').replace(',', '.').trim());

        // Adiciona ao array do carrinho
        carrinho.push({ nome: nomeProduto, preco: preco });
        totalCarrinho += preco;

        atualizarInterfaceCarrinho();
        return;
    }
});

// =========================================================================
// 4. LÓGICA VISUAL DO CARRINHO DE COMPRAS
// =========================================================================
function atualizarInterfaceCarrinho() {
    const containerCarrinho = document.getElementById('carrinho-flutuante');
    const listaItens = document.getElementById('carrinho-itens');
    const campoTotal = document.getElementById('carrinho-total');

    if (containerCarrinho) containerCarrinho.style.display = 'block';
    
    if (listaItens) {
        listaItens.innerHTML = carrinho.map(item => `
            <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 4px;">
                <span>${item.nome}</span>
                <span style="color: #f3be22; font-weight: bold;">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
            </li>
        `).join('');
    }
    
    if (campoTotal) campoTotal.innerText = totalCarrinho.toFixed(2).replace('.', ',');
}

// =========================================================================
// 5. FINALIZAÇÃO DO PEDIDO (MÉTODO ENVIAR PARA BACKEND)
// =========================================================================
async function finalizarCompra() {
    if (!usuarioLogado) {
        alert('Atenção: Faça login com sua conta Google no topo da página antes de fechar o pedido!');
        return;
    }

    const enderecoInput = document.getElementById('end-entrega');
    if (!usuarioLogado.enderecoCompleto && (!enderecoInput || !enderecoInput.value)) {
        alert('Por favor, preencha e salve seu Endereço de Entrega no painel do topo antes de finalizar!');
        return;
    }

    const metodoPagamento = document.getElementById('metodo-pagamento').value;

    const resposta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            itens: carrinho,
            total: totalCarrinho,
            metodoPagamento: metodoPagamento
        })
    });

    const resultado = await resposta.json();
    if (resultado.sucesso) {
        alert(`🍔 PEDIDO CONFIRMADO!\n\nCliente: ${usuarioLogado.nome}\nForma de pagamento: ${metodoPagamento}\nEntregaremos em: ${usuarioLogado.enderecoCompleto || enderecoInput.value}\n\nObrigado por pedir na KF Burguer!`);
        
        // Limpa o estado do carrinho após finalizar com sucesso
        carrinho = [];
        totalCarrinho = 0;
        const containerCarrinho = document.getElementById('carrinho-flutuante');
        if (containerCarrinho) containerCarrinho.style.display = 'none';
    }
}
