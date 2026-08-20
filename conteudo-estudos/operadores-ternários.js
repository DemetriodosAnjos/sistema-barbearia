/* Anatomia e Sintaxe
A estrutura do operador ternário segue esta ordem exata:*/

condicao ? valorSeVerdadeiro : valorSeFalso;

/* A Condição (? antes): É a expressão lógica que será avaliada como verdadeira ou falsa (ex: idade >= 18).
Logo após ela, colocamos um ponto de interrogação.

O Caminho Verdadeiro (: no meio): É o valor ou código retornado caso a condição seja true.
Ele fica posicionado logo antes dos dois-pontos.

O Caminho Falso (: depois): É o valor ou código retornado caso a condição seja false.
Ele fica posicionado logo após os dois-pontos.*/

// Veja como um if/else tradicional de 6 linhas pode ser reescrito em apenas 1 linha com o ternário:
let statusPagamento;
const valorCompra = 150;

if (valorCompra > 100) {
  statusPagamento = "Frete Grátis";
} else {
  statusPagamento = "Frete Pago";
}

// Versão limpa com Operador Ternário
const statusPagamentoTernario =
  valorCompra > 100 ? "Frete Grátis" : "rete Pago";

console.log(statusPagamentoTernario); // "Frete Grátis"

// Outro exemplo
const temNotificacoes = true;

const mensagem = temNotificacoes
  ? "Você tem novas mensagens."
  : "Nenhuma nova notificação no momento.";

console.log(mensagem); // "You have new messages."

/* Boa Prática: Se a sua lógica de negócio possui múltiplos caminhos ou regras complexas encadeadas,
prefira utilizar estruturas tradicionais de if / else if / else ou separar a lógica em funções descritivas.
Reserve o operador ternário estritamente para binários simples (escolha entre duas opções diretas). */
