"use client";

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { Copy, Check } from "lucide-react";
import mermaid from "mermaid";

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

mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
        primaryColor: "#0dd",
        primaryTextColor: "#000",
        primaryBorderColor: "#0dd",
        lineColor: "#0dd",
        secondaryColor: "#00cccc",
        tertiaryColor: "#e6ffff",
        fontSize: "16px",
    },
});

function MermaidBlock({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = React.useState<string>("");
    const [error, setError] = React.useState<string>("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
                const { svg: rendered } = await mermaid.render(id, code);
                if (!cancelled) setSvg(rendered);
            } catch (e) {
                if (!cancelled) setError("Failed to render diagram");
            }
        })();
        return () => { cancelled = true; };
    }, [code]);

    if (error) {
        return (
            <div className="my-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                {error}
            </div>
        );
    }

    if (svg) {
        return (
            <div
                ref={ref}
                className="my-4 flex justify-center"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        );
    }

    return (
        <div className="my-4 p-4 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse text-center text-sm text-black/40 dark:text-white/40">
            Rendering diagram…
        </div>
    );
}

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
    const processedContent = React.useMemo(() => {
        let processed = content;
        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
        processed = processed.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
        processed = processed.replace(/!\[.*?\]\(\)/g, '');
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
                remarkPlugins={[[remarkMath, { singleDollar: true, doubleDollar: true }], remarkGfm]}
                rehypePlugins={[[rehypeKatex, { trust: true, strict: false }]]}
                components={{
                    img(props) {
                        const { src, alt } = props;
                        if (!src || typeof src !== "string") return null;
                        if (src === "image_url" || src === "placeholder" || src === "") return null;
                        return (
                            <span className="block my-4">
                                <img src={src} alt={alt || ""} className="max-w-full h-auto rounded-lg" loading="lazy" />
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
                            return <MermaidBlock code={String(children)} />;
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
