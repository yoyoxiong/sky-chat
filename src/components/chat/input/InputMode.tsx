interface ChatInputProps {
  mode: "chat" | "draw";
  setMode: (mode: "chat" | "draw") => void;
}
export function InputMode({ mode, setMode }: ChatInputProps) {
  return (
    <div className="flex mb-2 rounded-md bg-accent/30 p-1 w-fit">
      <button
        type="button"
        onClick={() => setMode("chat")}
        className={`px-3 py-1 rounded-md text-sm transition-all ${mode === "chat" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
      >
        聊天模式
      </button>
      <button
        type="button"
        onClick={() => setMode("draw")}
        className={`px-3 py-1 rounded-md text-sm transition-all ${mode === "draw" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
      >
        画图模式
      </button>
    </div>
  );
}
