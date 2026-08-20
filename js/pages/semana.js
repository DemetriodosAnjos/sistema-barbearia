// js/components/semana.js
let activeStartDate = new Date();

// Adicione esta função no final do seu semana.js
window.updateWeekStartDate = function (newDate) {
  activeStartDate = new Date(newDate);
};

// Instância global interna do modal de novo agendamento para a semana
let semanaNovoAgendamentoModal = null;
let semanaOpenDetailsModal = null;

// Permite que o dashboard injete a instância do modal aqui dentro
export function setSemanaModalInstance(modalInstance) {
  semanaNovoAgendamentoModal = modalInstance;
}

export function setSemanaDetailsModalInstance(detailsFn) {
  semanaOpenDetailsModal = detailsFn;
}

export function initWeekNavigation({
  currentStartDate,
  onWeekChange,
  onToggleWeekView,
}) {
  // ATUALIZA A VARIÁVEL GLOBAL DO MÓDULO COM A DATA QUE VEIO DE FORA
  if (currentStartDate) {
    activeStartDate = new Date(currentStartDate);
  }
  let wrapper = document.getElementById("calendar-week-wrapper");

  if (wrapper && !wrapper.querySelector("#toggle-week-view")) {
    wrapper.remove();
    wrapper = null;
  }

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "calendar-week-wrapper";
    wrapper.className = "filter-group week-navigation";

    const label = document.createElement("label");
    label.className = "calendar-week-label";
    label.setAttribute("for", "toggle-week-view");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "toggle-week-view";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode("Semana:"));
    wrapper.appendChild(label);

    const btnPrev = document.createElement("button");
    btnPrev.id = "btn-prev-week";
    btnPrev.className = "btn-icon";
    btnPrev.title = "Semana Anterior";
    btnPrev.textContent = "◀";
    wrapper.appendChild(btnPrev);

    const btnNext = document.createElement("button");
    btnNext.id = "btn-next-week";
    btnNext.className = "btn-icon";
    btnNext.title = "Próxima Semana";
    btnNext.textContent = "▶";
    wrapper.appendChild(btnNext);

    const calendarHeader =
      document.querySelector(".calendar-header") ||
      document.getElementById("calendar-days")?.parentNode;

    if (calendarHeader) {
      calendarHeader.prepend(wrapper);
    }
  }

  activeStartDate = new Date(currentStartDate);

  const btnPrev = document.getElementById("btn-prev-week");
  const btnNext = document.getElementById("btn-next-week");
  const checkbox = document.getElementById("toggle-week-view");

  if (btnPrev && btnNext && checkbox) {
    const newBtnPrev = btnPrev.cloneNode(true);
    const newBtnNext = btnNext.cloneNode(true);
    const newCheckbox = checkbox.cloneNode(true);

    btnPrev.parentNode.replaceChild(newBtnPrev, btnPrev);
    btnNext.parentNode.replaceChild(newBtnNext, btnNext);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    newBtnPrev.addEventListener("click", () => {
      activeStartDate.setDate(activeStartDate.getDate() - 7);
      if (typeof onWeekChange === "function") {
        onWeekChange(new Date(activeStartDate), newCheckbox.checked);
      }
    });

    newBtnNext.addEventListener("click", () => {
      activeStartDate.setDate(activeStartDate.getDate() + 7);
      if (typeof onWeekChange === "function") {
        onWeekChange(new Date(activeStartDate), newCheckbox.checked);
      }
    });

    newCheckbox.addEventListener("change", (e) => {
      if (typeof onToggleWeekView === "function") {
        onToggleWeekView(e.target.checked, new Date(activeStartDate));
      }
    });
  }
}

