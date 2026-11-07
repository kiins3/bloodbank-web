"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Search box that reports its value 300 ms after the user stops typing. */
export function SearchInput({
  onSearch,
  placeholder = "Tìm kiếm",
  className,
}: {
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const callback = useRef(onSearch);
  const first = useRef(true);

  useEffect(() => {
    callback.current = onSearch;
  });

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => callback.current(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} className="pl-8" />
    </div>
  );
}
