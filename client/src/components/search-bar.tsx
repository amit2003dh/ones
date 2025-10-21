import { Search, X, Loader2 } from "lucide-react";
import { useState } from "react";

// Mock components for Input and Button as in the original code.
// In a real app, you would import these from your UI library (e.g., shadcn/ui).
const Input = ({ className, ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Button = ({ className, ...props }) => (
    <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground ${className}`}
        {...props}
    />
);


// Utility function to merge class names, similar to the original.
const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, placeholder = "Search...", isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const showClearButton = query && !isLoading;
  const showLoadingIcon = query && isLoading;

  return (
    // The main container is now responsive.
    // It takes the full width on mobile and has a max-width on larger screens.
    <div className="relative w-full max-w-sm mx-auto">
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
        isLoading && query ? "text-blue-500" : "text-gray-400"
      )} />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-9 w-full"
        data-testid="input-search"
      />
      {showLoadingIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" data-testid="icon-search-loading" />
        </div>
      )}
      {showClearButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          data-testid="button-clear-search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Main App component to demonstrate the SearchBar
export default function App() {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            setLoading(true);
            // Simulate a network request
            setTimeout(() => {
                setLoading(false);
            }, 1500);
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
             <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Component Preview</h1>
                <SearchBar onSearch={handleSearch} isLoading={loading} placeholder="Search for anything..."/>
                <div className="mt-6 text-center text-gray-400">
                    <p>Searching for: <span className="font-medium text-white">{searchQuery || "..."}</span></p>
                    <p>Loading status: <span className={`font-medium ${loading ? 'text-blue-400' : 'text-green-400'}`}>{loading ? 'In Progress' : 'Idle'}</span></p>
                </div>
            </div>
        </div>
    )
}
