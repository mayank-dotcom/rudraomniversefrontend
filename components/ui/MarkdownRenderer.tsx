"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { Copy, Check, FileDown } from "lucide-react";
interface MarkdownRendererProps {
    content: string;
    isDarkMode: boolean;
    onDownloadImage?: (url: string, filename?: string) => void;
    isImageCompact?: boolean;
    isGenerating?: boolean;
}

function decodeLenient(base64Str: string): string {
    try {
        const clean = base64Str.replace(/[^A-Za-z0-9+\/]/g, "");
        const padLength = (4 - (clean.length % 4)) % 4;
        const padded = clean + "=".repeat(padLength);
        const raw = atob(padded);
        try {
            return decodeURIComponent(escape(raw));
        } catch {
            return raw;
        }
    } catch {
        return "";
    }
}


function getCleanMermaidCode(code: string): string {
    const trimmed = code.trim();
    if (!trimmed) return "";
    
    // Only attempt base64 decoding on known base64-encoded mermaid prefixes.
    // JSV7 = base64 of "%%{" (init config), eyJ = base64 of "{" (JSON init)
    // This prevents normal mermaid syntax from being falsely treated as base64.
    if (trimmed.startsWith("JSV7") || trimmed.startsWith("eyJ")) {
        const decoded = decodeLenient(trimmed);
        if (decoded && (
            decoded.includes("%%{") ||
            decoded.includes("graph") ||
            decoded.includes("mindmap") ||
            decoded.includes("sequenceDiagram") ||
            decoded.includes("flowchart") ||
            decoded.includes("gantt") ||
            decoded.includes("classDiagram") ||
            decoded.includes("xychart") ||
            decoded.includes("pie") ||
            decoded.includes("stateDiagram") ||
            decoded.includes("erDiagram") ||
            decoded.includes("journey") ||
            decoded.includes("gitGraph")
        )) {
            return decoded;
        }
    }
    return code;
}

