
import React from "react";
import { ParquetData } from "@/lib/types";
import ParquetTableHeader from "./ParquetTableHeader";
import ParquetTableContent from "./ParquetTableContent";
import ParquetTableFooter from "./ParquetTableFooter";
import ParquetTableLoadingSkeleton from "./ParquetTableLoadingSkeleton";
import { useParquetTable } from "./hooks/useParquetTable";

interface ParquetTableProps {
  data?: ParquetData;
  isLoading: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const ParquetTable = ({ 
  data, 
  isLoading, 
  onPageChange,
  onPageSizeChange
}: ParquetTableProps) => {
  const {
    sortColumn,
    sortDirection,
    filter,
    filteredData,
    visibleColumns,
    handleSort,
    handleFilterChange,
    toggleColumnVisibility
  } = useParquetTable(data);

  if (isLoading) {
    return <ParquetTableLoadingSkeleton />;
  }

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          No data available for this file
        </div>
      </div>
    );
  }

  const handlePageChangeInternal = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handlePageSizeChangeInternal = (newSize: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(newSize));
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-md border animate-in fade-in">
      <ParquetTableHeader 
        filter={filter}
        onFilterChange={handleFilterChange}
        onPageSizeChange={handlePageSizeChangeInternal}
        pageSize={data.pageSize}
        columns={data.columns}
        visibleColumns={visibleColumns}
        toggleColumnVisibility={toggleColumnVisibility}
      />
      
      <ParquetTableContent 
        columns={data.columns}
        rows={filteredData}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        visibleColumns={visibleColumns}
      />
      
      <ParquetTableFooter 
        currentPage={data.currentPage}
        pageSize={data.pageSize}
        totalRows={data.totalRows}
        onPageChange={handlePageChangeInternal}
      />
    </div>
  );
};

export default ParquetTable;
