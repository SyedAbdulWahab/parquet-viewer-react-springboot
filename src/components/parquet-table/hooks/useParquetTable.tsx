
import { useState, useEffect } from "react";
import { ParquetData } from "@/lib/types";

export function useParquetTable(data?: ParquetData) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<string>('');
  const [filteredData, setFilteredData] = useState<Record<string, any>[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.rows) {
      if (visibleColumns.size === 0 && data.columns.length > 0) {
        const initialColumns = new Set<string>();
        data.columns.forEach(col => initialColumns.add(col.name));
        setVisibleColumns(initialColumns);
      }
      
      let filtered = [...data.rows];
      if (filter.trim()) {
        const lowercaseFilter = filter.toLowerCase();
        filtered = filtered.filter(row => {
          return Object.values(row).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(lowercaseFilter);
          });
        });
      }
      
      if (sortColumn) {
        filtered.sort((a, b) => {
          const aValue = a[sortColumn];
          const bValue = b[sortColumn];
          
          if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
          if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc' 
              ? aValue.getTime() - bValue.getTime() 
              : bValue.getTime() - aValue.getTime();
          }
          
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
      }
      
      setFilteredData(filtered);
    }
  }, [data, filter, sortColumn, sortDirection, visibleColumns]);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  return {
    sortColumn,
    sortDirection,
    filter,
    filteredData,
    visibleColumns,
    handleSort,
    handleFilterChange,
    toggleColumnVisibility
  };
}
