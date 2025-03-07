import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParquetFile } from "@/lib/types";
import { formatFileSize, formatDate } from "@/lib/api";
import { FileIcon, DatabaseIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface FileCardProps {
  file: ParquetFile;
}

const FileCard = ({ file }: FileCardProps) => {
  return (
    <Link to={`/view/${file.id}`} className="block transition-transform hover:scale-[1.01]">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 w-full">
              <FileIcon className="h-5 w-5 text-blue-500" />
              <CardTitle className="truncate text-base font-medium" title={file.name}>
                {file.name}
              </CardTitle>
            </div>
          </div>
          <p className="text-xs text-muted-foreground opacity-70 truncate mt-1" title={file.path}>
            {file.path}
          </p>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="bg-blue-50 text-xs">
              {formatFileSize(file.size)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(file.lastModified)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FileCard;
