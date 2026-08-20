// Operador E Lógico (&&) (AND)
// exige que todas as condições envolvidas sejam verdadeiras para que o resultado final seja true
const usuarioAutenticado = true;
const assinaturaAtiva = true;

const podeAssistirFilme = usuarioAutenticado && assinaturaAtiva;
console.log(podeAssistirFilme);

// Operador OU Lógico (||)
// (OR) exige que pelo menos uma das condições seja verdadeira para que o resultado seja true
const temCupomAniversario = false;
const temCupomPromocional = true;
const aplicaDesconto = temCupomAniversario || temCupomPromocional;
console.log(aplicaDesconto); // true (basta que um dos cupons seja válido)

// Operador NÃO Lógico (! - Negação)
const usuarioBanido = false;
// Queremos saber se o usuário NÃO está banido para permitir o acesso
const acessoLiberado = !usuarioBanido;
console.log(acessoLiberado); // true (inverteu o false para true)
