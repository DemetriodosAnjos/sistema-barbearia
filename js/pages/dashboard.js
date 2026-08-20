// js/pages/dashboard.js
import { initHeader } from "./header.js";
import {
  renderCalendar,
  setupModalListeners,
  setupYearSelector,
  openAppointmentModal,
} from "./calendar.js";
import { AuthService } from "../services/auth.service.js";
import { supabaseClient } from "../config/supabase.js";
import { tenantService } from "../services/tenant.service.js";
import { initNovoAgendamentoModal } from "./novoAgendamento.js";

import {
  initWeekNavigation,
  renderWeekView,
  setSemanaModalInstance,
  setSemanaDetailsModalInstance,
} from "./semana.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializa os ouvintes do modal do calendário
  setupModalListeners();

  // Verifica autenticação antes de renderizar a página protegida
  const session = await AuthService.checkSession();

  if (!session) {
    window.location.href = "/login.html";
    return;
  }

  // âncora fixa com a data e hora atuais do sistema (2026)
  const hoje = new Date();
  let activeYear = hoje.getFullYear();
  let activeMonth = hoje.getMonth();
  let currentStartDate = new Date();
  let isWeekViewActive = false;

  // 2. Inicializa o modal de Novo Agendamento (Única instância unificada)
  const novoAgendamentoModalInstance = initNovoAgendamentoModal({
    supabaseClient: supabaseClient,
    session: session,
    onAppointmentCreated: async () => {
      await updateCalendarView(activeYear, activeMonth);
      await loadAppointments();
    },
  });

  // Injeta a função de abertura garantindo o escopo de execução
  setSemanaModalInstance((date, time) => {
    if (
      window.semanaNovoAgendamentoModal &&
      typeof window.semanaNovoAgendamentoModal.open === "function"
    ) {
      window.semanaNovoAgendamentoModal.open(date, time);
    }
  });

  setSemanaDetailsModalInstance((appointmentsArray) => {
    openAppointmentModal(appointmentsArray, activeYear, activeMonth, session);
  });

  // Inicializa o cabeçalho
  initHeader({
    session,
    logoutCallback: async () => {
      await AuthService.signOut();
    },
  });

  // Configura o seletor de anos
  setupYearSelector(activeYear, async (selectedYear) => {
    activeYear = selectedYear;
    const currentYear = hoje.getFullYear();

    if (activeYear === currentYear) {
      currentStartDate = new Date();
    } else {
      currentStartDate = new Date(activeYear, activeMonth, 1);
    }

    if (typeof window.updateWeekStartDate === "function") {
      window.updateWeekStartDate(currentStartDate);
    }

    await updateCalendarView(activeYear, activeMonth);
  });

  // Inicializa o componente de navegação da semana
  initWeekNavigation({
    currentStartDate: currentStartDate,

    onWeekChange: async (newDate, isChecked) => {
      currentStartDate = newDate;
      isWeekViewActive = isChecked;

      if (typeof window.updateWeekStartDate === "function") {
        window.updateWeekStartDate(currentStartDate);
      }

      await updateCalendarView(activeYear, activeMonth);
    },

    onToggleWeekView: async (isChecked, activeDate) => {
      isWeekViewActive = isChecked;

      if (isChecked) {
        currentStartDate =
          activeYear === hoje.getFullYear()
            ? new Date()
            : new Date(activeYear, activeMonth, 1);
      } else if (activeDate) {
        currentStartDate = activeDate;
      }

      if (typeof window.updateWeekStartDate === "function") {
        window.updateWeekStartDate(currentStartDate);
      }

      await updateCalendarView(activeYear, activeMonth);
    },
  });

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

  // Elementos estáticos e carregamentos complementares
  const salonTitle = document.getElementById("salon-title");
  const servicesListEl = document.getElementById("services-list");
  const appointmentsListEl = document.getElementById("appointments-list");

  // Busca o nome do salão
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

  // Função loadServices
  async function loadServices() {
    if (!servicesListEl) return;
    servicesListEl.innerHTML = `
      <div class="spinner-container-inline">
        <div class="spinner-medio"></div>
        <p class="text-muted">Carregando serviços...</p>
      </div>
    `;

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

  // Função loadAppointments
  async function loadAppointments() {
    if (!appointmentsListEl) return;
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

    // (Renderização da lista lateral de agendamentos continua aqui...)
  }

  // Renderização inicial da página
  try {
    await updateCalendarView(activeYear, activeMonth);
    await loadServices();
    await loadAppointments();
  } catch (err) {
    console.error("Erro na inicialização dos dados:", err);
  }
});
