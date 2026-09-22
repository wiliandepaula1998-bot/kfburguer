let carrinho = [];
let total = 0;
let itemAtual = null;

// Monitora de forma direta os cliques na tela inteira (À prova de falhas)
document.addEventListener('click', function(evento) {
    const alvo = evento.target;

    // 1. CLIQUE NO BOTÃO DO GOOGLE LOGIN
    if (alvo.classList.contains('btn-google') || alvo.closest('.btn-google')) {
        alert("🌐 Conectando à API do Google...");
        
        const modalCadastro = document.getElementById('modal-cadastro');
        if (modalCadastro) {
            modalCadastro.style.display = 'flex'; // Abre a janela na tela
        } else {
            console.log("Erro: Não encontrei a caixinha #modal-cadastro no HTML.");
        }
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
