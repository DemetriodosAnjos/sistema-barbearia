// js/pages/calendar.js

import { supabaseClient } from "../config/supabase.js";
import { tenantService } from "../services/tenant.service.js";
import { initNovoAgendamentoModal } from "./novoAgendamento.js";

// Instância global interna do modal de novo agendamento para o calendário
let calendarNovoAgendamentoModal = null;

// Função auxiliar para gerar e popular o seletor de anos (últimos 5 anos)
export function setupYearSelector(currentYear, onYearChange) {
  let wrapper = document.getElementById("calendar-year-wrapper");

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "calendar-year-wrapper";
    wrapper.className = "calendar-filter-group";

    const label = document.createElement("label");
    label.htmlFor = "calendar-year-select";
    label.textContent = "Ano:";
    label.className = "calendar-year-label";
    label.style.fontSize = "1.1rem";
    label.style.fontWeight = "500";
    label.style.color = "#cbd5e1";
    label.style.marginRight = "4px";
    wrapper.appendChild(label);

    const yearSelect = document.createElement("select");
    yearSelect.id = "calendar-year-select";
    yearSelect.className = "calendar-select";
    wrapper.appendChild(yearSelect);

    const calendarHeader =
      document.querySelector(".calendar-header") ||
      document.getElementById("calendar-days")?.parentNode;
    if (calendarHeader) {
      calendarHeader.prepend(wrapper);
    }
  }

  const yearSelect = document.getElementById("calendar-year-select");
  if (!yearSelect) return;

  yearSelect.innerHTML = "";

  const numberOfYears = 5;
  for (let i = 0; i < numberOfYears; i++) {
    const yearValue = currentYear - i;
    const option = document.createElement("option");
    option.value = yearValue;
    option.textContent = yearValue;

    if (yearValue === currentYear) {
      option.selected = true;
    }

    yearSelect.appendChild(option);
  }

  yearSelect.onchange = (e) => {
    const selectedYear = parseInt(e.target.value, 10);
    if (typeof onYearChange === "function") {
      onYearChange(selectedYear);
    }
  };
}

// Renderização principal do Calendário (Mensal ou Semanal)
export function renderCalendar(
  appointments = [],
  year,
  month,
  session,
  isWeekView = false,
  weekStartDate = new Date(),
) {
  const calendarDays = document.getElementById("calendar-days");
  if (!calendarDays) return;
  calendarDays.innerHTML = "";

  // Inicializa o modal de novo agendamento se houver sessão e ainda não existir
  if (session && !calendarNovoAgendamentoModal) {
    calendarNovoAgendamentoModal = initNovoAgendamentoModal({
      supabaseClient,
      session,
      onAppointmentCreated: async () => {
        const freshAppointments = await tenantService.getAppointments();
        const checkbox = document.getElementById("toggle-week-view");
        renderCalendar(
          freshAppointments,
          year,
          month,
          session,
          checkbox ? checkbox.checked : false,
          weekStartDate,
        );
        window.dispatchEvent(new CustomEvent("appointmentUpdated"));
      },
    });
  }

  // Configura o botão "Novo Agendamento"
  let btnNovoAgendamento = document.getElementById(
    "btn-novo-agendamento-calendar",
  );
  if (!btnNovoAgendamento) {
    const oldBtn =
      document.querySelector(".btn-exibir-mes") ||
      document.getElementById("exibir-mes-inteiro");

    btnNovoAgendamento = document.createElement("button");
    btnNovoAgendamento.id = "btn-novo-agendamento-calendar";
    btnNovoAgendamento.textContent = "Novo Agendamento";
    btnNovoAgendamento.className = "btn-submit";

    if (oldBtn && oldBtn.parentNode) {
      oldBtn.parentNode.replaceChild(btnNovoAgendamento, oldBtn);
    } else {
      const calendarHeader =
        document.querySelector(".calendar-header") || calendarDays.parentNode;
      calendarHeader.prepend(btnNovoAgendamento);
    }

    btnNovoAgendamento.addEventListener("click", () => {
      if (calendarNovoAgendamentoModal) {
        calendarNovoAgendamentoModal.open();
      }
    });
  }

  // SE O MODO SEMANAL ESTIVER ATIVO
  if (isWeekView) {
    renderWeekViewGrid(appointments, weekStartDate, session);
    return;
  }

  // MODO MENSAL TRADICIONAL
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day-cell empty";
    calendarDays.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day-cell";

    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateString = `${year}-${formattedMonth}-${formattedDay}`;

    dayCell.innerHTML = `<span class="day-number">${day}</span>`;

    const dayAppointments = appointments.filter(
      (app) => app.appointment_date === dateString,
    );

    if (dayAppointments.length > 0) {
      dayCell.classList.add("has-appointment");

      const badge = document.createElement("span");
      badge.className = "appointment-badge";
      badge.textContent = `${dayAppointments.length} agendamento(s)`;
      dayCell.appendChild(badge);

      dayCell.addEventListener("click", () => {
        openAppointmentModal(dayAppointments, year, month, session);
      });
    }

    calendarDays.appendChild(dayCell);
  }
}

