"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    const updatePageHeight = () => {
      if (containerRef.current) {
        // Calculate the effective height available for the PDF page
        // Subtract vertical padding from the container's height
        const style = getComputedStyle(containerRef.current);
        const paddingTop = parseInt(style.paddingTop, 10);
        const paddingBottom = parseInt(style.paddingBottom, 10);
        setPageHeight(containerRef.current.clientHeight - paddingTop - paddingBottom);
      }
    };

    updatePageHeight();
    window.addEventListener('resize', updatePageHeight);
    return () => window.removeEventListener('resize', updatePageHeight);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-full flex flex-col items-center"
    >
      {/* Floating Control Pill */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-10 z-50"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-black/50">
          <button
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-medium font-mono text-zinc-500 min-w-[3rem] text-center tabular-nums">
            {pageNumber} / {numPages || "-"}
          </span>
          
          <button
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-3 bg-white/10 mx-1" />

          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.1, 2.0))}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full overflow-hidden flex justify-center py-8 md:py-16" // Added py-8 and md:py-16 for responsiveness
      >
        {pageHeight && ( // Only render Document if pageHeight is calculated
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="outline-none h-full" // Ensure Document takes full height
            loading={
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-1 h-12 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-50 animate-pulse" />
                <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Decrypting PDF...</p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              height={pageHeight} // Pass the calculated height
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="bg-transparent" 
            />
          </Document>
        )}
      </div>
    </motion.div>
  );
}