import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deactivateUser,
  fetchUsers,
  UpdateUserInput,
  User,
} from '../lib/api';
import { useAuth } from '../lib/useAuth';

const emptyForm: UpdateUserInput = {
  name: '',
  email: '',
  role: 'VIEWER',
  password: '',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: authUser } = useAuth();
  const isAdmin = authUser?.role === 'ADMIN';
  const [editing, setEditing] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<UpdateUserInput>(emptyForm);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'VIEWER' as User['role'],
    password: '',
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserInput }) =>
      updateUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setCreateForm({
        name: '',
        email: '',
        role: 'VIEWER',
        password: '',
      });
    },
  });

  const users = usersQuery.data ?? [];

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    const payload: UpdateUserInput = {
      name: form.name,
      email: form.email,
      role: form.role,
      password: form.password ? form.password : undefined,
    };

    updateMutation.mutate({ id: editing.id, payload });
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('Name, email, dan password wajib diisi.');
      return;
    }
    createMutation.mutate({
      name: createForm.name,
      email: createForm.email,
      role: createForm.role,
      password: createForm.password,
    });
  };

  return (
    <div className="page">
      <header className="header">
        <span className="badge">Admin</span>
        <h1>Users</h1>
        <p>Manage user roles and deactivate accounts.</p>
      </header>

      {!isAdmin && (
        <div className="empty">Halaman ini hanya untuk admin.</div>
      )}

      {isAdmin && (
        <div className="toolbar">
          <button className="button" onClick={() => setShowCreate(true)}>
            Add User
          </button>
        </div>
      )}

      {isAdmin && (
        <section className="card">
        {usersQuery.isLoading && <div className="empty">Loading users...</div>}
        {usersQuery.error && (
          <div className="empty">
            {(usersQuery.error as Error).message || 'Failed to load users'}
          </div>
        )}
        {!usersQuery.isLoading && users.length === 0 && (
          <div className="empty">No users found.</div>
        )}
        {!usersQuery.isLoading && users.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td className="mono">{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="toolbar">
                      <button className="button ghost" onClick={() => openEdit(user)}>
                        Edit
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => {
                          if (confirm('Deactivate this user?')) {
                            deactivateMutation.mutate(user.id);
                          }
                        }}
                        disabled={!user.isActive}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </section>
      )}

      {editing && isAdmin && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Edit User</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Name
                  <input
                    value={form.name ?? ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    value={form.email ?? ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={form.role ?? 'VIEWER'}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        role: event.target.value as UpdateUserInput['role'],
                      }))
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </label>
                <label>
                  New Password (optional)
                  <input
                    type="password"
                    value={form.password ?? ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="footer-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button className="button" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && isAdmin && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Create User</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <label>
                  Name
                  <input
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={createForm.role}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        role: event.target.value as User['role'],
                      }))
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <div className="footer-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button className="button" type="submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
