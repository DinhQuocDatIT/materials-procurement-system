import { supabase } from "./supabaseClient";

export const purchaseRequestService = {
  // ===== LẤY TẤT CẢ =====
  async getAll() {
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(
        `
        *,
        supplier:suppliers(id, name, tax_code),
        creator:users!purchase_requests_created_by_fkey(id, name)
      `,
      )
      .order("id", { ascending: false });

    if (error) throw error;
    return data;
  },

  // ===== CHI TIẾT 1 YC =====
  async getById(id) {
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(
        `
        *,
        supplier:suppliers(id, name, tax_code),
        creator:users!purchase_requests_created_by_fkey(id, name),
        approver:users!purchase_requests_approved_by_fkey(id, name),
        items:purchase_request_items(
          id,
          quantity,
          material_id,
          material:materials(id, code, name, unit, current_stock)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // ===== TẠO YC =====
  async create(request, items) {
    const { data: req, error: reqError } = await supabase
      .from("purchase_requests")
      .insert([request])
      .select()
      .single();

    if (reqError) throw reqError;

    const itemsData = items.map((item) => ({
      request_id: req.id,
      material_id: item.material_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(itemsData);

    if (itemsError) throw itemsError;
    return req;
  },

  // ===== XÓA =====
  async delete(id) {
    const { error } = await supabase
      .from("purchase_requests")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  // ===== SINH MÃ YC THEO NGÀY THÁNG GIỜ HIỆN TẠI =====
  // Định dạng: YC-YYYYMMDD-HHMMSS
  // Ví dụ: YC-20260922-143025
  // ⭐ Không bao giờ trùng — mỗi giây 1 mã khác
  async generateCode() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `YC-${year}${month}${day}-${hours}${minutes}${seconds}`;
  },

  // ===== DUYỆT + TRỪ KHO =====
  async approve(requestId, approverId) {
    const { data: request, error: reqError } = await supabase
      .from("purchase_requests")
      .select(
        `
        *,
        items:purchase_request_items(
          id,
          quantity,
          material_id,
          material:materials(id, code, name, unit, current_stock)
        )
      `,
      )
      .eq("id", requestId)
      .single();

    if (reqError) throw reqError;
    if (!request) throw new Error("Không tìm thấy yêu cầu!");
    if (request.status !== "PENDING") {
      throw new Error("Chỉ duyệt được yêu cầu đang chờ!");
    }

    const errors = [];
    for (const item of request.items) {
      if (item.material.current_stock < item.quantity) {
        errors.push(
          `"${item.material.name}": kho còn ${item.material.current_stock}, cần ${item.quantity}`,
        );
      }
    }
    if (errors.length > 0) {
      throw new Error("Không đủ tồn kho:\n" + errors.join("\n"));
    }

    for (const item of request.items) {
      const newStock = item.material.current_stock - item.quantity;
      const { error } = await supabase
        .from("materials")
        .update({ current_stock: newStock })
        .eq("id", item.material.id);
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from("purchase_requests")
      .update({
        status: "APPROVED",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== TỪ CHỐI =====
  async reject(requestId, approverId, reason) {
    const { data, error } = await supabase
      .from("purchase_requests")
      .update({
        status: "REJECTED",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        note: reason || null,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async update(id, request, items) {
    // 1. Update request
    const { data: req, error: reqError } = await supabase
      .from("purchase_requests")
      .update(request)
      .eq("id", id)
      .select()
      .single();

    if (reqError) throw reqError;

    // 2. Xóa items cũ
    const { error: deleteError } = await supabase
      .from("purchase_request_items")
      .delete()
      .eq("request_id", id);

    if (deleteError) throw deleteError;

    // 3. Insert items mới
    const itemsData = items.map((item) => ({
      request_id: id,
      material_id: item.material_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(itemsData);

    if (itemsError) throw itemsError;
    return req;
  },
};
