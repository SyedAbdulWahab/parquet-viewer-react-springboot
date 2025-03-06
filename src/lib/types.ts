
export interface ParquetFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: string;
  columnCount: number;
  rowCount: number;
}

export interface ParquetMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: string;
  createdAt: string;
  format: string;
  compression: string;
  schema: ParquetColumn[];
  rowCount: number;
  statistics?: {
    totalSize: number;
    rowGroups: number;
    averageRowGroupSize: number;
  }
}

export interface ParquetColumn {
  name: string;
  type: string;
  nullable: boolean;
  statistics?: {
    min?: string | number;
    max?: string | number;
    nullCount?: number;
    distinctCount?: number;
  }
}

export interface ParquetData {
  columns: ParquetColumn[];
  rows: Record<string, any>[];
  totalRows: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
