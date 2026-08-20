export function initNovoAgendamentoModal({
  supabaseClient,
  session,
  onAppointmentCreated,
}) {
  // 1. Criação e Injeção do HTML do Modal no DOM
  const modalWrapper = document.createElement("div");
  modalWrapper.id = "novo-agendamento-modal";
  modalWrapper.className = "modal-overlay hidden";
  modalWrapper.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Novo Agendamento</h3>
          <button type="button" id="close-modal-btn" class="close-btn">&times;</button>
        </div>
        <form id="appointment-form">
          <div class="form-group">
            <label for="appt-service">Serviço</label>
            <select id="appt-service" required>
              <option value="">Carregando serviços...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="appt-client">Nome do Cliente</label>
            <input type="text" id="appt-client" required placeholder="Nome completo" />
          </div>
          <div class="form-group">
            <label for="appt-phone">Telefone / WhatsApp</label>
            <input type="tel" id="appt-phone" required placeholder="(00) 00000-0000" />
          </div>
          <div class="form-group">
            <label for="appt-date">Data</label>
            <input type="date" id="appt-date" required />
          </div>
          <div class="form-group">
            <label for="appt-time">Horário</label>
            <select id="appt-time" required>
              <option value="">Selecione o horário...</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" id="save-appt-btn" class="btn-submit">Salvar Agendamento</button>
            <button type="button" id="cancel-modal-btn" class="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;
  document.body.appendChild(modalWrapper);

  // Seletores internos do modal
  const appointmentForm = modalWrapper.querySelector("#appointment-form");
  const closeBtn = modalWrapper.querySelector("#close-modal-btn");
  const cancelBtn = modalWrapper.querySelector("#cancel-modal-btn");
  const selectService = modalWrapper.querySelector("#appt-service");
  const selectTime = modalWrapper.querySelector("#appt-time");

  // Funções internas do componente
  async function loadServicesIntoSelect() {
    const { data, error } = await supabaseClient
      .from("services")
      .select("id, name")
      .eq("tenant_id", session.user.id)
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      selectService.innerHTML =
        '<option value="">Cadastre um serviço primeiro</option>';
      return;
    }

    selectService.innerHTML =
      '<option value="">Selecione o serviço...</option>' +
      data.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  }

  function populateTimeSlots() {
    selectTime.innerHTML = '<option value="">Selecione o horário...</option>';
    for (let h = 8; h < 19; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        selectTime.innerHTML += `<option value="${time}">${time}</option>`;
      }
    }
  }

  // Eventos de controle de abertura e fechamento
  // Exporte a função ou o objeto do modal
  window.semanaNovoAgendamentoModal = {
    open: function (selectedDate = null, selectedTime = null) {
      loadServicesIntoSelect();
      populateTimeSlots();

      // Define a data se foi passada pelo clique na semana/calendário
      if (selectedDate) {
        const dateInput = modalWrapper.querySelector("#appt-date");
        if (dateInput) dateInput.value = selectedDate;
      }

      // Define o horário se foi passado pelo clique no slot
      if (selectedTime) {
        const timeSelectOrInput = modalWrapper.querySelector("#appt-time");
        if (timeSelectOrInput) {
          if (timeSelectOrInput.tagName === "SELECT") {
            const optionExists = Array.from(timeSelectOrInput.options).some(
              (opt) => opt.value === selectedTime,
            );

            if (!optionExists) {
              const newOption = document.createElement("option");
              newOption.value = selectedTime;
              newOption.textContent = selectedTime;
              timeSelectOrInput.appendChild(newOption);
            }
          }

          timeSelectOrInput.value = selectedTime;
          setTimeout(() => {
            timeSelectOrInput.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
          }, 0);
        }
      }

      modalWrapper.classList.remove("hidden");
      modalWrapper.style.display = "flex";
    },
  };

  function close() {
    modalWrapper.classList.add("hidden");
    modalWrapper.style.display = "none";
    appointmentForm.reset();
  }

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  modalWrapper.addEventListener("click", (e) => {
    if (e.target === modalWrapper) close();
  });

  // Submit do formulário de agendamento
  appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedDateStr = modalWrapper.querySelector("#appt-date").value;
    const selectedTimeStr = modalWrapper.querySelector("#appt-time").value;

    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const [hours, minutes] = selectedTimeStr.split(":").map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    if (appointmentDateTime <= now) {
      alert("Erro: Você não pode agendar um horário no passado!");
      return;
    }

    const loadingModal = document.getElementById("loading-modal");
    const loadingText = document.getElementById("loading-text");
    if (loadingText) loadingText.textContent = "Salvando novo agendamento...";
    if (loadingModal) {
      loadingModal.classList.remove("hidden");
      loadingModal.style.display = "flex";
    }

    const appointment = {
      tenant_id: session.user.id,
      service_id: selectService.value,
      client_name: modalWrapper.querySelector("#appt-client").value,
      client_phone: modalWrapper.querySelector("#appt-phone").value,
      appointment_date: selectedDateStr,
      appointment_time: selectedTimeStr,
    };

    try {
      const { error } = await supabaseClient
        .from("appointments")
        .insert([appointment]);

      if (error) {
        throw new Error(error.message);
      }

      close();

      if (typeof onAppointmentCreated === "function") {
        await onAppointmentCreated();
      }
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      alert("Erro ao realizar agendamento: " + err.message);
    } finally {
      if (loadingModal) {
        loadingModal.classList.add("hidden");
        loadingModal.style.display = "none";
      }
    }
  });

  return {
    open,
    close,
    loadServicesIntoSelect,
  };
}