export function renderWeekView(
  activeStartDateParam, // Recebe a data enviada pelo dashboard
  supabaseClient,
  appointments = [],
) {
  // ATUALIZAÇÃO NECESSÁRIA: Sincroniza a variável global do componente com a nova data
  if (activeStartDateParam) {
    activeStartDate = new Date(activeStartDateParam);
  }

  const calendarDaysContainer = document.getElementById("calendar-days");
  if (!calendarDaysContainer) return;

  calendarDaysContainer.innerHTML = "";

  const weekDays = [];
  // Agora usa a variável global atualizada para calcular o início da semana
  const startOfWeek = new Date(activeStartDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  // Momento atual para comparação de horários passados
  const now = new Date();

  weekDays.forEach((day) => {
    const dayColumn = document.createElement("div");
    dayColumn.className = "week-day-column";

    const dayHeader = document.createElement("div");
    dayHeader.className = "week-day-header";
    dayHeader.textContent = `${day.toLocaleDateString("pt-BR", { weekday: "short" })} - ${day.getDate()}`;
    dayColumn.appendChild(dayHeader);

    const timeSlotContainer = document.createElement("div");
    timeSlotContainer.className = "time-slots-container";

    const dateStr = day.toISOString().split("T")[0];

    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // 1. Definição das variáveis primeiro
        const formattedHour = String(hour).padStart(2, "0");
        const formattedMinute = String(minute).padStart(2, "0");
        const timeString = `${formattedHour}:${formattedMinute}`;

        // 2. Criação do elemento
        const hourSlot = document.createElement("div");
        hourSlot.className = "time-slot";
        hourSlot.textContent = timeString;
        hourSlot.dataset.time = timeString;
        hourSlot.dataset.date = dateStr;

        // 3. Procura se há um agendamento correspondente ANTES de verificar o passado
        const matchedAppointment = appointments.find((apt) => {
          const aptDate = apt.appointment_date
            ? apt.appointment_date.split("T")[0]
            : "";
          const aptTime = apt.appointment_time
            ? apt.appointment_time.substring(0, 5)
            : "";
          return aptDate === dateStr && aptTime === timeString;
        });

        // 4. Lógica exclusiva: ou está agendado, ou verificamos se é passado (vazio)
        if (matchedAppointment) {
          hourSlot.classList.add("booked");
          hourSlot.innerHTML = `
            <span class="slot-time">${timeString}</span>
            <span class="appointment-badge">${matchedAppointment.client_name || "Agendado"}</span>
          `;
        } else {
          // Se não tem agendamento, aí sim aplicamos a regra de horário passado
          const [y, m, d] = dateStr.split("-");
          const slotDateTime = new Date(
            parseInt(y),
            parseInt(m) - 1,
            parseInt(d),
            hour,
            minute,
            0,
          );
          const now = new Date();

          if (slotDateTime < now) {
            hourSlot.classList.add("past-slot");
          }
        }

        timeSlotContainer.appendChild(hourSlot);
      }
    }

    // Event Delegation para os cliques nos slots da semana
    timeSlotContainer.addEventListener("click", (e) => {
      const slot = e.target.closest(".time-slot");
      if (!slot) return;

      const selectedDate = slot.dataset.date;
      const selectedTime = slot.dataset.time;

      // 1. SE O SLOT FOR NO PASSADO E ESTIVER VAZIO (Bloqueado pelo CSS e alertado aqui)
      if (slot.classList.contains("past-slot")) {
        alert("Data e horário indisponíveis para agendamento.");
        return;
      }

      // 2. SE O SLOT ESTIVER OCUPADO (Mesmo no passado, se tiver agendamento, abre os detalhes)
      if (slot.classList.contains("booked")) {
        const appointmentFound = appointments.find((apt) => {
          const aptDate = apt.appointment_date
            ? apt.appointment_date.split("T")[0]
            : "";
          const aptTime = apt.appointment_time
            ? apt.appointment_time.substring(0, 5)
            : "";
          return aptDate === selectedDate && aptTime === selectedTime;
        });

        if (appointmentFound && typeof semanaOpenDetailsModal === "function") {
          semanaOpenDetailsModal([appointmentFound]);
        }
        return;
      }

      // 3. SE ESTIVER LIVRE E NO FUTURO, ABRE O MODAL DE NOVO AGENDAMENTO
      if (typeof semanaNovoAgendamentoModal === "function") {
        semanaNovoAgendamentoModal(selectedDate, selectedTime);
      } else {
        console.warn("Modal de novo agendamento não inicializado na semana.");
      }
    });

    dayColumn.appendChild(timeSlotContainer);
    calendarDaysContainer.appendChild(dayColumn);
  });
}
