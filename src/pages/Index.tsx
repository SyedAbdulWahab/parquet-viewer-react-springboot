
import { useState, useEffect } from "react";
import { fetchParquetFiles } from "@/lib/api";
import { ParquetFile } from "@/lib/types";
import Navbar from "@/components/Navbar";
import FileExplorer from "@/components/FileExplorer";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [files, setFiles] = useState<ParquetFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ParquetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ParquetFile | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetchParquetFiles();
        if (response.status === 'success') {
          setFiles(response.data);
          setFilteredFiles(response.data);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load parquet files",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading files:", error);
        toast({
          title: "Error",
          description: "Failed to load parquet files",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [toast]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredFiles(files);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = files.filter((file) => 
      file.name.toLowerCase().includes(lowercaseQuery) || 
      file.path.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredFiles(filtered);
  };

  const handleFileSelect = (file: ParquetFile) => {
    setSelectedFile(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in">
      <Navbar onSearch={handleSearch} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-medium tracking-tight">Parquet Files</h1>
          <p className="text-muted-foreground mt-1">
            Browse and view parquet files stored in your S3 bucket
          </p>
        </div>
        
        <FileExplorer 
          files={filteredFiles} 
          isLoading={isLoading} 
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
        />
      </main>
    </div>
  );
};

export default Index;
