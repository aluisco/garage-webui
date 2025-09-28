import { useState } from "react";
import { useUsers, useDeleteUser } from "@/hooks/useAdmin";
import { usePermissions } from "@/hooks/useAuth";
import { Card, Table, Button, Badge, Modal } from "react-daisyui";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import CreateUserDialog from "../components/create-user-dialog";
import EditUserDialog from "../components/edit-user-dialog";
import { User } from "@/types/admin";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function UsersTab() {
  const { hasPermission } = usePermissions();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "badge-error";
      case "tenant_admin":
        return "badge-warning";
      case "user":
        return "badge-info";
      case "readonly":
        return "badge-neutral";
      default:
        return "badge-ghost";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "tenant_admin":
        return "Tenant Admin";
      case "user":
        return "User";
      case "readonly":
        return "Read Only";
      default:
        return role;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-base-content/60">
            Manage system users and their permissions
          </p>
        </div>

        {hasPermission("write_users") && (
          <Button
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => setShowCreateDialog(true)}
          >
            New User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card className="bg-base-100">
        <Card.Body className="p-0">
          <Table className="table-zebra">
            <Table.Head>
              <span>User</span>
              <span>Email</span>
              <span>Rol</span>
              <span>Status</span>
              <span>Last Login</span>
              <span>Actions</span>
            </Table.Head>

            <Table.Body>
              {users?.map((user) => (
                <Table.Row key={user.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                          <span className="text-xs">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{user.username}</div>
                        <div className="text-sm opacity-50">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </td>

                  <td>
                    <Badge className={user.enabled ? "badge-success" : "badge-error"}>
                      {user.enabled ? (
                        <>
                          <UserCheck size={14} className="mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX size={14} className="mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </td>

                  <td>
                    {user.last_login ? (
                      <span className="text-sm">
                        {dayjs(user.last_login).format("DD/MM/YYYY HH:mm")}
                      </span>
                    ) : (
                      <span className="text-sm text-base-content/50">Never</span>
                    )}
                  </td>

                  <td>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        color="ghost"
                        shape="square"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye size={16} />
                      </Button>

                      {hasPermission("write_users") && (
                        <Button
                          size="sm"
                          color="ghost"
                          shape="square"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                      )}

                      {hasPermission("delete_users") && (
                        <Button
                          size="sm"
                          color="ghost"
                          shape="square"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {users?.length === 0 && (
            <div className="text-center py-8 text-base-content/60">
              No users registered
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <EditUserDialog
        open={showEditDialog}
        user={selectedUser}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedUser(null);
        }}
      />

      {/* Delete Confirmation */}
      <Modal open={showDeleteConfirm} onClickBackdrop={() => setShowDeleteConfirm(false)}>
        <Modal.Header className="font-bold">
          Confirm Deletion
        </Modal.Header>

        <Modal.Body>
          <p>
            Are you sure you want to delete the user{" "}
            <strong>{selectedUser?.username}</strong>?
          </p>
          <p className="text-sm text-base-content/60 mt-2">
            This action cannot be undone.
          </p>
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            loading={deleteUser.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}