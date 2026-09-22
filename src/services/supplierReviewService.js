import { supabase } from "./supabaseClient";

export const supplierReviewService = {
  // Lấy tất cả đánh giá theo NCC
  async getBySupplier(supplierId) {
    const { data, error } = await supabase
      .from("supplier_reviews")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("year", { ascending: false });

    if (error) throw error;
    return data;
  },

  // ⭐ Lấy đánh giá theo NCC + năm (dùng trong Edit)
  async getByYear(supplierId, year) {
    const { data, error } = await supabase
      .from("supplier_reviews")
      .select("*")
      .eq("supplier_id", supplierId)
      .eq("year", year)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // ⭐ Upsert - thêm mới hoặc cập nhật nếu đã có (dùng trong Edit)
  async upsert(review) {
    const { data, error } = await supabase
      .from("supplier_reviews")
      .upsert(review, { onConflict: "supplier_id,year" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Lấy danh sách năm có đánh giá (dùng cho dropdown filter)
  async getYears(supplierId) {
    const { data, error } = await supabase
      .from("supplier_reviews")
      .select("year")
      .eq("supplier_id", supplierId)
      .order("year", { ascending: false });

    if (error) throw error;

    return [...new Set(data.map((item) => item.year))];
  },

  // Xóa đánh giá
  async delete(id) {
    const { error } = await supabase
      .from("supplier_reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },
};
