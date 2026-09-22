import { supabase } from "./supabaseClient";

export const stockService = {
  // ===== NHẬP KHO — TĂNG tồn kho (CÓ CHECK MAX) =====
  async stockIn({ material_id, quantity }) {
    // 1. Lấy thông tin vật tư
    const { data: material, error: getError } = await supabase
      .from("materials")
      .select("current_stock, name, max_stock, min_stock")
      .eq("id", material_id)
      .single();

    if (getError) throw getError;
    if (!material) throw new Error("Không tìm thấy vật tư!");

    // 2. ⭐ CHECK MAX STOCK
    const maxStock = material.max_stock || 0;
    const newStock = material.current_stock + quantity;

    if (maxStock > 0 && newStock > maxStock) {
      const canAdd = maxStock - material.current_stock;
      throw new Error(
        `"${material.name}" vượt mức tối đa!\n` +
          `Tồn hiện tại: ${material.current_stock}\n` +
          `Mức tối đa: ${maxStock}\n` +
          `Chỉ có thể nhập thêm: ${canAdd}`,
      );
    }

    // 3. Cập nhật tồn kho
    const { error } = await supabase
      .from("materials")
      .update({ current_stock: newStock })
      .eq("id", material_id);

    if (error) throw error;

    return {
      material_name: material.name,
      old_stock: material.current_stock,
      new_stock: newStock,
      max_stock: maxStock,
    };
  },

  // ===== XUẤT KHO — GIẢM tồn kho =====
  async stockOut({ material_id, quantity }) {
    const { data: material, error: getError } = await supabase
      .from("materials")
      .select("current_stock, name, min_stock")
      .eq("id", material_id)
      .single();

    if (getError) throw getError;
    if (!material) throw new Error("Không tìm thấy vật tư!");

    if (material.current_stock < quantity) {
      throw new Error(
        `Không đủ tồn kho! Chỉ còn ${material.current_stock}, cần ${quantity}`,
      );
    }

    const newStock = material.current_stock - quantity;

    const { error } = await supabase
      .from("materials")
      .update({ current_stock: newStock })
      .eq("id", material_id);

    if (error) throw error;

    return {
      material_name: material.name,
      old_stock: material.current_stock,
      new_stock: newStock,
    };
  },
};
