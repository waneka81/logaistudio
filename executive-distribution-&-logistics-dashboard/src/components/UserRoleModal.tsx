import React, { useState } from 'react';
import { RegisteredUser } from '../types';

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'admin' | 'user';
  onSwitchRole: (role: 'admin' | 'user', pass: string) => boolean;
  onChangePassword: (role: 'admin' | 'user', oldPass: string, newPass: string) => boolean;
  registeredUsers: RegisteredUser[];
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSwitchRole,
  onChangePassword,
  registeredUsers,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'changepass' | 'manage'>('switch');
  const [targetRole, setTargetRole] = useState<'admin' | 'user'>('user');
  const [rolePass, setRolePass] = useState('');

  const [changeRole, setChangeRole] = useState<'admin' | 'user'>('admin');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  if (!isOpen) return null;

  const handleLoginRole = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onSwitchRole(targetRole, rolePass.trim());
    if (success) {
      onShowToast(`Berhasil beralih ke peran ${targetRole === 'admin' ? 'Admin' : 'User (Viewer)'}.`, 'success');
      setRolePass('');
      onClose();
    } else {
      onShowToast('Password salah!', 'error');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onChangePassword(changeRole, oldPass.trim(), newPass.trim());
    if (success) {
      onShowToast(`Password untuk ${changeRole.toUpperCase()} berhasil diperbarui!`, 'success');
      setOldPass('');
      setNewPass('');
      setActiveTab('switch');
    } else {
      onShowToast('Password lama salah!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="card w-full max-w-md p-5 rounded-2xl border border-slate-700 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-users-gear text-[#00ABE7]"></i>
            <h3 className="font-poppins font-bold text-sm text-white">Manajemen Akun &amp; Peran</h3>
          </div>
          <button onClick={onClose} className="text-subtext hover:text-white cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl text-xs gap-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'switch' ? 'bg-[#00ABE7] text-slate-950 font-bold' : 'text-subtext hover:text-white'
            }`}
          >
            Beralih Peran
          </button>
          <button
            onClick={() => setActiveTab('changepass')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'changepass' ? 'bg-[#00ABE7] text-slate-950 font-bold' : 'text-subtext hover:text-white'
            }`}
          >
            Ubah Password
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'manage' ? 'bg-[#00ABE7] text-slate-950 font-bold' : 'text-subtext hover:text-white'
            }`}
          >
            Daftar User
          </button>
        </div>

        {/* Tab 1: Switch Role */}
        {activeTab === 'switch' && (
          <form onSubmit={handleLoginRole} className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-subtext block mb-1">Pilih Peran Tujuan:</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ABE7]"
              >
                <option value="admin">Admin Mode (Akses Penuh &amp; Edit)</option>
                <option value="user">User Mode (Viewer / Hanya Lihat)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-subtext block mb-1">
                Password {targetRole === 'admin' ? 'Admin' : 'User'}:
              </label>
              <input
                type="password"
                required
                value={rolePass}
                onChange={(e) => setRolePass(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ABE7]"
              />
              <span className="text-[10px] text-subtext block mt-1">
                (Default: <code>admin123</code> atau <code>user123</code>)
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs text-subtext hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold text-xs cursor-pointer shadow"
              >
                Login Peran
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'changepass' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-subtext block mb-1">Pilih Peran:</label>
              <select
                value={changeRole}
                onChange={(e) => setChangeRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ABE7]"
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-subtext block mb-1">Password Lama:</label>
              <input
                type="password"
                required
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ABE7]"
              />
            </div>
            <div>
              <label className="text-[11px] text-subtext block mb-1">Password Baru:</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ABE7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs text-subtext hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold text-xs cursor-pointer shadow"
              >
                Simpan Password
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Manage Users */}
        {activeTab === 'manage' && (
          <div className="space-y-3 pt-1">
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-subtext font-semibold">
                  <tr>
                    <th className="p-2">Username</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {registeredUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-800/40">
                      <td className="p-2 font-medium text-white">{u.username}</td>
                      <td className="p-2 text-subtext text-[10px]">{u.email}</td>
                      <td className="p-2">
                        <span className="text-[#00ABE7] font-semibold text-[9px] uppercase">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
