import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Loading,
  Modal,
  Select,
  Toggle,
  Alert,
  Badge,
  Table,
} from "react-daisyui";
import {
  ObjectLockConfiguration,
  ObjectRetention,
  ObjectLegalHold,
  ObjectWithLocking,
  DefaultRetention,
  ObjectLockRetentionMode,
  ObjectLegalHoldStatus,
} from "@/types/s3-permissions";
import {
  useBucketObjectLockConfiguration,
  useUpdateBucketObjectLockConfiguration,
  useObjectsWithLocking,
  useUpdateObjectRetention,
  useUpdateObjectLegalHold,
} from "@/hooks/useS3Permissions";
import {
  Lock,
  Unlock,
  Shield,
  Settings,
  AlertTriangle,
  Calendar,
  FileText,
  Clock
} from "lucide-react";

interface Props {
  bucketId: string;
  bucketName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ObjectLockingManager({ bucketId, bucketName, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"config" | "objects">("config");
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showLegalHoldModal, setShowLegalHoldModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ObjectWithLocking | null>(null);

  // Hooks
  const { data: lockConfig, isLoading } = useBucketObjectLockConfiguration(bucketId);
  const updateLockConfig = useUpdateBucketObjectLockConfiguration();
  const { data: objectsData } = useObjectsWithLocking(bucketId);
  const updateRetention = useUpdateObjectRetention();
  const updateLegalHold = useUpdateObjectLegalHold();

  const handleConfigUpdate = async (config: ObjectLockConfiguration) => {
    try {
      await updateLockConfig.mutateAsync({ bucketId, config });
    } catch (error) {
      console.error("Error updating object lock configuration:", error);
    }
  };

  if (isLoading) {
    return (
      <Modal open={isOpen} onClickBackdrop={onClose} className="w-11/12 max-w-6xl">
        <Modal.Header>
          <h3>Object Lock - {bucketName}</h3>
        </Modal.Header>
        <Modal.Body className="text-center py-8">
          <Loading />
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={isOpen} onClickBackdrop={onClose} className="w-11/12 max-w-6xl">
        <Modal.Header>
          <h3 className="flex items-center gap-2">
            <Lock size={20} />
            Object Lock - {bucketName}
          </h3>
        </Modal.Header>

        <Modal.Body className="space-y-6">
          {/* Tab Navigation */}
          <div className="tabs tabs-boxed">
            <button
              className={`tab ${activeTab === "config" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("config")}
            >
              <Settings size={16} className="mr-2" />
              Configuración
            </button>
            <button
              className={`tab ${activeTab === "objects" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("objects")}
            >
              <FileText size={16} className="mr-2" />
              Objetos Bloqueados
            </button>
          </div>

          {/* Configuration Tab */}
          {activeTab === "config" && (
            <BucketLockConfiguration
              config={lockConfig?.object_lock_configuration}
              onUpdate={handleConfigUpdate}
              isUpdating={updateLockConfig.isPending}
            />
          )}

          {/* Objects Tab */}
          {activeTab === "objects" && (
            <ObjectsWithLockingTable
              objects={objectsData?.objects || []}
              onEditRetention={(obj) => {
                setSelectedObject(obj);
                setShowRetentionModal(true);
              }}
              onEditLegalHold={(obj) => {
                setSelectedObject(obj);
                setShowLegalHoldModal(true);
              }}
            />
          )}
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={onClose}>Cerrar</Button>
        </Modal.Actions>
      </Modal>

      {/* Retention Modal */}
      {showRetentionModal && selectedObject && (
        <RetentionEditor
          bucketId={bucketId}
          object={selectedObject}
          onClose={() => {
            setShowRetentionModal(false);
            setSelectedObject(null);
          }}
        />
      )}

      {/* Legal Hold Modal */}
      {showLegalHoldModal && selectedObject && (
        <LegalHoldEditor
          bucketId={bucketId}
          object={selectedObject}
          onClose={() => {
            setShowLegalHoldModal(false);
            setSelectedObject(null);
          }}
        />
      )}
    </>
  );
}

// Bucket Lock Configuration Component
interface BucketLockConfigurationProps {
  config?: ObjectLockConfiguration;
  onUpdate: (config: ObjectLockConfiguration) => void;
  isUpdating: boolean;
}

function BucketLockConfiguration({ config, onUpdate, isUpdating }: BucketLockConfigurationProps) {
  const [enabled, setEnabled] = useState(config?.object_lock_enabled || false);
  const [hasDefaultRetention, setHasDefaultRetention] = useState(!!config?.rule?.default_retention);
  const [defaultRetention, setDefaultRetention] = useState<DefaultRetention>({
    mode: "COMPLIANCE",
    days: 30,
  });

  const handleSave = () => {
    const newConfig: ObjectLockConfiguration = {
      object_lock_enabled: enabled,
      rule: hasDefaultRetention ? { default_retention: defaultRetention } : undefined,
    };
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Object Lock Status */}
      <Card className="bg-base-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <Shield size={18} />
              Estado de Object Lock
            </h4>
            <p className="text-sm text-base-content/60 mt-1">
              {enabled ? "Object Lock está habilitado en este bucket" : "Object Lock está deshabilitado"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Deshabilitado</span>
            <Toggle
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm">Habilitado</span>
          </div>
        </div>

        {enabled && (
          <Alert status="warning" className="mt-4">
            <AlertTriangle size={16} />
            <div>
              <div className="font-bold">Importante</div>
              <div className="text-sm">
                Una vez habilitado, Object Lock no se puede deshabilitar. Los objetos pueden tener
                retención y legal holds aplicados.
              </div>
            </div>
          </Alert>
        )}
      </Card>

      {/* Default Retention Configuration */}
      {enabled && (
        <Card className="bg-base-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Clock size={18} />
                Retención por Defecto
              </h4>
              <p className="text-sm text-base-content/60 mt-1">
                Configurar retención automática para nuevos objetos
              </p>
            </div>
            <Toggle
              checked={hasDefaultRetention}
              onChange={(e) => setHasDefaultRetention(e.target.checked)}
            />
          </div>

          {hasDefaultRetention && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Modo de Retención</span>
                </label>
                <Select
                  value={defaultRetention.mode}
                  onChange={(e) =>
                    setDefaultRetention(prev => ({
                      ...prev,
                      mode: e.target.value as ObjectLockRetentionMode,
                    }))
                  }
                >
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="GOVERNANCE">Governance</option>
                </Select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Duración (Días)</span>
                </label>
                <Input
                  type="number"
                  value={defaultRetention.days || ""}
                  onChange={(e) =>
                    setDefaultRetention(prev => ({
                      ...prev,
                      days: parseInt(e.target.value) || undefined,
                      years: undefined,
                    }))
                  }
                  placeholder="Ej: 30"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">O Años</span>
                </label>
                <Input
                  type="number"
                  value={defaultRetention.years || ""}
                  onChange={(e) =>
                    setDefaultRetention(prev => ({
                      ...prev,
                      years: parseInt(e.target.value) || undefined,
                      days: undefined,
                    }))
                  }
                  placeholder="Ej: 1"
                />
              </div>
            </div>
          )}

          {hasDefaultRetention && (
            <div className="mt-4 bg-base-200 p-3 rounded">
              <div className="text-sm space-y-1">
                <div><strong>Compliance:</strong> Los objetos no pueden ser eliminados hasta que expire la retención</div>
                <div><strong>Governance:</strong> Usuarios con permisos especiales pueden eliminar objetos antes</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={isUpdating}
          disabled={isUpdating}
          color="primary"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}

// Objects with Locking Table Component
interface ObjectsWithLockingTableProps {
  objects: ObjectWithLocking[];
  onEditRetention: (obj: ObjectWithLocking) => void;
  onEditLegalHold: (obj: ObjectWithLocking) => void;
}

function ObjectsWithLockingTable({
  objects,
  onEditRetention,
  onEditLegalHold
}: ObjectsWithLockingTableProps) {
  if (objects.length === 0) {
    return (
      <Card className="bg-base-100 p-8 text-center">
        <FileText size={48} className="mx-auto text-base-content/40 mb-4" />
        <h4 className="font-semibold mb-2">No hay objetos con Object Lock</h4>
        <p className="text-base-content/60">
          Los objetos aparecerán aquí una vez que tengan configuraciones de retención o legal holds
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Head>
          <span>Objeto</span>
          <span>Tamaño</span>
          <span>Retención</span>
          <span>Legal Hold</span>
          <span>Acciones</span>
        </Table.Head>
        <Table.Body>
          {objects.map((obj) => (
            <tr key={obj.key}>
              <td>
                <div className="font-mono text-sm">{obj.key}</div>
                <div className="text-xs text-base-content/60">
                  Modificado: {new Date(obj.last_modified).toLocaleString()}
                </div>
              </td>
              <td className="whitespace-nowrap">
                {(obj.size / 1024 / 1024).toFixed(2)} MB
              </td>
              <td>
                {obj.retention ? (
                  <div className="space-y-1">
                    <Badge color={obj.retention.mode === "COMPLIANCE" ? "error" : "warning"}>
                      {obj.retention.mode}
                    </Badge>
                    <div className="text-xs">
                      Hasta: {new Date(obj.retention.retain_until_date).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-base-content/60">Sin retención</span>
                )}
              </td>
              <td>
                <Badge color={obj.legal_hold?.status === "ON" ? "error" : "success"}>
                  {obj.legal_hold?.status === "ON" ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onEditRetention(obj)}
                  >
                    <Calendar size={12} />
                    Retención
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onEditLegalHold(obj)}
                  >
                    <Shield size={12} />
                    Legal Hold
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

// Retention Editor Modal
interface RetentionEditorProps {
  bucketId: string;
  object: ObjectWithLocking;
  onClose: () => void;
}

function RetentionEditor({ bucketId, object, onClose }: RetentionEditorProps) {
  const [mode, setMode] = useState<ObjectLockRetentionMode>("COMPLIANCE");
  const [date, setDate] = useState("");

  const updateRetention = useUpdateObjectRetention();

  const handleSave = async () => {
    const retention: ObjectRetention = {
      mode,
      retain_until_date: date,
    };

    try {
      await updateRetention.mutateAsync({
        bucketId,
        objectKey: object.key,
        retention,
      });
      onClose();
    } catch (error) {
      console.error("Error updating retention:", error);
    }
  };

  return (
    <Modal open onClickBackdrop={onClose}>
      <Modal.Header>
        <h3>Configurar Retención - {object.key}</h3>
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Modo de Retención</span>
          </label>
          <Select value={mode} onChange={(e) => setMode(e.target.value as ObjectLockRetentionMode)}>
            <option value="COMPLIANCE">Compliance</option>
            <option value="GOVERNANCE">Governance</option>
          </Select>
        </div>

        <div>
          <label className="label">
            <span className="label-text">Fecha de Retención</span>
          </label>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Actions>
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={updateRetention.isPending}>
          Guardar
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

// Legal Hold Editor Modal
interface LegalHoldEditorProps {
  bucketId: string;
  object: ObjectWithLocking;
  onClose: () => void;
}

function LegalHoldEditor({ bucketId, object, onClose }: LegalHoldEditorProps) {
  const [status, setStatus] = useState<ObjectLegalHoldStatus>("OFF");

  const updateLegalHold = useUpdateObjectLegalHold();

  const handleSave = async () => {
    const legalHold: ObjectLegalHold = { status };

    try {
      await updateLegalHold.mutateAsync({
        bucketId,
        objectKey: object.key,
        legalHold,
      });
      onClose();
    } catch (error) {
      console.error("Error updating legal hold:", error);
    }
  };

  return (
    <Modal open onClickBackdrop={onClose}>
      <Modal.Header>
        <h3>Configurar Legal Hold - {object.key}</h3>
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Estado de Legal Hold</span>
          </label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as ObjectLegalHoldStatus)}>
            <option value="OFF">Desactivado</option>
            <option value="ON">Activado</option>
          </Select>
        </div>

        <Alert status="info">
          <div className="text-sm">
            <div className="font-bold">Legal Hold</div>
            <div>
              Cuando está activado, el objeto no puede ser eliminado independientemente
              de su configuración de retención.
            </div>
          </div>
        </Alert>
      </Modal.Body>
      <Modal.Actions>
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={updateLegalHold.isPending}>
          Guardar
        </Button>
      </Modal.Actions>
    </Modal>
  );
}