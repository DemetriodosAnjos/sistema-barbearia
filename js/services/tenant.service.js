// js/services/tenant.service.js
import { supabaseClient } from "../config/supabase.js";

export const tenantService = {
  async getAppointments() {
    try {
      const { data, error } = await supabaseClient
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(
        "Erro ao buscar agendamentos no tenantService:",
        error.message,
      );
      return [];
    }
  },
};
