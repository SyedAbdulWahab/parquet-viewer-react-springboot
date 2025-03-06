
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({ onSearch, placeholder = "Search..." }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="relative flex w-full max-w-sm items-center"
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-12 bg-background border border-input focus-visible:ring-1 focus-visible:ring-ring"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-10 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <Button
        type="submit"
        size="sm"
        className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
