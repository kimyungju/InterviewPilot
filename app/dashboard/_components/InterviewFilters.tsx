"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface InterviewFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  sortOrder: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function InterviewFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedDifficulty,
  onDifficultyChange,
  sortOrder,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: InterviewFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("dashboard.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("dashboard.filterType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("dashboard.allTypes")}</SelectItem>
          <SelectItem value="general">{t("types.general")}</SelectItem>
          <SelectItem value="behavioral">{t("types.behavioral")}</SelectItem>
          <SelectItem value="technical">{t("types.technical")}</SelectItem>
          <SelectItem value="system-design">{t("types.system-design")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("dashboard.filterDifficulty")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("dashboard.allDifficulties")}</SelectItem>
          <SelectItem value="junior">{t("difficulties.junior")}</SelectItem>
          <SelectItem value="mid">{t("difficulties.mid")}</SelectItem>
          <SelectItem value="senior">{t("difficulties.senior")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("dashboard.sortBy")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t("dashboard.sortNewest")}</SelectItem>
          <SelectItem value="oldest">{t("dashboard.sortOldest")}</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="mr-1.5 h-4 w-4" /> {t("dashboard.clearFilters")}
        </Button>
      )}
    </div>
  );
}
