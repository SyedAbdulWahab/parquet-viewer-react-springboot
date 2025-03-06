
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParquetColumn } from "@/lib/types";
import ParquetTableColumnHeader from "./ParquetTableColumnHeader";

interface ParquetTableContentProps {
  columns: ParquetColumn[];
  rows: Record<string, any>[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnName: string) => void;
  visibleColumns: Set<string>;
}

const ParquetTableContent = ({
  columns,
  rows,
  sortColumn,
  sortDirection,
  onSort,
  visibleColumns,
}: ParquetTableContentProps) => {
  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.name));

  return (
    <div className="overflow-auto">
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background z-10">
              <tr>
                {visibleColumnsList.map((column) => (
                  <ParquetTableColumnHeader 
                    key={column.name}
                    column={column}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    {visibleColumnsList.map((column) => (
                      <td 
                        key={column.name} 
                        className="p-3 border-b whitespace-nowrap"
                      >
                        {row[column.name] !== null ? String(row[column.name]) : 'null'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={visibleColumnsList.length} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    No matching data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParquetTableContent;
