import { MessageSquare, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface ChatInputProps {
  mode: "chat" | "draw";
  setMode: (mode: "chat" | "draw") => void;
}
export function InputMode({ mode, setMode }: ChatInputProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setMode("chat")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          mode === "chat"
            ? "bg-accent text-foreground" // 选中状态，和DeepSeek一致
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground", // 未选中hover效果
        )}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        聊天模式
      </button>
      <button
        type="button"
        onClick={() => setMode("draw")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
          mode === "draw"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        <ImageIcon className="h-3.5 w-3.5" />
        画图模式
      </button>
    </div>
  );
}
