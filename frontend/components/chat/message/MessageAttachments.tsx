"use client";

import { FileMeta } from "@/store/types";
import { FileTextIcon } from "lucide-react";

interface MessageAttachmentsProps {
  fileAttachments?: FileMeta[];
}

export function MessageAttachments({
  fileAttachments,
}: MessageAttachmentsProps) {
  if (!fileAttachments || fileAttachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-1 justify-end">
      {fileAttachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm w-fit max-w-[200px]"
        >
          <FileTextIcon className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="truncate flex-1 text-blue-700 dark:text-blue-300">
            {file.name}
          </span>
        </div>
      ))}
    </div>
  );
}
