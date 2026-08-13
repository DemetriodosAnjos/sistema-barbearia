// js/components/header.js
import { supabaseClient } from "../config/supabase.js";

export function initHeader({ session, logoutCallback }) {
  // 1. Criação e Injeção do HTML do Header Fixo
  const headerContainer = document.createElement("header");
  headerContainer.className = "dashboard-header fixed-header";
  headerContainer.innerHTML = `
    <div class="header-content">
      <h1 id="salon-title">Carregando salão...</h1>
      <div class="user-profile-section">
        <div class="user-info-badge">
          <svg class="user-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span id="user-masked-email" class="user-email">Carregando...</span>
        </div>
        <button id="logout-btn" class="btn-secondary">Sair</button>
      </div>
    </div>
  `;

  // Insere o header no topo do body (ou substitui o header existente se houver)
  const existingHeader = document.querySelector(".dashboard-header");
  if (existingHeader) {
    existingHeader.replaceWith(headerContainer);
  } else {
    document.body.prepend(headerContainer);
  }

  // 2. Aplica a máscara no email do usuário
  const userEmailSpan = headerContainer.querySelector("#user-masked-email");
  if (session && session.user && session.user.email) {
    userEmailSpan.textContent = maskEmail(session.user.email);
  }

  // 3. Busca o salon_name na tabela profiles do Supabase
  const salonTitleEl = headerContainer.querySelector("#salon-title");
  async function fetchSalonName() {
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("salon_name")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        salonTitleEl.textContent = "Minha Barbearia";
        return;
      }

      salonTitleEl.textContent = data.salon_name || "Minha Barbearia";
    } catch (err) {
      console.error("Erro ao buscar nome do salão:", err);
      salonTitleEl.textContent = "Minha Barbearia";
    }
  }

  fetchSalonName();

  // 4. Vincula a ação de logout
  const logoutBtn = headerContainer.querySelector("#logout-btn");
  if (logoutBtn && typeof logoutCallback === "function") {
    logoutBtn.addEventListener("click", logoutCallback);
  }
}

// Função utilitária para mascarar o e-mail (ex: us*****@email.com)
function maskEmail(email) {
  const [name, domain] = email.split("@");
  if (!domain) return email;

  if (name.length <= 3) {
    return `${name[0]}***@${domain}`;
  }

  const visiblePart = name.substring(0, 3);
  return `${visiblePart}***@${domain}`;
}
