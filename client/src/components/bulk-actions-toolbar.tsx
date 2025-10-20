import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag, X } from "lucide-react";
import type { EmailCategory } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsToolbarProps {
  selectedEmailIds: string[];
  onClearSelection: () => void;
}

const CATEGORIES: readonly EmailCategory[] = [
  "Interested",
  "Meeting Booked",
  "Not Interested",
  "Spam",
  "Out of Office"
];

export function BulkActionsToolbar({ selectedEmailIds, onClearSelection }: BulkActionsToolbarProps) {
  const { toast } = useToast();

  const bulkCategorizeMutation = useMutation({
    mutationFn: async (category: EmailCategory) => {
      return apiRequest("PATCH", "/api/emails/bulk/category", {
        emailIds: selectedEmailIds,
        category,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Bulk categorization complete",
        description: data.message || `Successfully categorized ${selectedEmailIds.length} email(s)`,
      });
      onClearSelection();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to categorize emails",
        variant: "destructive",
      });
    },
  });

  if (selectedEmailIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 border-b bg-accent/50">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" data-testid="badge-selected-count">
          {selectedEmailIds.length} selected
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={bulkCategorizeMutation.isPending}
              data-testid="button-bulk-categorize"
            >
              <Tag className="h-4 w-4 mr-2" />
              Categorize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CATEGORIES.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => bulkCategorizeMutation.mutate(category)}
                data-testid={`dropdown-bulk-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        data-testid="button-clear-selection"
      >
        <X className="h-4 w-4 mr-2" />
        Clear
      </Button>
    </div>
  );
}
