import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

// MathJax components (lazy loaded)
let mjModule: any = null;
let mjInitPromise: Promise<void> | null = null;

/**
 * Initialize MathJax lazily
 */
async function ensureMathJaxLoaded() {
  if (mjModule) return mjModule;
  
  if (!mjInitPromise) {
    mjInitPromise = (async () => {
      try {
        const [
          { mathjax },
          { TeX },
          { SVG },
          { liteAdaptor },
          { RegisterHTMLHandler },
          { AllPackages }
        ] = await Promise.all([
          import('mathjax-full/js/mathjax'),
          import('mathjax-full/js/input/tex'),
          import('mathjax-full/js/output/svg'),
          import('mathjax-full/js/adaptors/liteAdaptor'),
          import('mathjax-full/js/handlers/html'),
          import('mathjax-full/js/input/tex/AllPackages'),
        ]);
        
        const adaptor = liteAdaptor();
        RegisterHTMLHandler(adaptor);
        
        const tex = new TeX({
          packages: AllPackages,
        });
        
        const svg = new SVG({ fontCache: 'none' });
        const document = mathjax.document('', { InputJax: tex, OutputJax: svg });
        
        mjModule = { document, adaptor };
      } catch (error) {
        console.error('Failed to load MathJax:', error);
        // Reset the promise so future attempts can retry
        mjInitPromise = null;
        throw error;
      }
    })();
  }
  
  await mjInitPromise;
  return mjModule;
}

/**
 * Render with MathJax (fallback for expressions that KaTeX cannot handle)
 * Note: MathJax is lazy-loaded on first use, which may cause a brief delay
 */
async function renderWithMathJax(mathExpression: string, displayMode: boolean): Promise<string> {
  const mathJaxModule = await ensureMathJaxLoaded();
  const node = mathJaxModule.document.convert(mathExpression, { display: displayMode });
  return mathJaxModule.adaptor.innerHTML(node);
}

/**
 * Renders text with LaTeX math expressions
 * Uses KaTeX as primary renderer with MathJax as fallback for complex expressions
 * 
 * Supports:
 * - Inline math: $...$, \(...\)
 * - Display math: $$...$$, \[...\]
 * - Regular text mixed with math
 * - Chemistry expressions (mhchem) via MathJax fallback
 * - Common TeX extensions (physics, cancel, etc.) via MathJax fallback
 * 
 * Performance Notes:
 * - KaTeX renders synchronously and is very fast
 * - MathJax loads lazily on first KaTeX failure and renders asynchronously
 * - Multiple failed expressions are processed in parallel for better performance
 * - The component may show original content briefly while MathJax is loading/rendering
 * 
 * Security Notes:
 * - KaTeX is configured with `trust: true` to support advanced features
 * - Content should come from trusted sources only
 * - Non-math text is HTML-escaped for security
 * 
 * Limitations:
 * - Escaped delimiters (e.g., \$5) may be incorrectly parsed as math
 * - Nested delimiters are not supported
 * - TikZ diagrams are not supported (as specified in requirements)
 */
export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!content) {
      setRenderedContent('');
      return;
    }
    
    let cancelled = false;
    setIsProcessing(true);
    
    (async () => {
      try {
        // Pattern to match all supported math delimiters
        // Order matters: match longer delimiters first
        const mathPattern = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$((?:[^$\\]|\\.)+?)\$|\\\(((?:[^\\]|\\(?!\)))+?)\\\)/g;
        
        let lastIndex = 0;
        const parts: string[] = [];
        let match;
        const failedExpressions: Array<{ content: string; display: boolean }> = [];
        
        while ((match = mathPattern.exec(content)) !== null) {
          // Add text before the math expression
          if (match.index > lastIndex) {
            parts.push(escapeHtml(content.slice(lastIndex, match.index)));
          }
          
          // Determine the math content and display mode
          // match[1]: $$ ... $$
          // match[2]: \[ ... \]
          // match[3]: $ ... $
          // match[4]: \( ... \)
          const mathContent = match[1] || match[2] || match[3] || match[4];
          const isDisplayMath = match[1] !== undefined || match[2] !== undefined;
          
          // Try KaTeX first with permissive settings
          let katexFailed = false;
          
          try {
            const rendered = katex.renderToString(mathContent.trim(), {
              throwOnError: false, // Don't throw on errors
              displayMode: isDisplayMath || displayMode,
              trust: true, // Allow \url, \href, etc. - ensure content is from trusted sources
              strict: false, // Allow non-strict LaTeX
              output: 'html', // Use HTML output
            });
            
            // Check if KaTeX actually failed (it adds error class when throwOnError is false)
            if (rendered.includes('katex-error')) {
              katexFailed = true;
            } else {
              parts.push(rendered);
            }
          } catch (e) {
            katexFailed = true;
          }
          
          // Track failed expressions for MathJax fallback
          if (katexFailed) {
            parts.push(`<!--MATHJAX_PLACEHOLDER_${failedExpressions.length}-->`);
            failedExpressions.push({
              content: mathContent.trim(),
              display: isDisplayMath || displayMode,
            });
          }
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
          parts.push(escapeHtml(content.slice(lastIndex)));
        }
        
        let result = parts.join('');
        
        // Process failed expressions with MathJax in parallel for better performance
        if (failedExpressions.length > 0) {
          try {
            const mathjaxResults = await Promise.all(
              failedExpressions.map(async (expr, i) => {
                try {
                  const mathjaxSvg = await renderWithMathJax(expr.content, expr.display);
                  return { index: i, html: mathjaxSvg, success: true };
                } catch (mathjaxError) {
                  console.error('MathJax rendering failed for expression:', expr.content, mathjaxError);
                  return { 
                    index: i, 
                    html: `<span class="text-red-500">${escapeHtml(expr.content)}</span>`,
                    success: false 
                  };
                }
              })
            );
            
            // Replace all placeholders with rendered content
            mathjaxResults.forEach(({ index, html }) => {
              result = result.replace(`<!--MATHJAX_PLACEHOLDER_${index}-->`, html);
            });
          } catch (error) {
            console.error('MathJax fallback error:', error);
          }
        }
        
        if (!cancelled) {
          setRenderedContent(result);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (!cancelled) {
          setRenderedContent(escapeHtml(content));
          setIsProcessing(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [content, displayMode]);

  if (!content) return null;
  
  if (isProcessing && !renderedContent) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

export default LatexRenderer;
