
import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ParquetColumn } from "@/lib/types";

interface ParquetTableColumnHeaderProps {
  column: ParquetColumn;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnName: string) => void;
}

const ParquetTableColumnHeader = ({
  column,
  sortColumn,
  sortDirection,
  onSort,
}: ParquetTableColumnHeaderProps) => {
  return (
    <th 
      className="p-3 text-left font-medium text-muted-foreground whitespace-nowrap border-b"
      onClick={() => onSort(column.name)}
    >
      <div className="flex items-center space-x-1 cursor-pointer">
        <span>{column.name}</span>
        {sortColumn === column.name && (
          sortDirection === 'asc' 
            ? <ArrowUp className="h-3 w-3" /> 
            : <ArrowDown className="h-3 w-3" />
        )}
      </div>
      <div className="text-xs opacity-60">{column.type}</div>
    </th>
  );
};

export default ParquetTableColumnHeader;
