"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { Copy, Check } from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";

interface MarkdownRendererProps {
    content: string;
    isDarkMode: boolean;
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

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
    const processedContent = React.useMemo(() => {
        let processed = content;
        
        // Convert \[ \] to $$ $$
        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        
        // Convert \( \) to $ $
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
        
        // Convert mermaid SVG cache image URLs to clean standard client-side mermaid code blocks
        processed = processed.replace(/!\[.*?\]\((?:https?:\/\/[^\s)]*?mermaid\.svg\?code=([^\s)]+))\)/g, (match, codeParam) => {
            try {
                const decodedCode = decodeURIComponent(codeParam);
                return `\n\n\`\`\`mermaid\n${decodedCode}\n\`\`\`\n\n`;
            } catch (e) {
                console.error("Failed to decode inline mermaid URL:", e);
                return match;
            }
        });

        // Filter out literal placeholder images like ![...](image_url) to avoid showing broken images
        processed = processed.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
        
        // Also strip any remaining image references with clearly fake URLs
        processed = processed.replace(/!\[.*?\]\(\)/g, '');
        
        // Remove any bare image URLs that are clearly placeholders
        processed = processed.replace(/\]\((?:image_url|placeholder)\)/g, ']()');
        
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
                '--tw-prose-headings': isDarkMode ? '#fff' : '#000',
                '--tw-prose-links': isDarkMode ? '#fff' : '#000',
                '--tw-prose-bold': isDarkMode ? '#fff' : '#000',
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
                remarkPlugins={[[remarkMath, { singleDollar: true, doubleDollar: true }]]}
                rehypePlugins={[[rehypeKatex, { trust: true, strict: false }]]}
                components={{
                    img(props) {
                        const { src, alt, ...rest } = props;
                        if (!src || typeof src !== "string") return null;
                        if (src === "image_url" || src === "placeholder" || src === "") return null;
                        if (src.includes("mermaid.svg?code=")) {
                            try {
                                const absoluteUrl = src.startsWith("http") ? src : `https://dummy.com${src.startsWith("/") ? "" : "/"}${src}`;
                                const url = new URL(absoluteUrl);
                                const codeParam = url.searchParams.get("code");
                                if (codeParam) {
                                    const decodedCode = decodeURIComponent(codeParam);
                                    return <MermaidDiagram code={decodedCode} isDarkMode={isDarkMode} />;
                                }
                            } catch (e) {
                                console.error("Failed to parse or render mermaid URL:", e);
                            }
                        }
                        return <img src={src} alt={alt} {...rest} />;
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
                            return <MermaidDiagram code={String(children)} isDarkMode={isDarkMode} />;
                        }

                        return (
                            <CodeBlock
                                code={String(children)}
                                language={lang}
                                isDarkMode={isDarkMode}
                            />
                        );
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
