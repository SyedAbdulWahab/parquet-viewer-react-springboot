import { ParquetFile, ParquetMetadata, ParquetData, ParquetColumn, ApiResponse } from "@/lib/types";

const API_BASE_URL = '/api'; // This will be proxied to your Spring Boot backend

/**
 * Fetches all parquet files from the server
 */
export async function fetchParquetFiles(): Promise<ApiResponse<ParquetFile[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/files`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: 'success'
    };
  } catch (error) {
    console.error('Error fetching parquet files:', error);
    return {
      data: [],
      status: 'error',
      message: 'Failed to fetch parquet files'
    };
  }
}

/**
 * Fetches metadata for a specific parquet file
 */
export async function fetchParquetMetadata(fileId: string): Promise<ApiResponse<ParquetMetadata>> {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/metadata`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: 'success'
    };
  } catch (error) {
    console.error('Error fetching parquet metadata:', error);
    return {
      data: {} as ParquetMetadata,
      status: 'error',
      message: 'Failed to fetch parquet metadata'
    };
  }
}

/**
 * Fetches data from a specific parquet file
 */
export async function fetchParquetData(
  fileId: string, 
  page: number = 0, 
  pageSize: number = 50
): Promise<ApiResponse<ParquetData>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/files/${fileId}/data?page=${page}&pageSize=${pageSize}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: 'success'
    };
  } catch (error) {
    console.error('Error fetching parquet data:', error);
    return {
      data: {
        columns: [],
        rows: [],
        totalRows: 0,
        currentPage: 0,
        pageSize
      },
      status: 'error',
      message: 'Failed to fetch parquet data'
    };
  }
}

/**
 * Generates mock column definitions
 */
function generateMockColumns(count: number): ParquetColumn[] {
  const columnTypes = ['string', 'integer', 'double', 'boolean', 'timestamp', 'date'];
  const columns: ParquetColumn[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = columnTypes[Math.floor(Math.random() * columnTypes.length)];
    const nullable = Math.random() > 0.7;
    
    columns.push({
      name: `column_${i + 1}`,
      type,
      nullable,
      statistics: {
        nullCount: nullable ? Math.floor(Math.random() * 1000) : 0,
        distinctCount: Math.floor(Math.random() * 10000)
      }
    });
  }
  
  return columns;
}

/**
 * Generates mock data rows
 */
function generateMockRows(columnCount: number, rowCount: number): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    
    for (let j = 0; j < columnCount; j++) {
      const colName = `column_${j + 1}`;
      
      // Generate different data types
      if (j % 5 === 0) {
        row[colName] = `Value ${i}-${j}`;
      } else if (j % 5 === 1) {
        row[colName] = Math.floor(Math.random() * 10000);
      } else if (j % 5 === 2) {
        row[colName] = parseFloat((Math.random() * 1000).toFixed(2));
      } else if (j % 5 === 3) {
        row[colName] = Math.random() > 0.5;
      } else {
        row[colName] = new Date().toISOString().split('T')[0];
      }
    }
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}
