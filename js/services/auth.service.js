// js/services/auth.service.js
import { supabaseClient } from "../config/supabase.js";

export const AuthService = {
  // Realizar Login
  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Realizar Cadastro (Sign Up)
  async signUp(email, password, salonName) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          salon_name: salonName, // Salva metadados do usuário no Auth do Supabase
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Verificar se há sessão ativa
  async checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Logout
  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = "/login.html";
  },
};
