
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ParquetTableLoadingSkeleton = () => {
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="p-3 text-left">
                  <Skeleton className="h-5 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="border-b">
                {[1, 2, 3, 4, 5].map((col) => (
                  <td key={`${row}-${col}`} className="p-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
      </div>
    </div>
  );
};

export default ParquetTableLoadingSkeleton;