// Função auxiliar para renderizar a visão semanal com horários das 01:00 às 23:00 e dados do Supabase
function renderWeekViewGrid(appointments, activeStartDate, session) {
  const calendarDaysContainer = document.getElementById("calendar-days");
  if (!calendarDaysContainer) return;

  calendarDaysContainer.innerHTML = "";
  calendarDaysContainer.className = "calendar-week-grid-container"; // Aplica classe se necessário

  // Calcula os 7 dias da semana a partir da data ativa
  const weekDays = [];
  const startOfWeek = new Date(activeStartDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  weekDays.forEach((day) => {
    const dayColumn = document.createElement("div");
    dayColumn.className = "week-day-column";

    const dayHeader = document.createElement("div");
    dayHeader.className = "week-day-header";
    dayHeader.textContent = `${day.toLocaleDateString("pt-BR", { weekday: "short" })} - ${day.getDate()}`;
    dayColumn.appendChild(dayHeader);

    const timeSlotContainer = document.createElement("div");
    timeSlotContainer.className = "time-slots-container";

    // Grade de horários das 01:00 até as 23:00
    for (let hour = 1; hour <= 23; hour++) {
      const hourSlot = document.createElement("div");
      hourSlot.className = "time-slot";
      const formattedHour = String(hour).padStart(2, "0") + ":00";
      const currentIsoDate = day.toISOString().split("T")[0];

      // Filtra agendamento correspondente a este dia e hora exata
      const matchedAppointment = appointments.find((app) => {
        return (
          app.appointment_date === currentIsoDate &&
          app.appointment_time &&
          app.appointment_time.startsWith(String(hour).padStart(2, "0"))
        );
      });

      if (matchedAppointment) {
        hourSlot.classList.add("booked", "has-appointment");
        hourSlot.innerHTML = `
          <span class="slot-time">${formattedHour}</span>
          <div class="appointment-badge">
            <strong>${matchedAppointment.client_name}</strong>
            <small>${matchedAppointment.appointment_time}</small>
          </div>
        `;
        hourSlot.addEventListener("click", () => {
          openAppointmentModal(
            [matchedAppointment],
            day.getFullYear(),
            day.getMonth(),
            session,
          );
        });
      } else {
        hourSlot.innerHTML = `<span class="slot-time">${formattedHour}</span>`;
      }

      timeSlotContainer.appendChild(hourSlot);
    }

    dayColumn.appendChild(timeSlotContainer);
    calendarDaysContainer.appendChild(dayColumn);
  });
}

function openAppointmentModal(
  appointments,
  currentYear,
  currentMonth,
  session,
) {
  const modal = document.getElementById("appointment-modal");
  const detailsContainer = document.getElementById("appointment-details");

  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = "";

  appointments.forEach((app) => {
    const item = document.createElement("div");
    item.className = "appointment-item-modal";
    item.innerHTML = `
            <div id="view-mode-${app.id}">
                <p><strong>${app.client_name}</strong> (${app.client_phone})</p>
                <p>📅 ${app.appointment_date} às ${app.appointment_time}</p>
                <div class="modal-actions">
                    <button class="btn-edit" data-id="${app.id}">Editar</button>
                    <button class="btn-delete" data-id="${app.id}">Excluir</button>
                </div>
            </div>

            <div id="edit-mode-${app.id}" class="hidden" style="display: none;">
                <p><strong>Editar Agendamento</strong></p>
                <label>Nome:</label>
                <input type="text" id="edit-name-${app.id}" value="${app.client_name}" class="input-control" />
                <label>Telefone:</label>
                <input type="text" id="edit-phone-${app.id}" value="${app.client_phone}" class="input-control" />
                <label>Data:</label>
                <input type="date" id="edit-date-${app.id}" value="${app.appointment_date}" class="input-control" />
                <label>Horário:</label>
                <input type="time" id="edit-time-${app.id}" value="${app.appointment_time}" class="input-control" />
                
                <div class="modal-actions" style="margin-top: 10px;">
                    <button class="btn-save" data-id="${app.id}">Salvar</button>
                    <button class="btn-cancel" data-id="${app.id}">Cancelar</button>
                </div>
            </div>
            <hr style="border-color: #334155; margin: 15px 0;">
        `;
    detailsContainer.appendChild(item);
  });

  modal.classList.remove("hidden");

  detailsContainer.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      document.getElementById(`view-mode-${id}`).style.display = "none";
      document.getElementById(`edit-mode-${id}`).style.display = "block";
    });
  });

  detailsContainer.querySelectorAll(".btn-cancel").forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      document.getElementById(`edit-mode-${id}`).style.display = "none";
      document.getElementById(`view-mode-${id}`).style.display = "block";
    });
  });

  detailsContainer.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");

      if (typeof window.cancelAppointment === "function") {
        await window.cancelAppointment(id);

        const freshAppointments = await tenantService.getAppointments();
        const checkbox = document.getElementById("toggle-week-view");
        renderCalendar(
          freshAppointments,
          currentYear,
          currentMonth,
          session,
          checkbox ? checkbox.checked : false,
        );
      }
    });
  });

  detailsContainer.querySelectorAll(".btn-save").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      await updateAppointment(id, currentYear, currentMonth, session);
    });
  });
}

