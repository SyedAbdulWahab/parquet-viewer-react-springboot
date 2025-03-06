
import { ParquetFile } from "@/lib/types";
import { formatFileSize, formatDate } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { MouseEvent, useState } from "react";
import { FileText, ArrowUpDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface FileExplorerProps {
  files: ParquetFile[];
  isLoading: boolean;
  selectedFile?: ParquetFile;
  onFileSelect: (file: ParquetFile) => void;
}

type SortField = 'name' | 'size' | 'lastModified' | 'rowCount';
type SortDirection = 'asc' | 'desc';

const FileExplorer = ({ 
  files, 
  isLoading, 
  selectedFile, 
  onFileSelect 
}: FileExplorerProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleFileClick = (file: ParquetFile) => {
    onFileSelect(file);
    navigate(`/file/${file.id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'lastModified':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        break;
      case 'rowCount':
        comparison = a.rowCount - b.rowCount;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleCardClick = (e: MouseEvent<HTMLDivElement>, file: ParquetFile) => {
    e.preventDefault();
    handleFileClick(file);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => handleSort('name')}
          >
            Name
            {sortField === 'name' && (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => handleSort('size')}
          >
            Size
            {sortField === 'size' && (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => handleSort('lastModified')}
          >
            Modified
            {sortField === 'lastModified' && (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => handleSort('rowCount')}
          >
            Rows
            {sortField === 'rowCount' && (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-13rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {sortedFiles.map((file) => (
            <Card 
              key={file.id} 
              className={`overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer ${
                selectedFile?.id === file.id ? 'ring-1 ring-primary' : ''
              }`}
              onClick={(e) => handleCardClick(e, file)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <CardTitle className="text-lg">{file.name}</CardTitle>
                <CardDescription className="text-xs">
                  {file.path}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last modified:</span>
                  <span>{formatDate(file.lastModified)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Columns:</span>
                  <span>{file.columnCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rows:</span>
                  <span>{file.rowCount.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="w-full text-xs flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileClick(file);
                  }}
                >
                  <Info className="mr-2 h-3.5 w-3.5" />
                  View Data
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {sortedFiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>No parquet files found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileExplorer;
