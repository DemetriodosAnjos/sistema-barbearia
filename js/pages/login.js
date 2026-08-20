// js/pages/login.js
import { AuthService } from "../services/auth.service.js";
/* document é um objeto global que representa toda a árvore
 de elementos HTML da página atual (o documento DOM).*/

// addEventListener é, sim, um método nativo do navegador.
// Ele serve para "escutar" eventos que acontecem na página
// (como um clique do mouse, o envio de um formulário ou o
// carregamento da página).

// DOMContentLoaded é o primeiro parâmetro passado para o
// método addEventListener
// No ES6 a arrow function "=>" substitui o termo "function"
document.addEventListener("DOMContentLoaded", async () => {
  // A função verifica a existência de uma sessão ativa no servidor
  // caso exista a função carrega o caminho "/dashboard.html"
  const session = await AuthService.checkSession();
  if (session) {
    window.location.href = "/dashboard.html";

    // return "vazio" interrompe imediatamente a execução da função,
    // evitando que o restante da tela de login continue carregando.
    return;
  }

  // form é a constante criada pelo desenvolvedor
  // document é o objeto global (uma grande estrutura de dados
  // que o navegador cria automaticamente para representar todo
  // o seu documento HTML)
  // getElementById é um método nativo da API do DOM (fornecida pelo
  // navegador através do JavaScript). Responsável por "pescar" um
  // elemento lá no HTML usando o ID dele.
  const form = document.getElementById("auth-form");
  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");
  const submitBtn = document.getElementById("submit-btn");
  const salonGroup = document.getElementById("salon-name-group");
  const toggleText = document.getElementById("toggle-text");
  const salonInput = document.getElementById("salon-name");

  // Essa variável funciona como uma chave de estado que alterna a exibição
  // dos elementos da página (true/false) para gerenciar o modo de
  // login ou de cadastro.
  let isRegistering = false;

  // O JavaScript ativa um "escutador" (addEventListener) que aguarda o
  // evento de "click".
  // Quando o clique acontece, o navegador cria o objeto de evento (e)
  // com todos os detalhes
  // (quem foi clicado, posição do mouse, etc) e executa a Arrow Function
  // (Callback).
  toggleText.addEventListener("click", (e) => {
    // Condicional para garantir que o clique aconteceu especificamente
    // no elemento
    // que possui o id "toggle-mode" dentro do container toggleText.
    if (e.target && e.target.id === "toggle-mode") {
      // Impede o comportamento padrão do link <a>, que seria
      // recarregar/rolar a página.
      e.preventDefault();
      // Operador de inversão: se era true vira false, se era false
      // vira true (o interruptor).
      isRegistering = !isRegistering;

      // Se a variável isRegistering for verdadeira (true), ele executa
      // o primeiro bloco {}
      // e monta a tela de cadastro.
      if (isRegistering) {
        // textContent é uma propriedade usada para alterar o texto puro
        // de um elemento HTML.
        title.textContent = "Criar sua Barbearia";
        subtitle.textContent = "Comece a gerenciar seu negócio agora";
        submitBtn.textContent = "Cadastrar";
        // Torna o grupo do input visível mudando o estilo CSS para "block".
        salonGroup.style.display = "block";
        // Adiciona o atributo required, obrigando o usuário a preencher
        // este campo.
        salonInput.setAttribute("required", "true");
        // innerHTML insere tags HTML vivas (como o link <a>) dentro
        // do elemento.
        toggleText.innerHTML =
          'Já tem uma conta? <a href="#" id="toggle-mode">Entrar</a>';

        // else: Caso contrário (se isRegistering for false), pula o
        // bloco anterior
        // e executa este segundo bloco {}, montando a tela de login.
      } else {
        title.textContent = "Entrar no Sistema";
        subtitle.textContent = "Gerencie sua barbearia de forma simples";
        submitBtn.textContent = "Entrar";
        // Esconde o campo da barbearia mudando o estilo CSS para "none".
        salonGroup.style.display = "none";
        // Remove a obrigação de preenchimento, já que o campo está
        // escondido no login..
        salonInput.removeAttribute("required");
        // é Uma propriedade que permite inserir código HTML vivo dentro de
        // um elemento, e não apenas texto puro. (Ex. <a><div><strong> etc)
        toggleText.innerHTML =
          'Não tem uma conta? <a href="#" id="toggle-mode">Cadastre-se</a>';
      }
    }
  });

  /* 1. Seleciona o elemento 'form' (O Objeto/Elemento) É a referência ao formulário HTML no DOM 
   da tela e adiciona um "ouvinte de eventos"*/
  // 2. Fica aguardando o evento "submit" (quando o usuário tenta enviar o formulário)
  // 3. Define a função como 'async' (assíncrona), permitindo usar o 'await' lá dentro
  // 4. Cria o parâmetro 'e' (event), que carrega os dados e o comportamento do evento do navegador
  // 5. Utiliza a seta gorda '=>' (arrow function) como sintaxe moderna para declarar a função anônima
  form.addEventListener("submit", async (e) => {
    // 1. Interrompe o comportamento padrão do navegador (impedir a página de recarregar)
    e.preventDefault();
    // 2. Busca no HTML o elemento com o ID "email" e extrai o texto que o usuário digitou (.value)
    const email = document.getElementById("email").value;
    // 3. Busca no HTML o elemento com o ID "password" e extrai a senha digitada (.value)
    const password = document.getElementById("password").value;
    // 4. Pega diretamente o valor que já está guardado na variável 'salonInput' do salão (.value)
    const salonName = salonInput.value;

    const loadingOverlay = document.getElementById("loading-overlay");

    console.log(
      "1. O formulário foi submetido. O overlay existe?",
      loadingOverlay,
    );

    console.log(
      "2. Classe hidden removida. O overlay deveria estar visível agora.",
    );

    // 1. Desabilita o botão de envio para evitar múltiplos cliques enquanto o servidor processa
    submitBtn.disabled = true;

    // 1. Exibe o mini-modal de loading centralizado na tela
    loadingOverlay.classList.remove("hidden");

    // 3. Inicia o bloco de tentativa (proteção de código para lidar com operações que podem falhar)
    try {
      // 4. Estrutura condicional 'if': verifica se a variável 'isRegistering' é verdadeira (modo cadastro)
      if (isRegistering) {
        // 5. 'await' pausa a execução até que o método de cadastro assíncrono termine de falar com o servidor
        await AuthService.signUp(email, password, salonName);
        // 6. Exibe uma caixa de alerta nativa do navegador informando o sucesso da operação
        alert("Cadastro realizado com sucesso! Faça o login para continuar.");

        // 7. Altera o estado da aplicação de volta para o modo de login
        isRegistering = false;
        // 8. Limpa todos os campos preenchidos do formulário HTML
        form.reset();
        // 9. Atualiza textos e elementos da interface (DOM) para a tela de login
        title.textContent = "Entrar no Sistema";
        subtitle.textContent = "Gerencie sua barbearia de forma simples";
        submitBtn.textContent = "Entrar";
        salonGroup.style.display = "none";
        salonInput.removeAttribute("required");

        // 10. Altera o HTML interno do texto de alternância para o link de cadastro
        toggleText.innerHTML =
          'Não tem uma conta? <a href="#" id="toggle-mode">Cadastre-se</a>';
      } else {
        // 11. Caso 'isRegistering' seja falso (modo login), executa a autenticação no servidor
        await AuthService.signIn(email, password);
        // 12. Redireciona o navegador do usuário para a página interna do sistema (dashboard)
        // CORREÇÃO: Esconde o overlay manualmente antes de redirecionar
        loadingOverlay.classList.add("hidden");
        window.location.href = "/dashboard.html";
      }
    } catch (error) {
      // 13. Se qualquer erro acontecer dentro do bloco 'try', o código pula para cá e exibe o erro
      alert(`Erro: ${error.message}`);
    } finally {
      // 14. O bloco 'finally' roda SEMPRE (deu certo ou deu erro): reabilita o botão e ajusta seu texto
      submitBtn.disabled = false;
      submitBtn.textContent = isRegistering ? "Cadastrar" : "Entrar";
      loadingOverlay.classList.add("hidden");
    }
  });
});
