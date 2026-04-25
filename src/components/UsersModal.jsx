import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Shield, PenLine, UserPlus, Eye, EyeOff } from 'lucide-react';
import { getRoleUsers, setUserRole, removeUserRole } from '../utils/firestoreUtils';
import colors from '../utils/colors';

const FIREBASE_API_KEY = 'AIzaSyAriwME6CybqyDw1e3yNTwF6sHk4NUn7oY';

const ROLE_CONFIG = {
  admin: { label: 'Administrator', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  writer: { label: 'Writer', icon: <PenLine className="w-3.5 h-3.5" />, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
};

const UsersModal = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'writer' });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getRoleUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Display name, email, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Create the Firebase Auth user via REST API (doesn't sign out the current admin)
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.trim(), password: form.password, returnSecureToken: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || 'Failed to create account.';
        setError(msg === 'EMAIL_EXISTS' ? 'An account with this email already exists.' : msg);
        return;
      }
      const uid = data.localId;
      await setUserRole(uid, form.role, form.displayName.trim(), form.email.trim());
      setForm({ displayName: '', email: '', password: '', role: 'writer' });
      setShowForm(false);
      load();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid, role) => {
    if (!confirm(`Remove this ${role} user? They will lose access immediately.`)) return;
    setDeletingUid(uid);
    try {
      await removeUserRole(uid, role);
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err) { console.error(err); } finally { setDeletingUid(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">User Management</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage who has admin or writer access</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* User list */}
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No users yet. Add one below.</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => {
                const cfg = ROLE_CONFIG[u.role];
                return (
                  <div key={u.uid} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${cfg.border} ${cfg.bg}/30`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} flex-shrink-0`}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.displayName}</p>
                      {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(u.uid, u.role)}
                      disabled={deletingUid === u.uid}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                      title="Remove access"
                    >
                      {deletingUid === u.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add user form */}
          {showForm ? (
            <form onSubmit={handleAdd} className="border-2 border-[#00BCD4] rounded-xl p-4 space-y-3 bg-[#f0faf8]">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4" style={{ color: colors.primary.teal }} /> Add New User
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Display Name *</label>
                  <input
                    type="text" required value={form.displayName}
                    onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="e.g. Sarah K."
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="sarah@example.com"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:border-[#00BCD4] focus:outline-none text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">The user will log in with this email and password.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                  <div className="flex gap-2">
                    {(['writer', 'admin']).map(r => (
                      <button
                        key={r} type="button"
                        onClick={() => setForm(p => ({ ...p, role: r }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                          form.role === r
                            ? r === 'admin' ? 'border-purple-400 bg-purple-100 text-purple-700' : 'border-blue-400 bg-blue-100 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {form.role === 'admin' ? 'Full access: trips, landing page, blog, and user management.' : 'Blog-only access: can create and edit blog posts.'}
                  </p>
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setError(''); setForm({ displayName: '', email: '', password: '', role: 'writer' }); }}
                  className="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: colors.primary.teal }}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-[#00BCD4] hover:text-[#00BCD4] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default UsersModal;
