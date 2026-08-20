// Maior que (>) e Menor que (<)
const idadeMinima = 18;
const idadeUsuario = 20;
const podeDirigir = idadeUsuario > idadeMinima;
console.log(podeDirigir); // true

// Maior ou igual a (>=) e Menor ou igual a (<=)
const limiteEstoqueCritico = 5;
const estoqueAtual = 5;
const precisaRepor = estoqueAtual <= limiteEstoqueCritico;
console.log(precisaRepor); // true

// Igualdade Estrita (===) vs. Igualdade Ampla (==)
const idCadastrado = 42;
const idInformado = "42"; // string

console.log(idCadastrado === idInformado); // false (tipos diferentes: Number vs String - Comportamento seguro)
console.log(idCadastrado == idInformado); // true (converteu a string para número por baixo dos panos)

// Desigualdade Estrita (!==) vs. Desigualdade Ampla (!=)
const statusPedido = "cancelado";
const pedidoEmAndamento = statusPedido !== "entregue";
console.log(pedidoEmAndamento); // true
