import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "lucide-react";
import { useFileUpload, ALLOWED_FILE_EXTENSIONS } from "@/hooks/useFileUpload";
import { useRef, useId } from "react";
interface InputFileSelectorProps {
  disabled?: boolean;
  isGenerating?: boolean;
}
export function InputFileSelector({
  disabled,
  isGenerating,
}: InputFileSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const { handleFileSelect } = useFileUpload();
  return (
    <>
      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_EXTENSIONS}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isGenerating}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-[44px] w-[44px] shrink-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isGenerating}
      >
        <PaperclipIcon className="h-5 w-5" />
      </Button>
    </>
  );
}
