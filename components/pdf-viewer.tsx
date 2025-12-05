"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  file: File;
}

export function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState<number | undefined>(undefined);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          // Use content rect height. Subtract small buffer for borders/shadows (e.g. 20px)
          setPageHeight(entry.contentRect.height - 20); 
          setPageWidth(entry.contentRect.width - 24); // small padding allowance
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-full flex flex-col items-center bg-[#080808]"
    >
      {/* Floating Control Pill */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-6 z-50 pointer-events-auto"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-full shadow-lg">
          <button
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          <span className="text-[10px] font-medium font-mono text-zinc-500 min-w-[2rem] text-center tabular-nums">
            {pageNumber}/{numPages || "-"}
          </span>
          
          <button
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <div className="w-px h-3 bg-white/10 mx-1" />

          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.1, 2.0))}
            className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 custom-scrollbar"
      >
        {pageHeight && pageWidth && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="outline-none flex items-center justify-center"
            loading={
              <div className="flex flex-col items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              width={pageWidth}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="bg-white shadow-2xl border border-white/5 rounded-sm overflow-hidden" 
            />
          </Document>
        )}
      </div>
    </motion.div>
  );
}