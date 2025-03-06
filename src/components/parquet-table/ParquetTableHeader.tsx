
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParquetColumn } from "@/lib/types";

interface ParquetTableHeaderProps {
  filter: string;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageSizeChange: (value: string) => void;
  pageSize: number;
  columns: ParquetColumn[];
  visibleColumns: Set<string>;
  toggleColumnVisibility: (columnName: string) => void;
}

const ParquetTableHeader = ({
  filter,
  onFilterChange,
  onPageSizeChange,
  pageSize,
  columns,
  visibleColumns,
  toggleColumnVisibility,
}: ParquetTableHeaderProps) => {
  return (
    <div className="p-4 border-b flex items-center justify-between space-x-4">
      <div className="relative w-64">
        <Input
          placeholder="Filter table data..."
          value={filter}
          onChange={onFilterChange}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Select onValueChange={onPageSizeChange} defaultValue={pageSize.toString()}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="25">25 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Toggle columns" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {columns.map((column) => (
              <div key={column.name} className="px-2 py-1.5">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.name)}
                    onChange={() => toggleColumnVisibility(column.name)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{column.name}</span>
                </label>
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ParquetTableHeader;