function buildMermaidUrl(code: string): string {
    try {
        const cleanCode = getCleanMermaidCode(code);
        const base64 = btoa(unescape(encodeURIComponent(cleanCode)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        return `https://mermaid.ink/img/${base64}?type=png`;
    } catch {
        return "";
    }
}


function CodeBlock({ code, language, isDarkMode }: { code: string; language: string; isDarkMode: boolean }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(trimmedCode);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = trimmedCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{
      border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "#000"}`,
    }}>
      <div className="flex items-center gap-1.5 px-4 py-2" style={{
        background: isDarkMode ? "#1a1a1a" : "#000",
        borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
      }}>
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        <span className={`text-[9px] font-mono uppercase tracking-widest ml-2 ${isDarkMode ? "text-white/30" : "text-white/60"}`}>
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md transition-all hover:bg-white/15 active:scale-90 border border-white/10"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className={`h-4 w-4 ${isDarkMode ? "text-white/60" : "text-white/70"}`} />
          )}
          <span className={`text-[10px] font-mono ${copied ? "text-green-400" : isDarkMode ? "text-white/40" : "text-white/60"}`}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={isDarkMode ? oneDark : oneLight}
        customStyle={{
          background: isDarkMode ? "#0d0d0d" : "#f9fafb",
          padding: "1rem",
          margin: 0,
          fontSize: "0.875rem",
          fontFamily: "var(--font-mono)",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

function MermaidImage({ code, onDownloadImage, isGenerating }: { code: string; onDownloadImage?: (url: string, filename?: string) => void; isGenerating?: boolean }) {
    const [imgSrc, setImgSrc] = React.useState(isGenerating ? "" : buildMermaidUrl(code));
    const [hasError, setHasError] = React.useState(false);

    const prevGenerating = React.useRef(isGenerating);
    React.useEffect(() => {
        const wasGenerating = prevGenerating.current;
        prevGenerating.current = isGenerating;

        if (wasGenerating && !isGenerating) {
            setImgSrc(buildMermaidUrl(code));
            setHasError(false);
        } else if (!isGenerating && !imgSrc) {
            setImgSrc(buildMermaidUrl(code));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGenerating]);

    if (isGenerating) {
        return (
            <div className="my-4 w-full h-[200px] rounded-lg animate-pulse flex items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-accent animate-spin" />
                    <span className="text-xs font-mono text-white/40">Generating diagram...</span>
                </div>
            </div>
        );
    }

    if (!imgSrc) return null;

    if (hasError) {
        return (
            <div className="my-4 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-4">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-mono text-white/60">Diagram could not be rendered</span>
                    <pre className="text-[10px] font-mono text-white/40 whitespace-pre-wrap break-all max-h-[120px] overflow-auto w-full">{code}</pre>
                </div>
            </div>
        );
    }

    return (
        <span className="block my-4 relative group/img-wrapper min-h-[100px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
                src={imgSrc} 
                alt="Mermaid diagram" 
                className="max-w-full h-auto rounded-lg opacity-100 scale-100 transition-all duration-300"
                onError={() => setHasError(true)}
            />
            {onDownloadImage && (
                <button
                    onClick={() => onDownloadImage(imgSrc)}
                    title="Download Image"
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 shadow-lg backdrop-blur-md opacity-0 group-hover/img-wrapper:opacity-100 transition-all duration-300 scale-90 group-hover/img-wrapper:scale-100 flex items-center justify-center gap-1 hover:scale-105 active:scale-95"
                    style={{ "--hover-color": "var(--brand-accent)" } as React.CSSProperties}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--brand-accent)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "" }}
                >
                    <FileDown className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-mono uppercase tracking-wider font-bold pr-0.5">Download</span>
                </button>
            )}
        </span>
    );
}

export default function MarkdownRenderer({ content, isDarkMode, onDownloadImage, isImageCompact, isGenerating = false }: MarkdownRendererProps) {
    const processedContent = React.useMemo(() => {
        let processed = content;
        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
        processed = processed.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
        processed = processed.replace(/!\[.*?\]\(\)/g, '');
        processed = processed.replace(/\]\((?:image_url|placeholder)\)/g, ']()');

        // Extract all mermaid blocks
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        const blocks: string[] = [];
        let match;
        while ((match = mermaidRegex.exec(processed)) !== null) {
            blocks.push(match[1].trim());
        }

        // Deduplicate and filter mermaid.ink URLs to prevent duplicate rendering
        const seenMermaidUrls = new Set<string>();
        
        // Remove markdown images: ![alt](url) matching mermaid.ink, or keep the first if no code blocks are present
        processed = processed.replace(/!\[.*?\]\((https?:\/\/mermaid\.ink\/[^)]+)\)/g, (match, url) => {
            if (blocks.length > 0) {
                return '';
            }
            if (seenMermaidUrls.has(url)) {
                return '';
            }
            seenMermaidUrls.add(url);
            return match;
        });

        // Remove markdown links: [text](url) matching mermaid.ink, or keep the first if no code blocks are present
        processed = processed.replace(/(?<!\!)\[.*?\]\((https?:\/\/mermaid\.ink\/[^)]+)\)/g, (match, url) => {
            if (blocks.length > 0) {
                return '';
            }
            if (seenMermaidUrls.has(url)) {
                return '';
            }
            seenMermaidUrls.add(url);
            return match;
        });

        // Remove raw/plain mermaid.ink URLs
        processed = processed.replace(/(https?:\/\/mermaid\.ink\/\S+)/g, (match, url) => {
            if (blocks.length > 0 || seenMermaidUrls.has(url)) {
                return '';
            }
            seenMermaidUrls.add(url);
            return match;
        });

        // Remove anything related to kroki.io (markdown images, plain URLs)
        processed = processed.replace(/!\[.*?\]\(https?:\/\/kroki\.io[^\s)]*\)/g, '');
        processed = processed.replace(/https?:\/\/kroki\.io\/\S+/g, '');
        // Remove unwanted diagram-like markdown images from any external renderer, but allow pollinations.ai and mermaid.ink
        processed = processed.replace(/!\[(?:Diagram|Chart|Visual|Image).*?\]\((https?:\/\/[^\s)]+)\)/g, (match, url) => {
            if (url.includes('pollinations.ai') || url.includes('mermaid.ink')) {
                return match;
            }
            return '';
        });

        if (blocks.length > 1) {
            // If there are duplicate consecutive mermaid blocks, keep only the first of each duplicate pair
            const parts = processed.split(/(```mermaid\n[\s\S]*?```)/g);
            const seen: string[] = [];
            const deduped = parts.filter((part) => {
                if (part.startsWith('```mermaid')) {
                    const content = part.replace(/```mermaid\n([\s\S]*?)```/, '$1').trim();
                    if (seen.includes(content)) return false;
                    seen.push(content);
                }
                return true;
            });
            processed = deduped.join('').replace(/\n{3,}/g, '\n\n').trim();
        }

        return processed;
    }, [content]);

    return (
        <div
            className={`chat-markdown prose max-w-none
                ${isDarkMode ? "prose-invert" : ""}
                prose-p:text-base prose-p:leading-relaxed
                md:prose-p:text-lg
            `}
            style={{
                '--tw-prose-body': isDarkMode ? '#fff' : '#000',
                '--tw-prose-headings': isDarkMode ? 'var(--brand-accent)' : '#008A8A',
                '--tw-prose-links': isDarkMode ? '#fff' : '#000',
                '--tw-prose-bold': isDarkMode ? 'var(--brand-accent)' : '#008A8A',
                '--tw-prose-counters': isDarkMode ? '#fff' : '#000',
                '--tw-prose-bullets': isDarkMode ? '#fff' : '#000',
                '--tw-prose-hr': isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                '--tw-prose-quotes': isDarkMode ? '#fff' : '#000',
                '--tw-prose-quote-borders': isDarkMode ? '#fff' : '#000',
                '--tw-prose-code': isDarkMode ? '#fff' : '#000',
                '--tw-prose-pre-code': isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                '--tw-prose-pre-bg': isDarkMode ? '#0d0d0d' : '#f9fafb',
                '--tw-prose-th-borders': isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                '--tw-prose-td-borders': isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            } as React.CSSProperties}
        >
            <ReactMarkdown
                remarkPlugins={[[remarkMath, { singleDollar: true, doubleDollar: true }], remarkGfm]}
                rehypePlugins={[[rehypeKatex, { trust: true, strict: false }]]}
                urlTransform={(url) => url}
                components={{
                    img(props) {
                        const { src, alt } = props;
                        if (!src || typeof src !== "string") return null;
                        if (src === "image_url" || src === "placeholder" || src === "") return null;

                        // Check if it's a mermaid.ink URL (possibly with spaces/corrupted base64)
                        if (src.includes("mermaid.ink/img/")) {
                            const match = /mermaid\.ink\/img\/([^?#\s)]+)/.exec(src);
                            if (match) {
                                const base64Part = match[1];
                                const cleanCode = getCleanMermaidCode(base64Part);
                                if (cleanCode && cleanCode !== base64Part) {
                                    return <MermaidImage code={cleanCode} onDownloadImage={onDownloadImage} isGenerating={isGenerating} />;
                                }
                            }
                        }

                        return (
                            <span className={`block my-4 relative group/img-wrapper ${
                                isImageCompact ? "max-w-[280px] md:max-w-[320px]" : "max-w-full"
                            }`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src}
                                    alt={alt || ""}
                                    className={`rounded-lg object-contain border border-white/10 shadow-lg ${
                                        isImageCompact
                                            ? "w-full max-h-[200px] md:max-h-[240px]"
                                            : "max-w-full h-auto"
                                    }`}
                                />
                                {onDownloadImage && (
                                    <button
                                        onClick={() => onDownloadImage(src)}
                                        title="Download Image"
                                        className="absolute top-2 right-2 p-2 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 shadow-lg backdrop-blur-md opacity-0 group-hover/img-wrapper:opacity-100 transition-all duration-300 scale-90 group-hover/img-wrapper:scale-100 flex items-center justify-center gap-1 hover:scale-105 active:scale-95"
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--brand-accent)" }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "" }}
                                    >
                                        <FileDown className="h-3.5 w-3.5" />
                                        <span className="text-[9px] font-mono uppercase tracking-wider font-bold pr-0.5">Download</span>
                                    </button>
                                )}
                            </span>
                        );
                    },
                    code(props) {
                        const { children, className, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match && !className;

                        if (isInline) {
                            return (
                                <code
                                    className={`${isDarkMode ? "bg-white/10 text-white" : "bg-black/10 text-black"} px-1.5 py-0.5 text-sm font-mono rounded`}
                                    {...rest}
                                >
                                    {children}
                                </code>
                            );
                        }

                        const lang = match?.[1] || "";

                        if (lang === "mermaid") {
                            return <MermaidImage code={String(children)} onDownloadImage={onDownloadImage} isGenerating={isGenerating} />;
                        }

                        return (
                            <CodeBlock
                                code={String(children)}
                                language={lang}
                                isDarkMode={isDarkMode}
                            />
                        );
                    },
                    table(props) {
                        const { children } = props;
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className={`w-auto mx-auto border-collapse text-sm md:text-base ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead(props) {
                        const { children } = props;
                        return <thead className={isDarkMode ? "bg-white/5" : "bg-black/5"}>{children}</thead>;
                    },
                    th(props) {
                        const { children } = props;
                        return (
                            <th className={`px-4 py-2 text-left font-semibold border ${isDarkMode ? "border-white/20 text-white" : "border-black/20 text-black"}`}>
                                {children}
                            </th>
                        );
                    },
                    td(props) {
                        const { children } = props;
                        return (
                            <td className={`px-4 py-2 border ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                {children}
                            </td>
                        );
                    },
                    ul(props) {
                        const { children } = props;
                        return <ul className={`list-disc pl-6 my-3 space-y-1 ${isDarkMode ? "text-white" : "text-black"}`}>{children}</ul>;
                    },
                    ol(props) {
                        const { children } = props;
                        return <ol className={`list-decimal pl-6 my-3 space-y-1 ${isDarkMode ? "text-white" : "text-black"}`}>{children}</ol>;
                    },
                    li(props) {
                        const { children } = props;
                        return <li className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white" : "text-black"}`}>{children}</li>;
                    },
                    strong(props) {
                        const { children } = props;
                        return <strong className={`underline decoration-1 ${isDarkMode ? "text-white" : "text-black"}`} style={{fontFamily: "var(--font-edu-cursive)", textUnderlineOffset: "3px", fontWeight: "normal"}}>{children}</strong>;
                    },
                    h1(props) {
                        const { children } = props;
                        return <h1 className={`${isDarkMode ? "text-white border-white/10" : "text-black border-black/10"} text-4xl md:text-5xl mt-8 mb-4 pb-2 border-b`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h1>;
                    },
                    h2(props) {
                        const { children } = props;
                        return <h2 className={`${isDarkMode ? "text-white" : "text-black"} text-3xl md:text-4xl mt-6 mb-3`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h2>;
                    },
                    h3(props) {
                        const { children } = props;
                        return <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-2xl md:text-3xl mt-5 mb-2`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h3>;
                    },
                    h4(props) {
                        const { children } = props;
                        return <h4 className={`${isDarkMode ? "text-white" : "text-black"} text-xl md:text-2xl mt-4 mb-2`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h4>;
                    },
                    h5(props) {
                        const { children } = props;
                        return <h5 className={`${isDarkMode ? "text-white" : "text-black"} text-lg md:text-xl mt-3 mb-1`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h5>;
                    },
                    h6(props) {
                        const { children } = props;
                        return <h6 className={`${isDarkMode ? "text-white" : "text-black"} text-base md:text-lg mt-3 mb-1`} style={{fontFamily: "var(--font-edu-cursive)"}}>{children}</h6>;
                    },
                    p(props) {
                        const { children } = props;
                        return <p className={`${isDarkMode ? "text-white" : "text-black"} text-base md:text-lg leading-relaxed`}>{children}</p>;
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
