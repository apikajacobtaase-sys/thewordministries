"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Users,
  UserCog,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Crown,
  BriefcaseBusiness,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type UserRole = "MEMBER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";

type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: Date | string | null;
  createdAt: Date | string;
  churchPosition: {
    id: string;
    name: string;
    isExecutive: boolean;
    isActive: boolean;
  } | null;
};

type ChurchPosition = {
  id: string;
  name: string;
  description: string | null;
  isExecutive: boolean;
  isActive: boolean;
  createdAt: Date | string;
  _count: {
    users: number;
  };
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "MEMBER", label: "Member (System Role)" },
  { value: "EDITOR", label: "Editor" },
  { value: "ADMIN", label: "Administrator" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const roleStyles: Record<UserRole, string> = {
  MEMBER: "bg-gray-100 text-gray-600",
  EDITOR: "bg-purple-50 text-purple-700",
  ADMIN: "bg-blue-50 text-blue-700",
  SUPER_ADMIN: "bg-amber-50 text-amber-700",
};

export default function UsersManagement() {
  const [tab, setTab] = useState<"users" | "positions">("users");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [positions, setPositions] = useState<ChurchPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("MEMBER");
  const [editPosition, setEditPosition] = useState("");

  const [positionEditorOpen, setPositionEditorOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ChurchPosition | null>(null);
  const [positionName, setPositionName] = useState("");
  const [positionDescription, setPositionDescription] = useState("");
  const [positionExecutive, setPositionExecutive] = useState(false);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (roleFilter !== "ALL") params.set("role", roleFilter);

    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load users.");
    }

    setUsers(result.data);
  }, [search, roleFilter]);

  const loadPositions = useCallback(async () => {
    const response = await fetch("/api/admin/positions");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load church positions.");
    }

    setPositions(result.data);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadUsers(), loadPositions()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load management data.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadPositions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers()
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unable to load users.");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    loadPositions().catch((err) => {
      setError(
        err instanceof Error ? err.message : "Unable to load church positions.",
      );
    });
  }, [loadPositions]);

  function openUserEditor(user: ManagedUser) {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPosition(user.churchPosition?.id || "");
    setError("");
    setNotice("");
  }

  async function saveUserChanges() {
    if (!selectedUser) return;

    if (
      selectedUser.role !== editRole &&
      !window.confirm(
        `Change ${selectedUser.name || selectedUser.email}'s system role to ${editRole.replace("_", " ")}? Their existing sessions will be invalidated.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
          churchPositionId: editPosition || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update user.");
      }

      setSelectedUser(null);
      setNotice("User permissions and appointment updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user.");
    } finally {
      setSaving(false);
    }
  }

  function openPositionEditor(position?: ChurchPosition) {
    setEditingPosition(position || null);
    setPositionName(position?.name || "");
    setPositionDescription(position?.description || "");
    setPositionExecutive(position?.isExecutive || false);
    setPositionEditorOpen(true);
    setError("");
    setNotice("");
  }

  async function savePosition() {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editingPosition
          ? `/api/admin/positions/${editingPosition.id}`
          : "/api/admin/positions",
        {
          method: editingPosition ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: positionName.trim(),
            description: positionDescription.trim(),
            isExecutive: positionExecutive,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save position.");
      }

      setPositionEditorOpen(false);
      setNotice(
        editingPosition
          ? "Church position updated successfully."
          : "Church position created successfully.",
      );

      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save position.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePosition(position: ChurchPosition) {
    const action = position.isActive ? "deactivate" : "reactivate";

    if (!window.confirm(`${action} the ${position.name} position?`)) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/positions/${position.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !position.isActive }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update position.");
      }

      setNotice(`Position ${action}d successfully.`);
      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update position.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePosition(position: ChurchPosition) {
    if (
      !window.confirm(
        `Permanently delete "${position.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/positions/${position.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete position.");
      }

      setNotice("Church position deleted successfully.");
      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete position.");
    } finally {
      setSaving(false);
    }
  }

  const activeUsers = users.filter((user) => user.isActive).length;
  const administrators = users.filter(
    (user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN",
  ).length;

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1877f2] hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Administration
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[#1877f2]">
                <ShieldCheck size={19} />
                <span className="text-xs font-extrabold uppercase tracking-widest">
                  Super Admin
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1c1e21]">
                Users & Roles
              </h1>

              <p className="mt-2 text-sm text-[#65676b]">
                Manage member access and church leadership appointments.
              </p>
            </div>

            <button
              onClick={refreshData}
              disabled={loading || saving}
              className="flex items-center gap-2 rounded-xl border border-[#e4e6eb] bg-white px-4 py-2.5 text-sm font-bold text-[#1c1e21] shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="flex-1">{error || notice}</span>
            <button
              onClick={() => {
                setError("");
                setNotice("");
              }}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Loaded Users",
              value: users.length,
              icon: Users,
              color: "bg-[#e7f3ff] text-[#1877f2]",
            },
            {
              label: "Active Users",
              value: activeUsers,
              icon: CheckCircle2,
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Administrators",
              value: administrators,
              icon: Crown,
              color: "bg-amber-50 text-amber-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon size={19} />
                </div>
                <p className="mt-3 text-2xl font-extrabold text-[#1c1e21]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#65676b]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </section>

        <div className="mb-5 flex rounded-xl border border-[#e4e6eb] bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("users")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition ${
              tab === "users"
                ? "bg-[#1877f2] text-white"
                : "text-[#65676b] hover:bg-[#f0f2f5]"
            }`}
          >
            <Users size={17} />
            Users
          </button>

          <button
            onClick={() => setTab("positions")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition ${
              tab === "positions"
                ? "bg-[#1877f2] text-white"
                : "text-[#65676b] hover:bg-[#f0f2f5]"
            }`}
          >
            <BriefcaseBusiness size={17} />
            Church Positions
          </button>
        </div>

        {tab === "users" ? (
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-[#1c1e21]">
                Church Members
              </h2>
              <p className="mt-1 text-xs text-[#65676b]">
                Search members and manage their system roles and appointments.
              </p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_190px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8d91]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email or phone..."
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="ALL">All church members</option>
                <optgroup label="Filter by system role">
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {loading ? (
              <div className="py-14 text-center text-sm text-[#65676b]">
                Loading members...
              </div>
            ) : users.length === 0 ? (
              <div className="py-14 text-center">
                <Users size={32} className="mx-auto text-[#a0a3a8]" />
                <p className="mt-3 text-sm font-semibold text-[#65676b]">
                  No members found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e4e6eb]">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7f3ff] font-bold text-[#1877f2]">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (user.name || user.email).charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1c1e21]">
                          {user.name || "Unnamed member"}
                        </p>
                        <p className="truncate text-xs text-[#65676b]">
                          {user.email}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8a8d91]">
                          {user.phone || "No phone number"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${roleStyles[user.role]}`}>
                        {user.role.replace("_", " ")}
                      </span>

                      {user.churchPosition && (
                        <span className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[10px] font-bold text-[#65676b]">
                          {user.churchPosition.name}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>

                      <button
                        onClick={() => openUserEditor(user)}
                        className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#e7f3ff] px-3 py-2 text-xs font-bold text-[#1877f2] hover:bg-[#d8eaff] sm:ml-0"
                      >
                        <UserCog size={15} />
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-[#8a8d91]">
              Showing up to 100 matching users.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#1c1e21]">
                  Church Leadership & Appointments
                </h2>
                <p className="mt-1 text-xs text-[#65676b]">
                  Define appointments independently of website access roles.
                </p>
              </div>

              <button
                onClick={() => openPositionEditor()}
                className="flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#166fe5]"
              >
                <Plus size={16} />
                Create Position
              </button>
            </div>

            {positions.length === 0 ? (
              <div className="py-14 text-center">
                <BriefcaseBusiness size={32} className="mx-auto text-[#a0a3a8]" />
                <p className="mt-3 text-sm font-semibold text-[#65676b]">
                  No church positions created yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {positions.map((position) => (
                  <article
                    key={position.id}
                    className="rounded-xl border border-[#e4e6eb] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#1c1e21]">
                          {position.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#65676b]">
                          {position.description || "No description provided."}
                        </p>
                      </div>

                      {position.isExecutive && (
                        <span className="shrink-0 rounded-full bg-[#e7f3ff] px-2 py-1 text-[9px] font-extrabold uppercase text-[#1877f2]">
                          Executive
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-[#1c1e21]">
                          {position._count.users}
                        </p>
                        <p className="text-[10px] text-[#65676b]">
                          Assigned members
                        </p>
                        <span
                          className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${
                            position.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {position.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPositionEditor(position)}
                          title="Edit position"
                          className="rounded-lg p-2 text-[#1877f2] hover:bg-[#e7f3ff]"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => togglePosition(position)}
                          title={position.isActive ? "Deactivate" : "Reactivate"}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <RefreshCw size={16} />
                        </button>

                        <button
                          onClick={() => deletePosition(position)}
                          title="Delete position"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#1c1e21]">
                  Manage Member
                </h2>
                <p className="mt-1 text-xs text-[#65676b]">
                  {selectedUser.name || selectedUser.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-full bg-[#f0f2f5] p-2"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-2 block text-xs font-bold text-[#65676b]">
              Website access role
            </label>
            <select
              value={editRole}
              onChange={(event) => setEditRole(event.target.value as UserRole)}
              className="mb-5 w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3 text-sm outline-none focus:border-[#1877f2]"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-xs font-bold text-[#65676b]">
              Church appointment
            </label>
            <select
              value={editPosition}
              onChange={(event) => setEditPosition(event.target.value)}
              className="mb-3 w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3 text-sm outline-none focus:border-[#1877f2]"
            >
              <option value="">No church appointment</option>
              {positions
                .filter(
                  (position) =>
                    position.isActive || position.id === editPosition,
                )
                .map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
            </select>

            <p className="mb-6 text-xs leading-5 text-[#8a8d91]">
              Website access roles control administrative permissions.
              Church appointments describe ministry responsibilities and do
              not independently grant website access.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                disabled={saving}
                className="flex-1 rounded-xl border border-[#e4e6eb] py-3 text-sm font-bold text-[#65676b]"
              >
                Cancel
              </button>

              <button
                onClick={saveUserChanges}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#1877f2] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {positionEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#1c1e21]">
                {editingPosition ? "Edit Position" : "Create Church Position"}
              </h2>

              <button
                onClick={() => setPositionEditorOpen(false)}
                className="rounded-full bg-[#f0f2f5] p-2"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-2 block text-xs font-bold text-[#65676b]">
              Position name
            </label>
            <input
              value={positionName}
              onChange={(event) => setPositionName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Church Secretary"
              className="mb-4 w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3 text-sm outline-none focus:border-[#1877f2]"
            />

            <label className="mb-2 block text-xs font-bold text-[#65676b]">
              Description
            </label>
            <textarea
              value={positionDescription}
              onChange={(event) => setPositionDescription(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe the responsibilities of this position..."
              className="mb-4 w-full resize-none rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3 text-sm outline-none focus:border-[#1877f2]"
            />

            <label className="mb-6 flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3">
              <input
                type="checkbox"
                checked={positionExecutive}
                onChange={(event) => setPositionExecutive(event.target.checked)}
                className="h-4 w-4 accent-[#1877f2]"
              />
              <span>
                <span className="block text-sm font-bold text-[#1c1e21]">
                  Executive position
                </span>
                <span className="text-xs text-[#65676b]">
                  Mark this as part of the church executive leadership.
                </span>
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setPositionEditorOpen(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-[#e4e6eb] py-3 text-sm font-bold text-[#65676b]"
              >
                Cancel
              </button>

              <button
                onClick={savePosition}
                disabled={saving || !positionName.trim()}
                className="flex-1 rounded-xl bg-[#1877f2] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingPosition
                    ? "Save Changes"
                    : "Create Position"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
