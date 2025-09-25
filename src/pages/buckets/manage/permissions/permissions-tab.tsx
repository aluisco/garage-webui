import { useDenyKey } from "../hooks";
import { Card, Checkbox, Table } from "react-daisyui";
import Button from "@/components/ui/button";
import { Trash, Shield, Lock, Settings } from "lucide-react";
import AllowKeyDialog from "./allow-key-dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useBucketContext } from "../context";
import KeyPermissionsEditor from "@/components/s3-permissions/key-permissions-editor";
import ObjectLockingManager from "@/components/s3-permissions/object-locking-manager";

const PermissionsTab = () => {
  const { bucket, refetch } = useBucketContext();
  const [selectedKey, setSelectedKey] = useState<{accessKeyId: string, name: string} | null>(null);
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [showObjectLocking, setShowObjectLocking] = useState(false);

  const denyKey = useDenyKey(bucket.id, {
    onSuccess: () => {
      toast.success("Key removed!");
      refetch();
    },
    onError: handleError,
  });

  const keys = useMemo(() => {
    return bucket?.keys.filter(
      (key) =>
        key.permissions.read !== false ||
        key.permissions.write !== false ||
        key.permissions.owner !== false
    );
  }, [bucket?.keys]);

  const onRemove = (id: string) => {
    if (window.confirm("Are you sure you want to remove this key?")) {
      denyKey.mutate({
        keyId: id,
        permissions: { read: true, write: true, owner: true },
      });
    }
  };

  const onEditPermissions = (key: any) => {
    setSelectedKey({
      accessKeyId: key.accessKeyId,
      name: key.name || key.accessKeyId?.substring(0, 8)
    });
    setShowKeyEditor(true);
  };

  return (
    <div>
      <Card className="card-body">
        <div className="flex flex-row items-center gap-2">
          <Card.Title className="flex-1 truncate">Access Keys</Card.Title>
          <Button
            icon={Lock}
            onClick={() => setShowObjectLocking(true)}
            className="btn-outline btn-sm"
          >
            Object Lock
          </Button>
          <AllowKeyDialog currentKeys={keys?.map((key) => key.accessKeyId)} />
        </div>

        <div className="overflow-x-auto">
          <Table zebra size="sm">
            <Table.Head>
              <span>#</span>
              <span>Key</span>
              <span>Aliases</span>
              <span>Read</span>
              <span>Write</span>
              <span>Owner</span>
              <span>S3 Permisos</span>
              <span />
            </Table.Head>

            <Table.Body>
              {keys?.map((key, idx) => (
                <Table.Row>
                  <span>{idx + 1}</span>
                  <span>{key.name || key.accessKeyId?.substring(0, 8)}</span>
                  <span>{key.bucketLocalAliases?.join(", ") || "-"}</span>
                  <span>
                    <Checkbox
                      checked={key.permissions?.read}
                      color="primary"
                      className="cursor-default"
                    />
                  </span>
                  <span>
                    <Checkbox
                      checked={key.permissions?.write}
                      color="primary"
                      className="cursor-default"
                    />
                  </span>
                  <span>
                    <Checkbox
                      checked={key.permissions?.owner}
                      color="primary"
                      className="cursor-default"
                    />
                  </span>
                  <span>
                    <Button
                      icon={Shield}
                      onClick={() => onEditPermissions(key)}
                      className="btn-outline btn-xs"
                    >
                      Editar
                    </Button>
                  </span>
                  <Button
                    icon={Trash}
                    onClick={() => onRemove(key.accessKeyId)}
                  />
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>

      {/* S3 Permissions Editor Modal */}
      {showKeyEditor && selectedKey && (
        <KeyPermissionsEditor
          bucketId={bucket.id}
          accessKeyId={selectedKey.accessKeyId}
          keyName={selectedKey.name}
          isOpen={showKeyEditor}
          onClose={() => {
            setShowKeyEditor(false);
            setSelectedKey(null);
            refetch(); // Refresh bucket data after permission changes
          }}
        />
      )}

      {/* Object Locking Manager Modal */}
      {showObjectLocking && (
        <ObjectLockingManager
          bucketId={bucket.id}
          bucketName={bucket.globalAliases?.[0] || bucket.id}
          isOpen={showObjectLocking}
          onClose={() => setShowObjectLocking(false)}
        />
      )}
    </div>
  );
};

export default PermissionsTab;
