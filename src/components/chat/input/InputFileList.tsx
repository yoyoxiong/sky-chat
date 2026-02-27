import { SelectedFile } from "@/store/types";
import { XIcon, FileTextIcon } from "lucide-react";
interface InputFileListProps {
  selectedFiles: SelectedFile[];
  removeFile: (fileId: string) => void;
}

export function InputFileList({
  selectedFiles,
  removeFile,
}: InputFileListProps) {
  return (
    selectedFiles.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2 w-full overflow-hidden px-2">
        {selectedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-3 py-2 text-sm w-fit max-w-[200px] shrink-0"
          >
            <span className="truncate flex-1">{file.name}</span>
            <button
              type="button"
              onClick={() => removeFile(file.id)}
              className="ml-1 rounded-full hover:bg-background p-0.5 shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )
  );
}
