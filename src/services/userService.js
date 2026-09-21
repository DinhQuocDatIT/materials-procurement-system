import { supabase } from "./supabaseClient";

export const userService = {
  // Lấy tất cả users
  async getAll() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Thêm user
  async create(user) {
    const { data, error } = await supabase
      .from("users")
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cập nhật
  async update(id, updates) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Xóa
  async delete(id) {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  // Đăng nhập
  async login(email, password) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("password", password)
      .maybeSingle();

    if (error) throw new Error("Lỗi kết nối: " + error.message);
    if (!data) throw new Error("Email hoặc mật khẩu không đúng!");
    return data;
  },
};
