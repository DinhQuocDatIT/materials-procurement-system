import { supabase } from "./supabaseClient";

export const supplierService = {
  async getAll() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  },

  // ⭐ THÊM HÀM NÀY
  async getById(id) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(supplier) {
    const { data, error } = await supabase
      .from("suppliers")
      .insert([supplier])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};
