const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configuração de Sessão para lembrar do cliente que está navegando
app.use(session({
    secret: 'chave-secreta-kfburguer',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.static(__dirname));

// Caminhos dos arquivos de texto que vão funcionar como nosso Banco de Dados Local (JSON)
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

// Funções Auxiliares para ler e escrever os dados guardados
const lerDados = (arquivo) => {
    if (!fs.existsSync(arquivo)) return [];
    const dados = fs.readFileSync(arquivo, 'utf-8');
    return dados ? JSON.parse(dados) : [];
};

const salvarDados = (arquivo, dados) => {
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf-8');
};

// --- ROTAS DO SISTEMA ---

// Página Inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login do Google (Recebe os dados do front-end)
app.post('/api/auth/google', (req, res) => {
    const { googleId, nome, sobrenome, email } = req.body;
    let usuarios = lerDados(USUARIOS_FILE);

    // Procura se o cliente já comprou alguma vez
    let usuario = usuarios.find(u => u.googleId === googleId);

    if (!usuario) {
        // Se for a primeira vez dele, gera um perfil cliente único
        usuario = {
            id: 'cli_' + Date.now(),
            googleId,
            nome,
            sobrenome,
            email,
            enderecoCompleto: '',
            cpf: ''
        };
        usuarios.push(usuario);
        salvarDados(USUARIOS_FILE, usuarios);
    }

    // Guarda o ID do cliente na sessão para o carrinho saber quem ele é
    req.session.usuarioLogadoId = usuario.id;
    res.json({ login: true, usuario });
});

// Rota para atualizar o endereço e CPF do perfil do cliente
app.post('/api/usuario/perfil', (req, res) => {
    const clienteId = req.session.usuarioLogadoId;
    if (!clienteId) return res.status(401).json({ error: 'Faça login primeiro' });

    const { enderecoCompleto, cpf } = req.body;
    let usuarios = lerDados(USUARIOS_FILE);
    
    let index = usuarios.findIndex(u => u.id === clienteId);
    if (index !== -1) {
        usuarios[index].enderecoCompleto = enderecoCompleto;
        usuarios[index].cpf = cpf;
        salvarDados(USUARIOS_FILE, usuarios);
        res.json({ sucesso: true, usuario: usuarios[index] });
    } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
    }
});

// Salvar o Pedido no carrinho (Dinheiro ou Pix)
app.post('/api/pedidos', (req, res) => {
    const clienteId = req.session.usuarioLogadoId;
    if (!clienteId) return res.status(401).json({ error: 'Faça login com o Google para finalizar!' });

    const { itens, total, metodoPagamento } = req.body;
    let pedidos = lerDados(PEDIDOS_FILE);

    const novoPedido = {
        pedidoId: 'ped_' + Date.now(),
        clienteId,
        itens,
        total,
        metodoPagamento,
        data: new Date().toISOString()
    };

    pedidos.push(novoPedido);
    salvarDados(PEDIDOS_FILE, pedidos);

    res.json({ sucesso: true, mensagem: 'Pedido registrado com sucesso no perfil!' });
});

app.listen(PORT, () => {
    console.log(`Servidor KF rodando liso em http://localhost:${PORT}`);
});
