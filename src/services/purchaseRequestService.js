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
          price,
          material_id,
          material:materials(
            id,
            code,
            name,
            unit,
            current_stock,
            max_stock,
            min_stock
          )
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

    // ⭐ Lưu kèm price (snapshot giá tại thời điểm tạo)
    const itemsData = items.map((item) => ({
      request_id: req.id,
      material_id: item.material_id,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
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

  // ===== SINH MÃ YC =====
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

  // ===== DUYỆT YC (KHÔNG TRỪ KHO) =====
  // YC mua là để BỔ SUNG kho → KHÔNG trừ kho
  // Chỉ trừ kho khi Xuất kho (dùng vật tư)
  async approve(requestId, approverId) {
    // 1. Lấy YC
    const { data: request, error: reqError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError) throw reqError;
    if (!request) throw new Error("Không tìm thấy yêu cầu!");
    if (request.status !== "PENDING") {
      throw new Error("Chỉ duyệt được yêu cầu đang chờ!");
    }

    // 2. Chỉ update status
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

  // ===== UPDATE YC =====
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

    // 3. Insert items mới (kèm price)
    const itemsData = items.map((item) => ({
      request_id: id,
      material_id: item.material_id,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
    }));

    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(itemsData);

    if (itemsError) throw itemsError;
    return req;
  },
};
