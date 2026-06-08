import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ScrollPDFViewerProps {
  pdfUrl: string;
  onLoadComplete?: (numPages: number) => void;
  targetPage?: number;
  onPageChange?: (page: number) => void;
}

export default function ScrollPDFViewer({ 
  pdfUrl, 
  onLoadComplete,
  targetPage,
  onPageChange
}: ScrollPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastScrolledPage = useRef<number | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    onLoadComplete?.(numPages);
  }, [onLoadComplete]);

  // Scroll to target page when it changes - only if it's a valid page number
  useEffect(() => {
    // Skip if targetPage is undefined/null or same as last scrolled page
    if (!targetPage || targetPage === lastScrolledPage.current) return;
    
    if (pageRefs.current.has(targetPage)) {
      const pageElement = pageRefs.current.get(targetPage);
      pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      lastScrolledPage.current = targetPage;
    }
  }, [targetPage]);

  // Track current visible page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 3;

      let closestPage = 1;
      let closestDistance = Infinity;

      pageRefs.current.forEach((element, pageNum) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
        onPageChange?.(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage, onPageChange]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1.0);

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const setPageRef = (pageNum: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageNum, element);
    } else {
      pageRefs.current.delete(pageNum);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-secondary/30 rounded-lg overflow-hidden select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentPage} / {numPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content - Scroll View */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null}
          className="flex flex-col items-center gap-4"
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div 
              key={index + 1} 
              ref={(el) => setPageRef(index + 1, el)}
              className="relative"
            >
              <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-background/80 text-xs font-medium">
                Page {index + 1}
              </div>
              <Page
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
