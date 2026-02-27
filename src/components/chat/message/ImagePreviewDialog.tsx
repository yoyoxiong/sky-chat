"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { X } from "lucide-react";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageAlt: string;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  imageAlt,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>生成的图片预览</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full">
          <DialogClose className="absolute top-1 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white">
            <X className="h-5 w-5" />
          </DialogClose>
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
