import { SendIcon, CircleStopIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectedFile } from "@/store/types";
interface InputStopButtonProps {
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  handleSend: () => void;
  input: string;
  selectedFiles: SelectedFile[];
}

export function InputStopButton({
  isGenerating,
  onStopGenerating,
  handleSend,
  input,
  selectedFiles,
}: InputStopButtonProps) {
  return isGenerating ? (
    <Button
      type="button"
      onClick={onStopGenerating}
      variant="destructive"
      className="gap-2 h-[44px] px-4 shrink-0"
    >
      <CircleStopIcon className="h-4 w-4" />
      <span className="hidden sm:inline">停止</span>
    </Button>
  ) : (
    <Button
      type="submit"
      onClick={handleSend}
      disabled={!input.trim() && selectedFiles.length === 0}
      className="gap-2 h-[44px] px-4 shrink-0"
    >
      <SendIcon className="h-4 w-4" />
      <span className="hidden sm:inline">发送</span>
    </Button>
  );
}