async function updateAppointment(id, year, month, session) {
  const updatedData = {
    client_name: document.getElementById(`edit-name-${id}`).value,
    client_phone: document.getElementById(`edit-phone-${id}`).value,
    appointment_date: document.getElementById(`edit-date-${id}`).value,
    appointment_time: document.getElementById(`edit-time-${id}`).value,
  };

  const { error } = await supabaseClient
    .from("appointments")
    .update(updatedData)
    .eq("id", id)
    .eq("tenant_id", session.user.id);

  if (error) {
    alert("Erro ao atualizar agendamento: " + error.message);
    return;
  }

  alert("Agendamento atualizado com sucesso!");

  document.getElementById("appointment-modal").classList.add("hidden");

  const freshAppointments = await tenantService.getAppointments();

  const [targetYear, targetMonth] = updatedData.appointment_date
    .split("-")
    .map(Number);

  const checkbox = document.getElementById("toggle-week-view");
  renderCalendar(
    freshAppointments,
    targetYear,
    targetMonth - 1,
    session,
    checkbox ? checkbox.checked : false,
  );

  window.dispatchEvent(new CustomEvent("appointmentUpdated"));
}

export function setupModalListeners() {
  const modal = document.getElementById("appointment-modal");
  const closeBtn = document.getElementById("close-modal");

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}
