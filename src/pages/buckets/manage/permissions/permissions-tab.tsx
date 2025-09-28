import { useDenyKey } from "../hooks";
import { Card, Checkbox, Table } from "react-daisyui";
import Button from "@/components/ui/button";
import { Trash } from "lucide-react";
import AllowKeyDialog from "./allow-key-dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useBucketContext } from "../context";

const PermissionsTab = () => {
  const { bucket, refetch } = useBucketContext();

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


  return (
    <div>
      <Card className="card-body">
        <div className="flex flex-row items-center gap-2">
          <Card.Title className="flex-1 truncate">Access Keys</Card.Title>
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


    </div>
  );
};

export default PermissionsTab;
