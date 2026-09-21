const AuthStorage = {
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  },

  removeUser: () => {
    localStorage.removeItem("user");
  },

  isLoggedIn: () => {
    return !!AuthStorage.getUser();
  },
};

export default AuthStorage;
