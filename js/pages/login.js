// js/pages/login.js
import { AuthService } from "../services/auth.service.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Redireciona se já estiver logado
  const session = await AuthService.checkSession();
  if (session) {
    window.location.href = "/dashboard.html";
    return;
  }

  const form = document.getElementById("auth-form");
  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");
  const submitBtn = document.getElementById("submit-btn");
  const salonGroup = document.getElementById("salon-name-group");
  const toggleText = document.getElementById("toggle-text");
  const salonInput = document.getElementById("salon-name");

  let isRegistering = false;

  // Delegação de evento ou referência fixa para o link de alternância
  toggleText.addEventListener("click", (e) => {
    if (e.target && e.target.id === "toggle-mode") {
      e.preventDefault();
      isRegistering = !isRegistering;

      if (isRegistering) {
        title.textContent = "Criar sua Barbearia";
        subtitle.textContent = "Comece a gerenciar seu negócio agora";
        submitBtn.textContent = "Cadastrar";
        salonGroup.style.display = "block";
        salonInput.setAttribute("required", "true");
        toggleText.innerHTML =
          'Já tem uma conta? <a href="#" id="toggle-mode">Entrar</a>';
      } else {
        title.textContent = "Entrar no Sistema";
        subtitle.textContent = "Gerencie sua barbearia de forma simples";
        submitBtn.textContent = "Entrar";
        salonGroup.style.display = "none";
        salonInput.removeAttribute("required");
        toggleText.innerHTML =
          'Não tem uma conta? <a href="#" id="toggle-mode">Cadastre-se</a>';
      }
    }
  });

  // Manipular envio do formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const salonName = salonInput.value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Processando...";

    try {
      if (isRegistering) {
        await AuthService.signUp(email, password, salonName);
        alert("Cadastro realizado com sucesso! Faça o login para continuar.");

        // Reseta para o modo de login
        isRegistering = false;
        form.reset();
        title.textContent = "Entrar no Sistema";
        subtitle.textContent = "Gerencie sua barbearia de forma simples";
        submitBtn.textContent = "Entrar";
        salonGroup.style.display = "none";
        salonInput.removeAttribute("required");
        toggleText.innerHTML =
          'Não tem uma conta? <a href="#" id="toggle-mode">Cadastre-se</a>';
      } else {
        await AuthService.signIn(email, password);
        window.location.href = "/dashboard.html";
      }
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isRegistering ? "Cadastrar" : "Entrar";
    }
  });
});
