import { SendIcon, CircleStopIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectedFile } from "@/store/types";

interface InputButtonProps {
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  handleSend: () => void;
  input: string;
  selectedFiles: SelectedFile[];
}

export function InputButton({
  isGenerating,
  onStopGenerating,
  handleSend,
  input,
  selectedFiles,
}: InputButtonProps) {
  return isGenerating ? (
    <Button
      type="button"
      onClick={onStopGenerating}
      variant="destructive"
      className="h-8 w-8 rounded-full p-0 shrink-0"
    >
      <CircleStopIcon className="h-4 w-4" />
    </Button>
  ) : (
    <Button
      type="submit"
      onClick={handleSend}
      disabled={!input.trim() && selectedFiles.length === 0}
      className="h-8 w-8 rounded-full p-0 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      <SendIcon className="h-4 w-4" />
    </Button>
  );
}
