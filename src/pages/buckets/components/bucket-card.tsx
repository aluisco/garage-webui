import { Bucket } from "../types";
import { ArchiveIcon, ChartPie, ChartScatter } from "lucide-react";
import { readableBytes } from "@/lib/utils";
import Button from "@/components/ui/button";

type Props = {
  data: Bucket & { aliases: string[] };
};

const BucketCard = ({ data }: Props) => {
  return (
    <div className="card card-body p-6">
      <div className="grid grid-cols-2 items-start gap-4 p-2 pb-0">
        <div className="flex flex-row items-start gap-x-3 col-span-2">
          <ArchiveIcon size={28} className="shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-row items-center gap-2">
              <p className="text-xl font-medium truncate">
                {data.aliases?.join(", ")}
              </p>
              {data.websiteAccess && (
                <div className="badge badge-sm badge-primary">Website</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm flex items-center gap-1">
            <ChartPie className="inline" size={16} />
            Usage
          </p>
          <p className="text-xl font-medium mt-1">
            {readableBytes(data.bytes)}
          </p>
        </div>

        <div>
          <p className="text-sm flex items-center gap-1">
            <ChartScatter className="inline" size={16} />
            Objects
          </p>
          <p className="text-xl font-medium mt-1">{data.objects}</p>
        </div>
      </div>

      <div className="flex flex-row justify-end gap-4">
        <Button href={`/buckets/${data.id}`}>Manage</Button>
        <Button color="primary" href={`/buckets/${data.id}?tab=browse`}>
          Browse
        </Button>
      </div>
    </div>
  );
};

export default BucketCard;
