// js/components/semana.js

export function initWeekNavigation({
  currentStartDate,
  onWeekChange,
  onToggleWeekView,
}) {
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

  let activeStartDate = new Date(currentStartDate);

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
  activeStartDate,
  supabaseClient,
  appointments = [],
) {
  const calendarDaysContainer = document.getElementById("calendar-days");
  if (!calendarDaysContainer) return;

  calendarDaysContainer.innerHTML = "";

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

    const dateStr = day.toISOString().split("T")[0];

    for (let hour = 1; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourSlot = document.createElement("div");
        hourSlot.className = "time-slot";

        const formattedHour = String(hour).padStart(2, "0");
        const formattedMinute = String(minute).padStart(2, "0");
        const timeString = `${formattedHour}:${formattedMinute}`;

        hourSlot.textContent = timeString;

        // Armazenamos a data e a hora direto no elemento via dataset para facilitar o clique
        hourSlot.dataset.time = timeString;
        hourSlot.dataset.date = dateStr;

        // Procura se há um agendamento correspondente para este dia e horário
        const matchedAppointment = appointments.find((apt) => {
          // Usa os nomes corretos vindos do Supabase: appointment_date e appointment_time
          const aptDate = apt.appointment_date
            ? apt.appointment_date.split("T")[0]
            : "";
          const aptTime = apt.appointment_time
            ? apt.appointment_time.substring(0, 5)
            : "";
          return aptDate === dateStr && aptTime === timeString;
        });

        if (matchedAppointment) {
          hourSlot.classList.add("booked");
          hourSlot.innerHTML = `
              <span class="slot-time">${timeString}</span>
              <span class="appointment-badge">${matchedAppointment.client_name || "Agendado"}</span>
            `;
        }

        timeSlotContainer.appendChild(hourSlot);
      }
    }

    timeSlotContainer.addEventListener("click", (e) => {
      const slot = e.target.closest(".time-slot");
      if (!slot) return;

      const selectedDate = slot.dataset.date;
      const selectedTime = slot.dataset.time;

      if (
        window.globalNovoAgendamentoModal &&
        typeof window.globalNovoAgendamentoModal.open === "function"
      ) {
        window.globalNovoAgendamentoModal.open(selectedDate, selectedTime);
      }
    });

    dayColumn.appendChild(timeSlotContainer);
    calendarDaysContainer.appendChild(dayColumn);
  });
}
