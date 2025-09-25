import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Loading,
  Modal,
  Select,
  Textarea,
  Toggle,
  Alert,
} from "react-daisyui";
import {
  KeyPermissions,
  S3Policy,
  S3Statement,
  S3Action,
  S3_ACTION_GROUPS,
  PRESET_POLICY_DESCRIPTIONS,
  LegacyPermissions,
} from "@/types/s3-permissions";
import {
  useKeyPermissions,
  useUpdateKeyPermissions,
  usePresetPolicies,
  useValidateS3Policy,
} from "@/hooks/useS3Permissions";
import { Shield, Settings, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  bucketId: string;
  accessKeyId: string;
  keyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyPermissionsEditor({
  bucketId,
  accessKeyId,
  keyName,
  isOpen,
  onClose,
}: Props) {
  const [permissionMode, setPermissionMode] = useState<"legacy" | "preset" | "custom">("legacy");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customPolicy, setCustomPolicy] = useState<S3Policy>({
    version: "2012-10-17",
    statements: [],
  });
  const [legacyPermissions, setLegacyPermissions] = useState<LegacyPermissions>({
    read: false,
    write: false,
    owner: false,
  });
  const [policyJson, setPolicyJson] = useState<string>("");
  const [isValidatingPolicy, setIsValidatingPolicy] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Hooks
  const { data: currentPermissions, isLoading } = useKeyPermissions(bucketId, accessKeyId);
  const { data: presetPolicies } = usePresetPolicies();
  const updatePermissions = useUpdateKeyPermissions();
  const validatePolicy = useValidateS3Policy();

  // Initialize form with current permissions
  useEffect(() => {
    if (currentPermissions) {
      if (currentPermissions.legacy_mode) {
        setPermissionMode("legacy");
        setLegacyPermissions(currentPermissions.legacy_permissions || {
          read: false,
          write: false,
          owner: false,
        });
      } else if (currentPermissions.s3_policy) {
        setPermissionMode("custom");
        setCustomPolicy(currentPermissions.s3_policy);
        setPolicyJson(currentPermissions.policy_json || "");
      }
    }
  }, [currentPermissions]);

  const handleSave = async () => {
    const request = {
      bucket_id: bucketId,
      access_key_id: accessKeyId,
      policy_type: permissionMode === "preset" ? "preset" : "custom",
      legacy_mode: permissionMode === "legacy",
    } as any;

    if (permissionMode === "legacy") {
      request.legacy = legacyPermissions;
    } else if (permissionMode === "preset") {
      request.policy_name = selectedPreset;
    } else if (permissionMode === "custom") {
      request.policy = customPolicy;
    }

    try {
      await updatePermissions.mutateAsync(request);
      onClose();
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
  };

  const handleValidatePolicy = async () => {
    setIsValidatingPolicy(true);
    try {
      const result = await validatePolicy.mutateAsync(customPolicy);
      setValidationResult(result.data);
    } catch (error) {
      console.error("Error validating policy:", error);
    } finally {
      setIsValidatingPolicy(false);
    }
  };

  const handlePolicyJsonChange = (value: string) => {
    setPolicyJson(value);
    try {
      const parsed = JSON.parse(value);
      setCustomPolicy(parsed);
      setValidationResult(null);
    } catch (error) {
      // Invalid JSON, don't update the policy object
    }
  };

  const addStatement = () => {
    setCustomPolicy(prev => ({
      ...prev,
      statements: [
        ...prev.statements,
        {
          effect: "Allow",
          actions: [],
          resources: ["*"],
        },
      ],
    }));
  };

  const updateStatement = (index: number, statement: S3Statement) => {
    setCustomPolicy(prev => ({
      ...prev,
      statements: prev.statements.map((s, i) => (i === index ? statement : s)),
    }));
  };

  const removeStatement = (index: number) => {
    setCustomPolicy(prev => ({
      ...prev,
      statements: prev.statements.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <Modal open={isOpen} onClickBackdrop={onClose}>
        <Modal.Header>
          <h3>Editando Permisos de Llave</h3>
        </Modal.Header>
        <Modal.Body className="text-center py-8">
          <Loading />
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClickBackdrop={onClose} className="w-11/12 max-w-4xl">
      <Modal.Header>
        <h3 className="flex items-center gap-2">
          <Shield size={20} />
          Permisos de Llave: {keyName}
        </h3>
      </Modal.Header>

      <Modal.Body className="space-y-6">
        {/* Permission Mode Selection */}
        <Card className="bg-base-200 p-4">
          <h4 className="font-semibold mb-3">Tipo de Permisos</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="permission-mode"
                value="legacy"
                checked={permissionMode === "legacy"}
                onChange={(e) => setPermissionMode(e.target.value as any)}
                className="radio radio-primary"
              />
              <span>Permisos Simples (Lectura/Escritura/Propietario)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="permission-mode"
                value="preset"
                checked={permissionMode === "preset"}
                onChange={(e) => setPermissionMode(e.target.value as any)}
                className="radio radio-primary"
              />
              <span>Políticas Predefinidas (AWS S3)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="permission-mode"
                value="custom"
                checked={permissionMode === "custom"}
                onChange={(e) => setPermissionMode(e.target.value as any)}
                className="radio radio-primary"
              />
              <span>Política Personalizada (Avanzado)</span>
            </label>
          </div>
        </Card>

        {/* Legacy Permissions */}
        {permissionMode === "legacy" && (
          <Card className="bg-base-100 p-4">
            <h4 className="font-semibold mb-3">Permisos Simples</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={legacyPermissions.read}
                  onChange={(e) =>
                    setLegacyPermissions(prev => ({ ...prev, read: e.target.checked }))
                  }
                />
                <span>Lectura - Permite descargar objetos y listar el bucket</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={legacyPermissions.write}
                  onChange={(e) =>
                    setLegacyPermissions(prev => ({ ...prev, write: e.target.checked }))
                  }
                />
                <span>Escritura - Permite subir y eliminar objetos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={legacyPermissions.owner}
                  onChange={(e) =>
                    setLegacyPermissions(prev => ({ ...prev, owner: e.target.checked }))
                  }
                />
                <span>Propietario - Permisos administrativos completos</span>
              </label>
            </div>
          </Card>
        )}

        {/* Preset Policies */}
        {permissionMode === "preset" && (
          <Card className="bg-base-100 p-4">
            <h4 className="font-semibold mb-3">Políticas Predefinidas</h4>
            <Select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full mb-3"
            >
              <option value="">Seleccionar política...</option>
              {presetPolicies &&
                Object.entries(presetPolicies).map(([name, policy]) => (
                  <option key={name} value={name}>
                    {name} - {policy.description}
                  </option>
                ))}
            </Select>

            {selectedPreset && presetPolicies?.[selectedPreset] && (
              <div className="bg-base-200 p-3 rounded">
                <p className="text-sm mb-2">
                  <strong>Descripción:</strong> {presetPolicies[selectedPreset].description}
                </p>
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    Ver política JSON
                  </summary>
                  <pre className="text-xs mt-2 bg-base-300 p-2 rounded overflow-x-auto">
                    {presetPolicies[selectedPreset].policy_json}
                  </pre>
                </details>
              </div>
            )}
          </Card>
        )}

        {/* Custom Policy */}
        {permissionMode === "custom" && (
          <Card className="bg-base-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Política Personalizada</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleValidatePolicy}
                  disabled={isValidatingPolicy}
                >
                  {isValidatingPolicy ? <Loading size="xs" /> : "Validar"}
                </Button>
                <Button size="sm" onClick={addStatement}>
                  Agregar Declaración
                </Button>
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <Alert
                status={validationResult.valid ? "success" : "error"}
                icon={validationResult.valid ? <CheckCircle /> : <AlertCircle />}
                className="mb-4"
              >
                <div>
                  <div className="font-bold">
                    {validationResult.valid ? "Política Válida" : "Política Inválida"}
                  </div>
                  {validationResult.message && <div className="text-sm">{validationResult.message}</div>}
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <ul className="text-sm mt-1 list-disc list-inside">
                      {validationResult.errors.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Alert>
            )}

            {/* Policy Editor */}
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Versión</span>
                </label>
                <Input
                  value={customPolicy.version}
                  onChange={(e) =>
                    setCustomPolicy(prev => ({ ...prev, version: e.target.value }))
                  }
                  className="input-sm"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">ID de Política (Opcional)</span>
                </label>
                <Input
                  value={customPolicy.id || ""}
                  onChange={(e) =>
                    setCustomPolicy(prev => ({ ...prev, id: e.target.value || undefined }))
                  }
                  className="input-sm"
                />
              </div>

              {/* Statements */}
              <div>
                <label className="label">
                  <span className="label-text">Declaraciones</span>
                </label>
                <div className="space-y-3">
                  {customPolicy.statements.map((statement, index) => (
                    <StatementEditor
                      key={index}
                      statement={statement}
                      onChange={(updatedStatement) => updateStatement(index, updatedStatement)}
                      onRemove={() => removeStatement(index)}
                    />
                  ))}
                </div>
              </div>

              {/* JSON Editor */}
              <div>
                <label className="label">
                  <span className="label-text">Editor JSON (Avanzado)</span>
                </label>
                <Textarea
                  value={policyJson || JSON.stringify(customPolicy, null, 2)}
                  onChange={(e) => handlePolicyJsonChange(e.target.value)}
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
            </div>
          </Card>
        )}
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          loading={updatePermissions.isPending}
          disabled={
            permissionMode === "preset" && !selectedPreset ||
            updatePermissions.isPending
          }
        >
          Guardar Permisos
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

// Statement Editor Component
interface StatementEditorProps {
  statement: S3Statement;
  onChange: (statement: S3Statement) => void;
  onRemove: () => void;
}

function StatementEditor({ statement, onChange, onRemove }: StatementEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleActionToggle = (action: S3Action, checked: boolean) => {
    const newActions = checked
      ? [...statement.actions, action]
      : statement.actions.filter(a => a !== action);

    onChange({ ...statement, actions: newActions });
  };

  return (
    <Card className="bg-base-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium">Declaración</h5>
        <Button size="xs" variant="outline" color="error" onClick={onRemove}>
          Eliminar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">
            <span className="label-text">Efecto</span>
          </label>
          <Select
            value={statement.effect}
            onChange={(e) => onChange({ ...statement, effect: e.target.value as any })}
            className="select-sm"
          >
            <option value="Allow">Permitir</option>
            <option value="Deny">Denegar</option>
          </Select>
        </div>

        <div>
          <label className="label">
            <span className="label-text">Recursos</span>
          </label>
          <Input
            value={statement.resources.join(", ")}
            onChange={(e) =>
              onChange({
                ...statement,
                resources: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
              })
            }
            className="input-sm"
            placeholder="*, arn:aws:s3:::bucket/*"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="label">
            <span className="label-text">Acciones</span>
          </label>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Vista Simple" : "Vista Avanzada"}
          </Button>
        </div>

        {showAdvanced ? (
          <Textarea
            value={statement.actions.join("\n")}
            onChange={(e) =>
              onChange({
                ...statement,
                actions: e.target.value.split("\n").filter(Boolean) as S3Action[],
              })
            }
            className="textarea-sm font-mono"
            rows={5}
            placeholder="s3:GetObject&#10;s3:PutObject&#10;s3:ListBucket"
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(S3_ACTION_GROUPS).map(([groupName, actions]) => (
              <div key={groupName}>
                <h6 className="text-sm font-medium mb-1">{groupName}</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {actions.map((action) => (
                    <label key={action} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        size="xs"
                        checked={statement.actions.includes(action)}
                        onChange={(e) => handleActionToggle(action, e.target.checked)}
                      />
                      <span className="font-mono">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}