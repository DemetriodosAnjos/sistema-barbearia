// Operadores Aritméticos

// Adição (+)
const precoProduto = 150.75;
const taxaEntrega = 15.0;
const valorTotal = precoProduto + taxaEntrega;
console.log(valorTotal); // 165.75

const wordOne = "Olá";
const wordTwo = "Mundo!";
const result = wordOne + wordTwo;
console.log(result);

// Subtração (-)
const estoqueInicial = 50;
const quantidadeVendida = 12;
const estoqueAtual = estoqueInicial - quantidadeVendida;
console.log(estoqueAtual); // 38

// Multiplicação (*)
const precoOriginal = 200;
const fatorDesconto = 0.85;
const precoComDesconto = precoOriginal * fatorDesconto;
console.log(precoComDesconto); // 170

// Divisao
const valorTotalCompra = 1200;
const numeroParcelas = 10;
const valorParcela = valorTotalCompra / numeroParcelas;

console.log(valorParcela); // 120

// Resto da Divisão (% - Módulo)
const numero = 7;
const ehPar = numero / 2 === 0;
console.log(ehPar); // false

// Exponenciação (**)
const base = 2;
const expoente = 3;
const resultado = base ** expoente; // Equivalente a 2*2*2
console.log(resultado);

// Incremento (++) e Decremento (--)
let tentativas = 3;
tentativas--; // Decrementa 1 unidade
console.log(tentativas); // 2
