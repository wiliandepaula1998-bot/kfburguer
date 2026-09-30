let carrinho = [];
let total = 0;
let itemAtual = null;

// Monitora de forma direta os cliques na tela inteira (À prova de falhas)
document.addEventListener('click', function(evento) {
    const alvo = evento.target;

    // 1. CLIQUE NO BOTÃO DO GOOGLE LOGIN
    if (alvo.classList.contains('btn-google') || alvo.closest('.btn-google')) // --- CONFIGURAÇÃO REAL DO LOGIN DO GOOGLE ---
window.onload = function () {
    // Inicializa o componente do Google
    google.accounts.id.initialize({
        client_id: "70123973234-d5tvduu1oudd9q959bi8338307usv9te.apps.googleusercontent.com", // Substitua pela sua chave depois
        callback: handleCredentialResponse
    });

    // Vincula a janela de login oficial ao seu botão do HTML
    document.querySelector('.btn-google').addEventListener('click', () => {
        google.accounts.id.prompt(); // Faz abrir a caixinha oficial de login do Google na tela!
    });
};

// Função que recebe os dados reais da conta após o cliente fazer o login na janela
async function handleCredentialResponse(response) {
    // Decodifica os dados que o Google enviou (JWT Token)
    const dadosDecodificados = parseJwt(response.credential);

    const dadosCliente = {
        googleId: dadosDecodificados.sub,
        nome: dadosDecodificados.given_name,
        sobrenome: dadosDecodificados.family_name,
        email: dadosDecodificados.email
    };

    // Envia os dados para salvar no seu server.js
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

// Função auxiliar para conseguir ler as informações de nome e email vindas do Google
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}


    // 2. CLIQUE NO BOTÃO DE SALVAR O CADASTRO (CLIENTE NOVO)
    if (alvo.id === 'btn-salvar-cadastro') {
        const cpf = document.getElementById('cad-cpf').value;
        const telefone = document.getElementById('cad-telefone').value;
        const endereco = document.getElementById('cad-endereco').value;

        if (!cpf || !telefone || !endereco) {
            alert("⚠️ Por favor, preencha todos os campos!");
            return;
        }

        alert("💾 Dados salvos com sucesso!");
        
        const modalCadastro = document.getElementById('modal-cadastro');
        if (modalCadastro) modalCadastro.style.display = 'none'; // Esconde a janela
        
        const caixaAuth = document.querySelector('.auth-section');
        if (caixaAuth) {
            caixaAuth.innerHTML = `<h3 style="color: #f2c811;">✅ Logado como Marcos Silva</h3><p style="margin:5px 0 0 0; color:#aaa; font-size:0.95rem;">Entregar em: ${endereco}</p>`;
        }
    }

    // 3. CLIQUE EM QUALQUER BOTÃO DE ADICIONAR LANCHE DO CARDÁPIO
    if (alvo.classList.contains('btn-add') || alvo.innerText.trim() === "Adicionar") {
        const cardCompleto = alvo.closest('.produto-card');
        if (!cardCompleto) return;

        const nome = cardCompleto.querySelector('h3').innerText;
        const descricao = cardCompleto.querySelector('p').innerText;
        const precoTexto = cardCompleto.querySelector('.preco').innerText;
        const imagemFundo = window.getComputedStyle(cardCompleto).backgroundImage;

        itemAtual = {
            nome: nome,
            preco: parseFloat(precoTexto.replace('R\$', '').replace(',', '.').trim())
        };

        // Injeta os dados dentro do pop-up
        document.getElementById('modal-nome').innerText = nome;
        document.getElementById('modal-descricao').innerText = descricao;
        document.getElementById('modal-preco').innerText = precoTexto;
        document.getElementById('modal-imagem').style.backgroundImage = imagemFundo;

        const modalProduto = document.getElementById('modal-produto');
        if (modalProduto) modalProduto.style.display = 'flex'; // Abre o pop-up com a foto
    }

    // 4. CLIQUE NO BOTÃO (X) PARA FECHAR AS JANELAS FLUTUANTES
    if (alvo.classList.contains('fechar-modal')) {
        const modalProduto = document.getElementById('modal-produto');
        if (modalProduto) modalProduto.style.display = 'none';
        
        const modalCadastro = document.getElementById('modal-cadastro');
        if (modalCadastro) modalCadastro.style.display = 'none';
    }

    // 5. CLIQUE NO BOTÃO DE CONFIRMAR DENTRO DO POP-UP DO HAMBÚRGUER
    if (alvo.id === 'btn-confirmar-add' || alvo.innerText.trim() === "Confirmar") {
        if (itemAtual) {
            carrinho.push(itemAtual);
            total += itemAtual.preco;
            
            const modalProduto = document.getElementById('modal-produto');
            if (modalProduto) modalProduto.style.display = 'none';
            
            alert(`🎉 ${itemAtual.nome} confirmado no carrinho!\nTotal atual: R$ ${total.toFixed(2).replace('.', ',')}`);
        }
    }
});
