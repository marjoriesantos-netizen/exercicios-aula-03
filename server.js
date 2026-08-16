const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Permite receber dados em JSON
app.use(express.json());


// ========================================
// FUNÇÕES PARA PRODUTOS
// ========================================

function lerProdutos() {
  const dados = fs.readFileSync("./data/products.json", "utf-8");
  return JSON.parse(dados);
}

function salvarProdutos(produtos) {
  fs.writeFileSync(
    "./data/products.json",
    JSON.stringify(produtos, null, 2)
  );
}


// ========================================
// FUNÇÕES PARA USUÁRIOS
// ========================================

function lerUsuarios() {
  const dados = fs.readFileSync("./data/users.json", "utf-8");
  return JSON.parse(dados);
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(
    "./data/users.json",
    JSON.stringify(usuarios, null, 2)
  );
}


// ========================================
// EXERCÍCIO 1 E 3
// GET /products
// GET /products?min=10
// ========================================

app.get("/products", (req, res) => {
  const produtos = lerProdutos();

  // Verifica se foi informado o parâmetro min
  const min = req.query.min;

  // Se não informou min, retorna todos os produtos
  if (min === undefined) {
    return res.json(produtos);
  }

  const valorMinimo = Number(min);

  // Verifica se min é realmente um número
  if (isNaN(valorMinimo)) {
    return res.status(400).json({
      mensagem: "O parâmetro min deve ser um número"
    });
  }

  // Filtra produtos com preço maior ou igual ao mínimo
  const produtosFiltrados = produtos.filter(
    (produto) => produto.preco >= valorMinimo
  );

  res.json(produtosFiltrados);
});


// ========================================
// EXERCÍCIO 2
// GET /products/:id
// ========================================

app.get("/products/:id", (req, res) => {
  const produtos = lerProdutos();

  const id = Number(req.params.id);

  const produto = produtos.find(
    (produto) => produto.id === id
  );

  // Se não encontrar o produto
  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  res.json(produto);
});


// ========================================
// EXERCÍCIO 4
// POST /products
// ========================================

app.post("/products", (req, res) => {
  const { nome, preco } = req.body;

  // Verifica se os campos foram enviados
  if (!nome || preco === undefined) {
    return res.status(400).json({
      mensagem: "Os campos nome e preco são obrigatórios"
    });
  }

  // Verifica se preco é número
  if (typeof preco !== "number") {
    return res.status(400).json({
      mensagem: "O preço deve ser um número"
    });
  }

  const produtos = lerProdutos();

  // Cria um novo ID
  const novoId =
    produtos.length > 0
      ? Math.max(...produtos.map((produto) => produto.id)) + 1
      : 1;

  const novoProduto = {
    id: novoId,
    nome: nome,
    preco: preco
  };

  // Adiciona o produto
  produtos.push(novoProduto);

  // Salva no JSON
  salvarProdutos(produtos);

  // Retorna o produto criado
  res.status(201).json(novoProduto);
});


// ========================================
// EXERCÍCIO 5
// POST /users
// Rejeitar email duplicado
// ========================================

app.post("/users", (req, res) => {
  const { nome, email } = req.body;

  // Verifica se os campos foram enviados
  if (!nome || !email) {
    return res.status(400).json({
      mensagem: "Os campos nome e email são obrigatórios"
    });
  }

  const usuarios = lerUsuarios();

  // Procura se o email já existe
  const emailExistente = usuarios.find(
    (usuario) => usuario.email === email
  );

  // Se já existir, retorna 409
  if (emailExistente) {
    return res.status(409).json({
      mensagem: "Este email já está cadastrado"
    });
  }

  // Cria novo ID
  const novoId =
    usuarios.length > 0
      ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
      : 1;

  const novoUsuario = {
    id: novoId,
    nome: nome,
    email: email
  };

  usuarios.push(novoUsuario);

  salvarUsuarios(usuarios);

  res.status(201).json(novoUsuario);
});


// ========================================
// EXERCÍCIO 6
// POST /users/batch
// ========================================

app.post("/users/batch", (req, res) => {
  const novosUsuarios = req.body;

  // Verifica se recebeu um array
  if (!Array.isArray(novosUsuarios)) {
    return res.status(400).json({
      mensagem: "O corpo da requisição deve ser um array"
    });
  }

  const usuarios = lerUsuarios();

  // Verifica emails que já existem
  const emailsExistentes = usuarios.map(
    (usuario) => usuario.email
  );

  const emailDuplicadoNoBanco = novosUsuarios.some(
    (usuario) => emailsExistentes.includes(usuario.email)
  );

  if (emailDuplicadoNoBanco) {
    return res.status(409).json({
      mensagem: "Um ou mais emails já estão cadastrados"
    });
  }

  // Verifica emails repetidos dentro do próprio lote
  const emailsDoLote = novosUsuarios.map(
    (usuario) => usuario.email
  );

  const emailsRepetidosNoLote =
    new Set(emailsDoLote).size !== emailsDoLote.length;

  if (emailsRepetidosNoLote) {
    return res.status(409).json({
      mensagem: "Existem emails duplicados no lote"
    });
  }

  // Cria os IDs dos novos usuários
  let proximoId =
    usuarios.length > 0
      ? Math.max(...usuarios.map((usuario) => usuario.id)) + 1
      : 1;

  const usuariosCriados = novosUsuarios.map((usuario) => {
    const novoUsuario = {
      id: proximoId,
      nome: usuario.nome,
      email: usuario.email
    };

    proximoId++;

    return novoUsuario;
  });

  // Adiciona todos os usuários
  usuarios.push(...usuariosCriados);

  // Salva no JSON
  salvarUsuarios(usuarios);

  // Retorna os usuários criados
  res.status(201).json(usuariosCriados);
});


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});