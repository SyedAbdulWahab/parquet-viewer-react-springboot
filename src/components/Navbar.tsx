
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="w-full h-16 bg-background/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-primary" />
        <span 
          className="text-xl font-medium cursor-pointer" 
          onClick={() => navigate("/")}
        >
          Parquet Viewer
        </span>
      </div>
      
      <form onSubmit={handleSearch} className="max-w-md w-full mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-10 bg-accent/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          Files
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
