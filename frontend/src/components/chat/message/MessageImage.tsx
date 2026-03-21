"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { useState } from "react";

interface MessageImageProps {
  imageUrl?: string;
  isGeneratingImage?: boolean;
  generateImageError?: string;
  imageAlt?: string;
}

export function MessageImage({
  imageUrl,
  isGeneratingImage,
  generateImageError,
  imageAlt = "Generated image",
}: MessageImageProps) {
  // 新增：控制预览大图 Dialog 的状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 生成中状态
  if (isGeneratingImage) {
    return (
      <div className="flex flex-col gap-3 py-6 justify-center items-center w-full">
        <div className="relative w-full max-w-sm aspect-[9/16] rounded-lg bg-accent/50 animate-pulse overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-accent/10" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 animate-spin text-blue-500" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          正在生成图片，预计2-3秒...
        </p>
      </div>
    );
  }

  // 错误状态
  if (generateImageError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 mb-3">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{generateImageError}</span>
      </div>
    );
  }

  // 正常图片展示
  if (imageUrl) {
    return (
      <>
        {/* 缩略图展示 */}
        <div className="my-3 w-full max-w-xs overflow-hidden rounded-md border border-border">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="block w-full cursor-pointer"
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-auto object-contain rounded-md hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </button>
        </div>

        {/* 预览大图 Dialog */}
        <ImagePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
        />
      </>
    );
  }

  return null;
}
