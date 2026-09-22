import { supabase } from "./supabaseClient";

export const materialService = {
  // Lấy tất cả vật tư (kèm thông tin NCC nếu có)
  async getAll() {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(material) {
    const { data, error } = await supabase
      .from("materials")
      .insert([material])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("materials")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};

// ===== SERVICE CHO BẢNG TRUNG GIAN =====
export const supplierMaterialService = {
  // Lấy tất cả NCC của 1 vật tư
  async getByMaterial(materialId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select(
        `
        *,
        supplier:suppliers(id, name, tax_code, rating, rank)
      `,
      )
      .eq("material_id", materialId)
      .order("is_preferred", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Thêm NCC cho vật tư
  async create(record) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("supplier_materials")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};
