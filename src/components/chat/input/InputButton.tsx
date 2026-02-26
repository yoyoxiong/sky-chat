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
    // ✅ 停止生成按钮：圆形、红色、只有停止图标
    <Button
      type="button"
      onClick={onStopGenerating}
      variant="destructive"
      className="h-10 w-10 rounded-full p-0 shrink-0 shadow-md hover:shadow-lg transition-all"
    >
      <CircleStopIcon className="h-5 w-5" />
    </Button>
  ) : (
    // ✅ 发送按钮：圆形、品牌蓝、只有纸飞机图标
    <Button
      type="submit"
      onClick={handleSend}
      disabled={!input.trim() && selectedFiles.length === 0}
      className="h-10 w-10 rounded-full p-0 shrink-0 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none"
    >
      <SendIcon className="h-5 w-5" />
    </Button>
  );
}
