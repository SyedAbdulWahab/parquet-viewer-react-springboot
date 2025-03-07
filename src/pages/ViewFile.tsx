
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchParquetMetadata, fetchParquetData } from "@/lib/api";
import { ParquetMetadata, ParquetData } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ParquetTable from "@/components/parquet-table/ParquetTable";
import FileMetadata from "@/components/FileMetadata";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft } from "lucide-react";

const ViewFile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [metadata, setMetadata] = useState<ParquetMetadata | undefined>(undefined);
  const [tableData, setTableData] = useState<ParquetData | undefined>(undefined);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const response = await fetchParquetMetadata(id);
        if (response.status === 'success') {
          setMetadata(response.data);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load file metadata",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading metadata:", error);
        toast({
          title: "Error",
          description: "Failed to load file metadata",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetchParquetData(id, currentPage, pageSize);
        if (response.status === 'success') {
          setTableData(response.data);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load file data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load file data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [id, currentPage, pageSize, toast]);

  const handleSearch = (query: string) => {
    // Implement search within the current file data
    console.log("Searching in file data:", query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in">
      <Navbar onSearch={handleSearch} />
      
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to files
          </Button>
          
          <h1 className="text-3xl font-medium tracking-tight">
            {isLoadingMetadata ? 'Loading...' : metadata?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            View and explore parquet file data
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
          <div className="lg:col-span-1">
            <FileMetadata 
              metadata={metadata} 
              isLoading={isLoadingMetadata} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <ParquetTable 
              data={tableData} 
              isLoading={isLoadingData}
              fileId={id}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewFile;
