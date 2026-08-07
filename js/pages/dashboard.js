// js/pages/dashboard.js
import { AuthService } from "../services/auth.service.js";
import { supabaseClient } from "../config/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const session = await AuthService.checkSession();
  if (!session) {
    window.location.href = "/login.html";
    return;
  }

  const salonTitle = document.getElementById("salon-title");
  const logoutBtn = document.getElementById("logout-btn");
  const serviceForm = document.getElementById("service-form");
  const servicesListEl = document.getElementById("services-list");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const saveServiceBtn = document.getElementById("save-service-btn");

  let editingId = null;

  // 1. Carrega dados do Salão
  try {
    const { data } = await supabaseClient
      .from("profiles")
      .select("salon_name")
      .eq("id", session.user.id)
      .single();

    if (data) salonTitle.textContent = data.salon_name;
  } catch (err) {
    salonTitle.textContent = "Minha Barbearia";
  }

  // 2. Função para buscar e renderizar os serviços do tenant
  async function loadServices() {
    servicesListEl.innerHTML =
      '<p class="text-muted">Carregando serviços...</p>';

    const { data, error } = await supabaseClient
      .from("services")
      .select("*")
      .eq("tenant_id", session.user.id)
      .order("name", { ascending: true });

    if (error) {
      servicesListEl.innerHTML =
        '<p class="text-muted">Erro ao carregar serviços.</p>';
      return;
    }

    if (data.length === 0) {
      servicesListEl.innerHTML =
        '<p class="text-muted">Nenhum serviço cadastrado ainda.</p>';
      return;
    }

    servicesListEl.innerHTML = data
      .map(
        (service) => `
      <div class="service-item">
        <div class="service-info">
          <h5>${service.name}</h5>
          <p>R$ ${Number(service.price).toFixed(2)} • ${service.duration_minutes} min</p>
        </div>
        <div class="service-actions">
          <button class="btn-icon" onclick="window.editService('${service.id}', '${service.name}', ${service.price}, ${service.duration_minutes})">Editar</button>
          <button class="btn-icon danger" onclick="window.deleteService('${service.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // 3. Salvar ou Atualizar Serviço
  serviceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("service-name").value;
    const price = parseFloat(document.getElementById("service-price").value);
    const duration_minutes = parseInt(
      document.getElementById("service-duration").value,
    );

    saveServiceBtn.disabled = true;

    if (editingId) {
      // Atualizar
      const { error } = await supabaseClient
        .from("services")
        .update({ name, price, duration_minutes })
        .eq("id", editingId)
        .eq("tenant_id", session.user.id);

      if (error) alert("Erro ao atualizar: " + error.message);
      resetForm();
    } else {
      // Inserir novo
      const { error } = await supabaseClient
        .from("services")
        .insert([
          { tenant_id: session.user.id, name, price, duration_minutes },
        ]);

      if (error) alert("Erro ao cadastrar: " + error.message);
      serviceForm.reset();
    }

    saveServiceBtn.disabled = false;
    loadServices();
  });

  // Funções globais para edição e exclusão via clique nos botões da lista
  window.editService = (id, name, price, duration) => {
    editingId = id;
    document.getElementById("service-name").value = name;
    document.getElementById("service-price").value = price;
    document.getElementById("service-duration").value = duration;
    saveServiceBtn.textContent = "Salvar Alterações";
    cancelEditBtn.style.display = "inline-block";
  };

  window.deleteService = async (id) => {
    if (!confirm("Deseja realmente excluir este serviço?")) return;

    const { error } = await supabaseClient
      .from("services")
      .delete()
      .eq("id", id)
      .eq("tenant_id", session.user.id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      loadServices();
    }
  };

  cancelEditBtn.addEventListener("click", () => {
    resetForm();
  });

  function resetForm() {
    editingId = null;
    serviceForm.reset();
    saveServiceBtn.textContent = "Adicionar Serviço";
    cancelEditBtn.style.display = "none";
  }

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await AuthService.signOut();
  });

  // Inicializa lista
  loadServices();
});
