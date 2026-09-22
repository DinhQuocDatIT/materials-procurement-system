import { supabase } from "./supabaseClient";

// ============================================
// SERVICE CHÍNH CHO VẬT TƯ
// ============================================
export const materialService = {
  // ===== LẤY TẤT CẢ VẬT TƯ =====
  async getAll() {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  },

  // ===== LẤY 1 VẬT TƯ THEO ID =====
  async getById(id) {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // ===== TẠO MỚI =====
  async create(material) {
    const { data, error } = await supabase
      .from("materials")
      .insert([material])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== CẬP NHẬT =====
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

  // ===== XÓA =====
  async delete(id) {
    const { error } = await supabase.from("materials").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  // ===== ⭐ TÌM NCC ĐÁP ỨNG DANH SÁCH VẬT TƯ =====
  // Dùng trong trang Tạo YC — gợi ý NCC phù hợp
  async findSuppliersForMaterials(materialIds) {
    if (!materialIds || materialIds.length === 0) return [];

    // 1. Lấy tất cả cặp (NCC, vật tư) từ bảng trung gian
    const { data, error } = await supabase
      .from("supplier_materials")
      .select(
        `
        supplier_id,
        material_id,
        price,
        lead_time_days,
        is_preferred,
        supplier:suppliers(id, name, tax_code, rank, rating, status)
      `,
      )
      .in("material_id", materialIds);

    if (error) throw error;

    // 2. Gom nhóm theo NCC
    const supplierMap = {};

    data.forEach((item) => {
      const sid = item.supplier_id;

      if (!supplierMap[sid]) {
        supplierMap[sid] = {
          supplier: item.supplier,
          items: [],
          totalPrice: 0,
        };
      }

      supplierMap[sid].items.push({
        material_id: item.material_id,
        price: item.price,
        lead_time_days: item.lead_time_days,
        is_preferred: item.is_preferred,
      });

      supplierMap[sid].totalPrice += Number(item.price || 0);
    });

    // 3. Tính độ đáp ứng
    const totalMaterials = materialIds.length;

    const result = Object.values(supplierMap).map((s) => ({
      supplier: s.supplier,
      matchedCount: s.items.length,
      totalCount: totalMaterials,
      matchedItems: s.items,
      missingMaterialIds: materialIds.filter(
        (id) => !s.items.some((i) => i.material_id === id),
      ),
      totalPrice: s.totalPrice,
      matchPercent: Math.round((s.items.length / totalMaterials) * 100),
    }));

    // 4. Sắp xếp:
    //    - NCC đáp ứng nhiều nhất lên đầu
    //    - Nếu bằng nhau → ưu tiên giá thấp
    result.sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) {
        return b.matchedCount - a.matchedCount;
      }
      return a.totalPrice - b.totalPrice;
    });

    return result;
  },

  // ===== ⭐ LẤY GIÁ CỦA NCC CHO TỪNG VẬT TƯ =====
  // Dùng trong trang Tạo YC — hiện giá khi chọn NCC
  // ⭐ Trả về: { material_id: price_number }
  async getPricesBySupplier(supplierId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select("material_id, price, lead_time_days")
      .eq("supplier_id", supplierId);

    if (error) throw error;

    // ⭐ Convert sang map { material_id: price (number) }
    const priceMap = {};
    data.forEach((item) => {
      priceMap[item.material_id] = Number(item.price || 0);
    });

    return priceMap;
  },

  // ===== ⭐ LẤY TẤT CẢ VẬT TƯ MÀ 1 NCC CÓ BÁN =====
  // Trả về: array các dòng { material_id, price, lead_time_days }
  async getMaterialsBySupplier(supplierId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select("material_id, price, lead_time_days, is_preferred")
      .eq("supplier_id", supplierId);

    if (error) throw error;
    return data;
  },
};

// ============================================
// SERVICE CHO BẢNG TRUNG GIAN NCC - VẬT TƯ
// ============================================
export const supplierMaterialService = {
  // ===== LẤY TẤT CẢ NCC CỦA 1 VẬT TƯ =====
  async getByMaterial(materialId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select(
        `
        *,
        supplier:suppliers(id, name, tax_code, rating, rank, status)
      `,
      )
      .eq("material_id", materialId)
      .order("is_preferred", { ascending: false });

    if (error) throw error;
    return data;
  },

  // ===== LẤY TẤT CẢ VẬT TƯ CỦA 1 NCC =====
  async getBySupplier(supplierId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select(
        `
        *,
        material:materials(id, code, name, unit, category, current_stock)
      `,
      )
      .eq("supplier_id", supplierId);

    if (error) throw error;
    return data;
  },

  // ===== LẤY GIÁ 1 CẶP NCC - VẬT TƯ =====
  async getPrice(supplierId, materialId) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .select("price, lead_time_days, is_preferred")
      .eq("supplier_id", supplierId)
      .eq("material_id", materialId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // ===== THÊM NCC CHO VẬT TƯ =====
  async create(record) {
    const { data, error } = await supabase
      .from("supplier_materials")
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== CẬP NHẬT =====
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

  // ===== XÓA =====
  async delete(id) {
    const { error } = await supabase
      .from("supplier_materials")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  // ===== XÓA TẤT CẢ NCC CỦA 1 VẬT TƯ =====
  async deleteByMaterial(materialId) {
    const { error } = await supabase
      .from("supplier_materials")
      .delete()
      .eq("material_id", materialId);

    if (error) throw error;
    return true;
  },
};
