import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ParquetData } from "@/lib/types";

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
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Toggle column selection
  const toggleColumnSelection = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter(col => col !== columnName));
    } else {
      setSelectedColumns([...selectedColumns, columnName]);
    }
  };
  
  // Get visible columns (all if none selected)
  const visibleColumns = data?.columns && selectedColumns.length > 0 
    ? data.columns.filter(col => selectedColumns.includes(col.name))
    : data?.columns || [];
  
  const totalPages = data ? Math.ceil(data.totalRows / data.pageSize) : 0;
  const currentPage = data?.currentPage || 0;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Data</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              Rows per page:
            </span>
            <Select 
              value={data.pageSize.toString()}
              onValueChange={(val) => onPageSizeChange && onPageSizeChange(parseInt(val))}
            >
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue placeholder={data.pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Wrap table in a div with horizontal scrolling */}
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.name}
                    className="whitespace-nowrap font-medium"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({column.type})
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={`${rowIndex}-${column.name}`}
                      className="max-w-xs truncate"
                      title={row[column.name]?.toString()}
                    >
                      {row[column.name] !== null && row[column.name] !== undefined 
                        ? String(row[column.name]) 
                        : <span className="text-muted-foreground italic">null</span>
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing {data.currentPage * data.pageSize + 1} to{" "}
            {Math.min((data.currentPage + 1) * data.pageSize, data.totalRows)} of{" "}
            {data.totalRows} rows
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParquetTable;
