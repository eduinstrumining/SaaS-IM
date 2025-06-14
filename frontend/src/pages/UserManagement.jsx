import React, { useEffect, useState } from "react";
import { fetchUsers, createUser } from "../api";

export default function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Viewer",
    status: "Active",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  function loadUsers() {
    setLoading(true);
    fetchUsers(token)
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  // Toggle para status (switch)
  const handleToggleStatus = () =>
    setNewUser({ ...newUser, status: newUser.status === "Active" ? "Inactive" : "Active" });

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createUser(newUser, token);
      setShowAdd(false);
      setNewUser({
        name: "",
        email: "",
        role: "Viewer",
        status: "Active",
        password: "",
      });
      setSuccess("Usuario creado correctamente.");
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">User Management</h1>
          <p className="text-[#B6BDC9] text-base font-medium">
            Manage user accounts and permissions within the system.
          </p>
        </div>
        <button
          className="bg-[#C1E7FF] hover:bg-[#A2d8f9] text-[#1A202C] font-bold rounded-lg px-5 py-2 text-base transition shadow"
          onClick={() => setShowAdd(true)}
        >
          Add User
        </button>
      </div>

      {/* Formulario de agregar usuario */}
      {showAdd && (
        <form
          className="max-w-2xl mx-auto bg-[#181B20] rounded-xl shadow-xl px-7 py-6 mb-8 border border-[#26272d]"
          onSubmit={handleAddUser}
        >
          <h2 className="text-xl font-bold mb-6 text-white tracking-tight">Add User</h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[#B6BDC9] text-base font-semibold mb-1">Name</label>
              <input
                className="w-full bg-[#23272F] text-white rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-cyan-400 text-base placeholder-[#495066]"
                placeholder="Enter user’s full name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[#B6BDC9] text-base font-semibold mb-1">Email</label>
              <input
                className="w-full bg-[#23272F] text-white rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-cyan-400 text-base placeholder-[#495066]"
                placeholder="Enter user’s email address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[#B6BDC9] text-base font-semibold mb-1">Password</label>
              <input
                className="w-full bg-[#23272F] text-white rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-cyan-400 text-base placeholder-[#495066]"
                placeholder="Set a secure password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[#B6BDC9] text-base font-semibold mb-1">Role</label>
              <select
                className="w-full bg-[#23272F] text-white rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-cyan-400 text-base"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                required
              >
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-center mt-1">
              <div>
                <span className="block text-[#B6BDC9] text-base font-semibold mb-1">Account Status</span>
                <span className="text-[#6A7382] text-xs">Activate or deactivate the user account.</span>
              </div>
              {/* Toggle visual */}
              <div className="ml-8 flex items-center">
                <span className="mr-2 font-medium text-[#B6BDC9] text-sm">
                  {newUser.status === "Active" ? "Active" : "Inactive"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${
                    newUser.status === "Active" ? "bg-cyan-400" : "bg-[#33363C]"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      newUser.status === "Active" ? "translate-x-4" : ""
                    }`}
                  ></span>
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button className="bg-cyan-400 text-black font-bold rounded-lg px-5 py-2 text-base" type="submit">
                Create User
              </button>
              <button
                className="bg-[#181B20] border border-[#2B3139] text-[#B6BDC9] rounded-lg px-5 py-2 text-base"
                type="button"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
            {error && <div className="text-red-400 mt-2 text-base">{error}</div>}
            {success && <div className="text-green-400 mt-2 text-base">{success}</div>}
          </div>
        </form>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-[#16181C] rounded-xl overflow-hidden shadow text-base">
        <table className="w-full">
          <thead className="bg-[#191C22] text-[#B6BDC9] font-bold text-base">
            <tr>
              <th className="py-3 px-5 text-left">Name</th>
              <th className="py-3 px-5 text-left">Email</th>
              <th className="py-3 px-5 text-left">Role</th>
              <th className="py-3 px-5 text-left">Status</th>
              <th className="py-3 px-5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-white font-medium">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#8C92A4] font-semibold">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#8C92A4] font-semibold">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[#23242d]">
                  <td className="py-3 px-5">{user.name}</td>
                  <td className="py-3 px-5 text-cyan-200">{user.email}</td>
                  <td className="py-3 px-5">
                    <span className="inline-block px-4 py-1 rounded-full bg-[#23242d] text-base font-bold">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-block px-4 py-1 rounded-full font-bold text-base ${
                      user.status === "Active"
                        ? "bg-[#23242d] text-[#2ee1e6]"
                        : "bg-[#23242d] text-[#8C92A4]"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <button className="text-[#B6BDC9] hover:text-cyan-200 font-bold mr-5 text-sm">Edit</button>
                    <button className="text-[#B6BDC9] hover:text-red-400 font-bold text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
