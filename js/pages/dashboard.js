// js/pages/dashboard.js
import { AuthService } from "../services/auth.service.js";
import { supabaseClient } from "../config/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const session = await AuthService.checkSession();
  if (!session) {
    window.location.href = "/login.html";
    return;
  }

  // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
  const salonTitle = document.getElementById("salon-title");
  const logoutBtn = document.getElementById("logout-btn");
  const serviceForm = document.getElementById("service-form");
  const servicesListEl = document.getElementById("services-list");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const saveServiceBtn = document.getElementById("save-service-btn");
  const appointmentForm = document.getElementById("appointment-form");
  const appointmentsListEl = document.getElementById("appointments-list");

  // Trava de data mínima (hoje)
  const dateInput = document.getElementById("appt-date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

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

    // Verifique se o ', error' está presente aqui:
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

  // Função dedicada exclusivamente a carregar os serviços no <select id="appt-service">
  async function loadServicesIntoSelect() {
    const select = document.getElementById("appt-service");
    if (!select) return;

    const { data, error } = await supabaseClient
      .from("services")
      .select("id, name")
      .eq("tenant_id", session.user.id)
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      select.innerHTML =
        '<option value="">Cadastre um serviço primeiro</option>';
      return;
    }

    select.innerHTML =
      '<option value="">Selecione o serviço...</option>' +
      data.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  }

  // 3. Popular os Serviços no Select de Agendamento
  async function loadAppointments() {
    appointmentsListEl.innerHTML =
      '<p class="text-muted">Carregando agendamentos...</p>';

    // Busca agendamentos do tenant e traz o nome do serviço relacionado
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
        // Formata a data de YYYY-MM-DD para DD/MM/YYYY
        const [year, month, day] = appt.appointment_date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        const serviceName = appt.services
          ? appt.services.name
          : "Serviço removido";
        const servicePrice = appt.services
          ? `• R$ ${Number(appt.services.price).toFixed(2)}`
          : "";

        return `
          <div class="service-item">
            <div class="service-info">
              <h5>${appt.client_name} (${appt.client_phone})</h5>
              <p><strong>${serviceName}</strong> ${servicePrice} — 📅 ${formattedDate} às ${appt.appointment_time}</p>
            </div>
            <div class="service-actions">
              <button class="btn-icon danger" onclick="window.cancelAppointment('${appt.id}')">Cancelar</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Função global para cancelar/excluir agendamento
    window.cancelAppointment = async (id) => {
      if (!confirm("Deseja realmente cancelar este agendamento?")) return;

      const { error } = await supabaseClient
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("tenant_id", session.user.id);

      if (error) {
        alert("Erro ao cancelar: " + error.message);
      } else {
        loadAppointments();

        const select = document.getElementById("appt-service");
        const { data, error } = await supabaseClient
          .from("services")
          .select("id, name")
          .eq("tenant_id", session.user.id);

        if (error || !data || data.length === 0) {
          select.innerHTML =
            '<option value="">Cadastre um serviço primeiro</option>';
          return;
        }

        select.innerHTML =
          '<option value="">Selecione o serviço...</option>' +
          data
            .map((s) => `<option value="${s.id}">${s.name}</option>`)
            .join("");
      }
    };
  }

  // 4. Gerar slots de 15 minutos (08:00 às 20:00)
  function populateTimeSlots() {
    const select = document.getElementById("appt-time");
    select.innerHTML = '<option value="">Selecione o horário...</option>';
    for (let h = 8; h < 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        select.innerHTML += `<option value="${time}">${time}</option>`;
      }
    }
  }

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
    loadServicesIntoSelect(); // Atualiza o select de agendamento também
  });

  // 6. Salvar Agendamento
  appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const selectedDateStr = document.getElementById("appt-date").value; // ex: "2026-08-07"
    const selectedTimeStr = document.getElementById("appt-time").value; // ex: "14:30"

    // Divide a string da data para instanciar corretamente no horário local
    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const [hours, minutes] = selectedTimeStr.split(":").map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // Validação: Horário deve ser no futuro
    if (appointmentDateTime <= now) {
      alert("Erro: Você não pode agendar um horário no passado!");
      return;
    }

    const appointment = {
      tenant_id: session.user.id,
      service_id: document.getElementById("appt-service").value,
      client_name: document.getElementById("appt-client").value,
      client_phone: document.getElementById("appt-phone").value,
      appointment_date: document.getElementById("appt-date").value,
      appointment_time: document.getElementById("appt-time").value,
    };

    const { error } = await supabaseClient
      .from("appointments")
      .insert([appointment]);

    if (error) {
      alert("Erro ao realizar agendamento: " + error.message);
      return;
    }

    alert("Agendado com sucesso!");
    appointmentForm.reset();
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
      loadServicesIntoSelect();
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

  // Inicialização das funções da tela
  loadServices();
  loadServicesIntoSelect();
  populateTimeSlots();
  loadAppointments();
});
