// js/config/supabase.js

// Substituir com as credenciais reais do painel do Supabase (Project Settings > API)
const SUPABASE_URL = "https://mjiojinnrtpcfdfgmube.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaW9qaW5ucnRwY2ZkZmdtdWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODE4NjIsImV4cCI6MjEwMTY1Nzg2Mn0.PfwmaccUOVOH6W0VeHU-Nuw9fJFSy3_GZeNUGjNoNU0";

//Inicializa o cliente do Supabase (Disponível globalmente via CDN)
const { createClient } = supabase;
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
