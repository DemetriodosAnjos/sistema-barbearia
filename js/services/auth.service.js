// js/services/auth.service.js
// importação nomeada, { } específica de um arquivo que exporta
// várias coisas
import { supabaseClient } from "../config/supabase.js";

// AuthService está em PascalCase (letra maiúscula) Usado para Classes,
// Construtores, ou Módulos/Serviços globais que funcionam como uma
// "fábrica" ou um agrupamento central de regras de negócio

// AuthService é um objeto que agrupa várias funções importantes de
// autenticação (ele funciona quase como um módulo reutilizável do sistema)
// Ele é um "serviço estrutural importante do sistema, não é uma variável
// comum".
export const AuthService = {
  // Realizar Login
  // Função assíncrona e metodo signIn (metodo criado)
  // a função vai receber do Client (navegador) dados como (email e
  // password), caso os dados sejam diferentes do cadastro, a função
  // dispara a mensagem padrão de erro gerada pelo supabase
  // Se a email e password estiverem corretos, a função retorna "data"
  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    // Palavra chave SE e Lançar/gerar
    if (error) throw error;
    return data;
  },

  // Realizar Cadastro (Sign Up)
  async signUp(email, password, salonName) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,

      //O Supabase exige que, se você quiser enviar dados extras
      // junto com o cadastro, você coloque esses dados dentro de
      // um objeto chamado options, que por sua vez precisa ter uma
      // propriedade chamada data.
      options: {
        data: {
          // Salva metadados do usuário no Auth do Supabase
          salon_name: salonName,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Verificar se há sessão ativa
  // os ( ) estão vazios porque essa função não precisa de nenhuma
  // informação externa da tela para funcionar.
  // os parênteses na definição de uma função servem para receber
  // parâmetros (como o email, password ou salonName...etc)
  async checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    // propriedade específica chamada session (que guarda os detalhes
    // da sessão ativa do usuário, como token, tempo de expiração e
    // dados do usuário). extrair apenas a parte que se refere à sessão
    // Ex: user: { id: "123", email: "exemplo@email.com"}
    return data.session;
  },

  // Logout
  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    // A prevenção de erro serve para impedir que o usuario mude de pagina
    // e continue com uma sessão ativa no servidor
    // previne falhas de estado no navegador.
    if (error) throw error;

    //Desloga o usuário do servidor e força o redirecionamento dele
    // instantaneamente para a tela de login
    window.location.href = "/login.html";
  },
};
