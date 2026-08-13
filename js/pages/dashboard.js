// js/pages/dashboard.js
import { initHeader } from "./header.js";
import {
  renderCalendar,
  setupModalListeners,
  setupYearSelector,
} from "./calendar.js";
import { AuthService } from "../services/auth.service.js";
import { supabaseClient } from "../config/supabase.js";
import { tenantService } from "../services/tenant.service.js";
import { initNovoAgendamentoModal } from "./novoAgendamento.js";
import { initWeekNavigation, renderWeekView } from "./semana.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializa os ouvintes do modal do calendário
  setupModalListeners();

  // 2. Validação de Sessão
  const session = await AuthService.checkSession();
  if (!session) {
    window.location.href = "/login.html";
    return;
  }

  // 3. Inicializa o Header Fixo
  initHeader({
    session,
    logoutCallback: async () => {
      await AuthService.signOut();
    },
  });

  // 4. Estados globais do dashboard
  const hoje = new Date();
  let activeYear = hoje.getFullYear();
  let activeMonth = hoje.getMonth();
  let currentStartDate = new Date();
  let isWeekViewActive = false;

  // Função central para atualizar a visualização do calendário
  async function updateCalendarView(year, month) {
    try {
      const appointments = await tenantService.getAppointments();

      if (isWeekViewActive) {
        renderWeekView(currentStartDate, supabaseClient, appointments);
      } else {
        renderCalendar(appointments, year, month, session);
      }
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    }
  }

  // 5. Configura os botões e checkbox da semana
  initWeekNavigation({
    currentStartDate,
    onWeekChange: (newDate, isChecked) => {
      currentStartDate = newDate;
      isWeekViewActive = isChecked;
      updateCalendarView(activeYear, activeMonth);
    },
    onToggleWeekView: (isChecked, activeDate) => {
      isWeekViewActive = isChecked;
      currentStartDate = activeDate;
      updateCalendarView(activeYear, activeMonth);
    },
  });

  // 6. Inicialização do Calendário e Seletor de Anos
  try {
    await updateCalendarView(activeYear, activeMonth);

    setupYearSelector(activeYear, async (selectedYear) => {
      activeYear = selectedYear;
      await updateCalendarView(activeYear, activeMonth);
    });
  } catch (err) {
    console.error("Erro ao inicializar o calendário:", err);
  }

  // 7. Inicializa o modal de novo agendamento
  const novoAgendamentoModal = initNovoAgendamentoModal({
    supabaseClient,
    session,
    onAppointmentCreated: async () => {
      window.location.reload();
    },
  });

  window.globalNovoAgendamentoModal = novoAgendamentoModal;

  // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
  const salonTitle = document.getElementById("salon-title");
  const logoutBtn = document.getElementById("logout-btn");
  const serviceForm = document.getElementById("service-form");
  const servicesListEl = document.getElementById("services-list");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const saveServiceBtn = document.getElementById("save-service-btn");
  const appointmentsListEl = document.getElementById("appointments-list");

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

    // Modal Detalhes do Apontamento
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

  // 3. Buscar e renderizar agendamentos
  async function loadAppointments() {
    appointmentsListEl.innerHTML =
      '<p class="text-muted">Carregando agendamentos...</p>';

    const { data, error } = await supabaseClient
      .from("appointments")
      .select(
        `
      id,
      client_name,
      client_phone,
      appointment_date,
      appointment_time,
      status,
      services (name, price)
    `,
      )
      .eq("tenant_id", session.user.id)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      appointmentsListEl.innerHTML =
        '<p class="text-muted">Erro ao carregar agendamentos.</p>';
      return;
    }

    if (data.length === 0) {
      appointmentsListEl.innerHTML =
        '<p class="text-muted">Nenhum agendamento encontrado.</p>';
      return;
    }

    appointmentsListEl.innerHTML = data
      .map((appt) => {
        const [year, month, day] = appt.appointment_date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        const serviceName = appt.services
          ? appt.services.name
          : "Serviço removido";
        const servicePrice = appt.services
          ? `• R$ ${Number(appt.services.price).toFixed(2)}`
          : "";
        // lista de Agendamentos Futuros
        return `
          <div class="service-item">
            <div class="service-info">
              <h5>${appt.client_name} (${appt.client_phone})</h5>
              <p><strong>${serviceName}</strong> ${servicePrice} — 📅 ${formattedDate} às ${appt.appointment_time}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Função global para cancelar/excluir agendamento
  window.cancelAppointment = async (id) => {
    if (!confirm("Deseja realmente cancelar este agendamento?")) return;

    const loadingModal = document.getElementById("loading-modal");
    const loadingText = document.getElementById("loading-text");

    if (loadingText) loadingText.textContent = "Excluindo agendamento...";
    if (loadingModal) {
      loadingModal.classList.remove("hidden");
      loadingModal.style.display = "flex";
    }

    try {
      const { error } = await supabaseClient
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("tenant_id", session.user.id);

      if (error) throw new Error(error.message);

      window.location.reload();
    } catch (err) {
      console.error("Erro ao cancelar:", err);
      alert("Erro ao cancelar: " + err.message);
    } finally {
      if (loadingModal) {
        loadingModal.classList.add("hidden");
        loadingModal.style.display = "none";
      }
    }
  };

  // 5. Salvar ou Atualizar Serviço
  serviceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("service-name").value;
    const price = parseFloat(document.getElementById("service-price").value);
    const duration_minutes = parseInt(
      document.getElementById("service-duration").value,
    );

    saveServiceBtn.disabled = true;

    if (editingId) {
      const { error } = await supabaseClient
        .from("services")
        .update({ name, price, duration_minutes })
        .eq("id", editingId)
        .eq("tenant_id", session.user.id);

      if (error) alert("Erro ao atualizar: " + error.message);
      resetForm();
    } else {
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

  // Funções globais de serviço
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

  // Ouve o evento global disparado após criar, editar ou excluir um agendamento
  window.addEventListener("appointmentUpdated", () => {
    if (typeof loadAppointments === "function") {
      loadAppointments();
    }
  });

  // Inicialização das funções da tela pertinentes ao dashboard principal
  loadServices();
  loadAppointments();
});
