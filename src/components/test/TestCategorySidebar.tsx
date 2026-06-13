import { useMemo } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  id: string;     // section_id or special key like "__all__" / subject slug
  name: string;
  group: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CategoryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const GROUP_ORDER = [
  "PhyNetix Mock Tests",
  "PYQs as Mock Tests",
  "Topic & Chapter-wise Tests",
  "Other",
];

export function classifyGroup(name: string): string {
  const n = name.toLowerCase();
  if (/(qpt|qft|part test|full test|mock)/.test(n)) return "PhyNetix Mock Tests";
  if (/pyq/.test(n)) return "PYQs as Mock Tests";
  if (/^(physics|chemistry|mathematics|maths|biology)/.test(n)) return "Topic & Chapter-wise Tests";
  return "Other";
}

export default function TestCategorySidebar({ open, onClose, items, selectedId, onSelect }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    for (const it of items) {
      const arr = map.get(it.group) || [];
      arr.push(it);
      map.set(it.group, arr);
    }
    return GROUP_ORDER
      .map((g) => ({ group: g, items: map.get(g) || [] }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transform transition-transform overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">All Tests</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-2">
          <button
            onClick={() => { onSelect("__all__"); onClose(); }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm",
              selectedId === "__all__" ? "bg-primary/20 text-primary border border-primary/40" : "hover:bg-secondary/60"
            )}
          >
            <span>All Tests</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {grouped.map(({ group, items }) => (
          <div key={group} className="px-2 pb-3">
            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </div>
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => { onSelect(it.id); onClose(); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm",
                  selectedId === it.id ? "bg-primary/20 text-primary border border-primary/40" : "hover:bg-secondary/60"
                )}
              >
                <span className="truncate">{it.name}</span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}
