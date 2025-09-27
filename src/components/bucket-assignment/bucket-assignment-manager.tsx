import { useState } from "react";
import {
  Button,
  Card,
  Loading,
  Modal,
  Select,
  Alert,
  Badge,
} from "react-daisyui";
import {
  useBucketAssignment,
  useAssignBucket,
  useUnassignBucket,
} from "@/hooks/useBucketAssignments";
import { useUsers, useTenants } from "@/hooks/useAdmin";
import { UserPlus, Building2, X, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  bucketId: string;
  bucketName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BucketAssignmentManager({
  bucketId,
  bucketName,
  isOpen,
  onClose,
}: Props) {
  const [assignmentType, setAssignmentType] = useState<"user" | "tenant" | "">("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  // Hooks
  const { data: assignment, isLoading } = useBucketAssignment(bucketId);
  const { data: users } = useUsers();
  const { data: tenants } = useTenants();
  const assignBucket = useAssignBucket();
  const unassignBucket = useUnassignBucket();

  const handleAssign = async () => {
    const request = {
      bucket_id: bucketId,
      assigned_user_id: assignmentType === "user" ? selectedUserId : undefined,
      assigned_tenant_id: assignmentType === "tenant" ? selectedTenantId : undefined,
    };

    try {
      await assignBucket.mutateAsync(request);
      onClose();
    } catch (error) {
      console.error("Error assigning bucket:", error);
    }
  };

  const handleUnassign = async () => {
    if (window.confirm("¿Estás seguro de que quieres remover la asignación de este bucket?")) {
      try {
        await unassignBucket.mutateAsync(bucketId);
        onClose();
      } catch (error) {
        console.error("Error unassigning bucket:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Modal open={isOpen} onClickBackdrop={onClose}>
        <Modal.Header>
          <h3>Asignación de Bucket</h3>
        </Modal.Header>
        <Modal.Body className="text-center py-8">
          <Loading />
        </Modal.Body>
      </Modal>
    );
  }

  const isAssigned = assignment?.assigned_user_id || assignment?.assigned_tenant_id;

  return (
    <Modal open={isOpen} onClickBackdrop={onClose} className="w-11/12 max-w-2xl">
      <Modal.Header>
        <h3 className="flex items-center gap-2">
          <UserPlus size={20} />
          Asignación de Bucket: {bucketName}
        </h3>
      </Modal.Header>

      <Modal.Body className="space-y-6">
        {/* Current Assignment Status */}
        <Card className="bg-base-100 p-4">
          <h4 className="font-semibold mb-3">Estado Actual</h4>
          {isAssigned ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {assignment?.assigned_user && (
                    <>
                      <UserPlus size={16} />
                      <span>Asignado a Usuario:</span>
                      <Badge color="primary">{assignment.assigned_user.username}</Badge>
                    </>
                  )}
                  {assignment?.assigned_tenant && (
                    <>
                      <Building2 size={16} />
                      <span>Asignado a Tenant:</span>
                      <Badge color="info">{assignment.assigned_tenant.name}</Badge>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  color="error"
                  onClick={handleUnassign}
                  loading={unassignBucket.isPending}
                >
                  <X size={14} />
                  Remover
                </Button>
              </div>

              <Alert status="success" className="text-sm">
                <CheckCircle size={16} />
                <div>
                  Este bucket está asignado y puede ser gestionado por el usuario/tenant especificado.
                </div>
              </Alert>
            </div>
          ) : (
            <Alert status="info" className="text-sm">
              <AlertCircle size={16} />
              <div>
                Este bucket no está asignado a ningún usuario o tenant.
              </div>
            </Alert>
          )}
        </Card>

        {/* Assignment Form */}
        <Card className="bg-base-100 p-4">
          <h4 className="font-semibold mb-3">
            {isAssigned ? "Cambiar Asignación" : "Nueva Asignación"}
          </h4>

          <div className="space-y-4">
            {/* Assignment Type Selection */}
            <div>
              <label className="label">
                <span className="label-text">Tipo de Asignación</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment-type"
                    value="user"
                    checked={assignmentType === "user"}
                    onChange={(e) => setAssignmentType(e.target.value as "user")}
                    className="radio radio-primary"
                  />
                  <UserPlus size={16} />
                  <span>Usuario</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment-type"
                    value="tenant"
                    checked={assignmentType === "tenant"}
                    onChange={(e) => setAssignmentType(e.target.value as "tenant")}
                    className="radio radio-primary"
                  />
                  <Building2 size={16} />
                  <span>Tenant</span>
                </label>
              </div>
            </div>

            {/* User Selection */}
            {assignmentType === "user" && (
              <div>
                <label className="label">
                  <span className="label-text">Seleccionar Usuario</span>
                </label>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Seleccionar usuario...</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email}) - {user.role}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Tenant Selection */}
            {assignmentType === "tenant" && (
              <div>
                <label className="label">
                  <span className="label-text">Seleccionar Tenant</span>
                </label>
                <Select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Seleccionar tenant...</option>
                  {tenants?.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.description}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Help Text */}
            {assignmentType && (
              <div className="bg-base-200 p-3 rounded text-sm">
                <p className="font-medium mb-1">¿Qué significa asignar un bucket?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>El usuario/tenant asignado puede gestionar las llaves de acceso del bucket</li>
                  <li>Puede modificar permisos y configuraciones específicas del bucket</li>
                  <li>Los administradores siempre mantienen acceso completo</li>
                  <li>Solo se puede asignar a un usuario O tenant, no ambos</li>
                </ul>
              </div>
            )}
          </div>
        </Card>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        {assignmentType && (
          <Button
            onClick={handleAssign}
            loading={assignBucket.isPending}
            disabled={
              assignBucket.isPending ||
              (assignmentType === "user" && !selectedUserId) ||
              (assignmentType === "tenant" && !selectedTenantId)
            }
            color="primary"
          >
            {isAssigned ? "Cambiar Asignación" : "Asignar Bucket"}
          </Button>
        )}
      </Modal.Actions>
    </Modal>
  );
}