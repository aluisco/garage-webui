import { useAuth } from "@/hooks/useAuth";
import { Card, Button, Stats } from "react-daisyui";
import { Shield, Database, Server, Settings, AlertTriangle } from "lucide-react";

export default function SystemTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Configuración del Sistema</h2>
        <p className="text-sm text-base-content/60">
          Configuraciones avanzadas y estado del sistema
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-base-100">
          <Card.Body>
            <Card.Title className="flex items-center gap-2">
              <Shield size={20} />
              Seguridad
            </Card.Title>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Autenticación</span>
                <div className="badge badge-success">Activa</div>
              </div>

              <div className="flex justify-between items-center">
                <span>Sistema de Roles</span>
                <div className="badge badge-success">Activo</div>
              </div>

              <div className="flex justify-between items-center">
                <span>Sesiones Seguras</span>
                <div className="badge badge-success">Activas</div>
              </div>

              <div className="flex justify-between items-center">
                <span>Usuario Actual</span>
                <div className="badge badge-info">{user?.role}</div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="bg-base-100">
          <Card.Body>
            <Card.Title className="flex items-center gap-2">
              <Database size={20} />
              Base de Datos
            </Card.Title>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Estado</span>
                <div className="badge badge-success">Conectada</div>
              </div>

              <div className="flex justify-between items-center">
                <span>Tipo</span>
                <div className="badge badge-info">JSON Local</div>
              </div>

              <div className="flex justify-between items-center">
                <span>Backups</span>
                <div className="badge badge-warning">Manual</div>
              </div>

              <Button size="sm" color="primary" outline>
                Crear Backup
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-base-100">
          <Card.Body>
            <Card.Title className="flex items-center gap-2">
              <Server size={20} />
              Configuración Garage
            </Card.Title>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Endpoint Admin API</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm"
                  placeholder="Configurado desde archivo garage.toml"
                  disabled
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Endpoint S3</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm"
                  placeholder="Configurado desde archivo garage.toml"
                  disabled
                />
              </div>

              <div className="alert alert-info">
                <AlertTriangle size={16} />
                <span className="text-sm">
                  La configuración se lee desde el archivo garage.toml
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="bg-base-100">
          <Card.Body>
            <Card.Title className="flex items-center gap-2">
              <Settings size={20} />
              Configuración Aplicación
            </Card.Title>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Puerto</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm"
                  value="3909"
                  disabled
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Directorio de Datos</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm"
                  placeholder="./data"
                  disabled
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Modo</span>
                </label>
                <div className="badge badge-success">Producción</div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-base-100">
        <Card.Body>
          <Card.Title>Acciones del Sistema</Card.Title>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button color="info" outline>
              <Database size={16} className="mr-2" />
              Crear Backup
            </Button>

            <Button color="warning" outline>
              <Settings size={16} className="mr-2" />
              Limpiar Cache
            </Button>

            <Button color="error" outline>
              <AlertTriangle size={16} className="mr-2" />
              Reiniciar Servicio
            </Button>
          </div>

          <div className="alert alert-warning mt-4">
            <AlertTriangle size={16} />
            <span className="text-sm">
              Estas acciones requieren privilegios de administrador del sistema
            </span>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}