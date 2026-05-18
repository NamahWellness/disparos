"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function TagInput({ value, onChange, suggestions = [], placeholder = "Buscar ou criar tag…" }: TagInputProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = input.trim().toLowerCase();
  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(query) && !value.includes(s)
  );
  const canCreate = input.trim() !== "" && !value.includes(input.trim()) && !suggestions.some((s) => s.toLowerCase() === query);
  const options = filtered.length + (canCreate ? 1 : 0);

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setInput("");
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < filtered.length) {
        addTag(filtered[highlighted]);
      } else if (highlighted === filtered.length && canCreate) {
        addTag(input.trim());
      } else if (input.trim()) {
        addTag(input.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % options || 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? options - 1 : h - 1));
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = open && (filtered.length > 0 || canCreate);

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
        className={`flex flex-wrap gap-1.5 rounded-lg border px-2.5 py-2 min-h-[38px] cursor-text transition-colors ${
          open ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 pl-2.5 pr-1 py-0.5 text-xs font-medium text-indigo-700"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-gray-400 py-0.5"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {filtered.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                highlighted === i ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
              {tag}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(input.trim()); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-t border-gray-50 ${
                highlighted === filtered.length ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              Criar tag <span className="font-semibold text-gray-900 ml-0.5">"{input.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
