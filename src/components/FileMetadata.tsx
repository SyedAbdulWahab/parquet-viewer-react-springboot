import { ParquetMetadata } from "@/lib/types";
import { formatFileSize, formatDate } from "@/lib/api";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Database, Table } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FileMetadataProps {
  metadata?: ParquetMetadata;
  isLoading: boolean;
}

const FileMetadata = ({ metadata, isLoading }: FileMetadataProps) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>File Metadata</CardTitle>
          <CardDescription>No metadata available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full animate-in fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
          <CardTitle className="truncate text-lg" style={{ width: "calc(100% - 30px)" }}>
            {metadata.name}
          </CardTitle>
        </div>
        <CardDescription className="truncate mt-1 text-sm">
          {metadata.path}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="schema" className="text-sm">
              Schema
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-sm">
              Statistics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    File Size
                  </div>
                  <div className="text-lg">{formatFileSize(metadata.size)}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Total Rows
                  </div>
                  <div className="text-lg">{metadata.rowCount.toLocaleString()}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Columns
                  </div>
                  <div className="text-lg">{metadata.schema.length}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Format
                  </div>
                  <div className="text-lg">{metadata.format}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  File Details
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(metadata.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Last Modified</span>
                    <span>{formatDate(metadata.lastModified)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Compression</span>
                    <span>{metadata.compression}</span>
                  </div>
                  {metadata.statistics && (
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Row Groups</span>
                      <span>{metadata.statistics.rowGroups}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Path</span>
                    <span className="truncate max-w-[250px]">{metadata.path}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schema" className="h-[400px]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-primary" />
                  <div className="text-sm font-medium">
                    Schema Definition ({metadata.schema.length} columns)
                  </div>
                </div>
                
                <div className="space-y-3">
                  {metadata.schema.map((column, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-md border bg-card transition-all hover:shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {column.name}
                          {column.nullable && (
                            <span className="text-xs ml-2 text-muted-foreground">
                              (nullable)
                            </span>
                          )}
                        </div>
                        <div className="text-sm px-2 py-0.5 rounded-full bg-muted">
                          {column.type}
                        </div>
                      </div>
                      
                      {column.statistics && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {column.statistics.nullCount !== undefined && (
                            <div>Null count: {column.statistics.nullCount}</div>
                          )}
                          {column.statistics.distinctCount !== undefined && (
                            <div>Distinct values: {column.statistics.distinctCount}</div>
                          )}
                          {column.statistics.min !== undefined && (
                            <div>Min: {column.statistics.min}</div>
                          )}
                          {column.statistics.max !== undefined && (
                            <div>Max: {column.statistics.max}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Table className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">File Statistics</div>
              </div>
              
              {metadata.statistics ? (
                <div className="space-y-3">
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Total Size
                    </div>
                    <div>{formatFileSize(metadata.statistics.totalSize)}</div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Row Groups
                    </div>
                    <div>{metadata.statistics.rowGroups}</div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Average Row Group Size
                    </div>
                    <div>{formatFileSize(metadata.statistics.averageRowGroupSize)}</div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Rows Per Group (avg)
                    </div>
                    <div>
                      {Math.round(metadata.rowCount / metadata.statistics.rowGroups).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm p-4 bg-muted rounded-md">
                  No detailed statistics available for this file
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FileMetadata;
