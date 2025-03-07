import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DownloadButtonProps {
  fileId: string;
}

const DownloadButton = ({ fileId }: DownloadButtonProps) => {
  const downloadUrl = (format: string) => `http://localhost:8080/api/files/${fileId}/download?format=${format}`;

  const handleDownload = (format: string) => {
    window.location.href = downloadUrl(format);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload('csv')}>
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('excel')}>
          Download as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadButton;
