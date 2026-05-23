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

/** Inline fallback component: decodes a kroki.io mermaid URL and renders it locally. */
function KrokiImage({ src, isDarkMode }: { src: string; isDarkMode: boolean }) {
    const [code, setCode] = React.useState<string | null>(null);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        const match = src.match(/kroki\.io\/mermaid\/svg\/([A-Za-z0-9+/=_-]+)/);
        if (!match) { setFailed(true); return; }
        decodeKrokiPayload(match[1])
            .then(setCode)
            .catch(() => setFailed(true));
    }, [src]);

    if (failed) return null;
    if (!code) return (
        <div className="my-4 p-6 rounded-lg flex items-center justify-center"
            style={{ border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
            <div className={`animate-pulse text-sm font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                Rendering diagram...
            </div>
        </div>
    );
    return <MermaidDiagram code={code} isDarkMode={isDarkMode} />;
}

/**
 * Decode a kroki.io base64url+deflate payload back to plain text.
 * Kroki encodes diagrams as: deflate(utf8(code)) -> base64url
 * We use the native DecompressionStream API (available in all modern browsers).
 */
async function decodeKrokiPayload(b64url: string): Promise<string> {
    // base64url -> base64
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - b64url.length % 4) % 4);
    const binaryStr = atob(b64);
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return new TextDecoder().decode(result);
}

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
    const [processedContent, setProcessedContent] = React.useState<string>(() => {
        // Synchronous initial pass (skips async kroki decoding)
        let processed = content;
        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
        processed = processed.replace(/!\[.*?\]\((?:https?:\/\/[^\s)]*?mermaid\.svg\?code=([^\s)]+))\)/g, (match, codeParam) => {
            try { return `\n\n\`\`\`mermaid\n${decodeURIComponent(codeParam)}\n\`\`\`\n\n`; } catch { return match; }
        });
        processed = processed.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
        processed = processed.replace(/!\[.*?\]\(\)/g, '');
        processed = processed.replace(/\]\((?:image_url|placeholder)\)/g, ']()');
        return processed;
    });

    // Async effect: decode any kroki.io mermaid URLs present in the content
    React.useEffect(() => {
        let cancelled = false;
        const KROKI_RE = /!\[.*?\]\(https:\/\/kroki\.io\/mermaid\/svg\/([A-Za-z0-9+/=_-]+)\)/g;

        async function processKroki() {
            let base = content;
            base = base.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
            base = base.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
            base = base.replace(/!\[.*?\]\((?:https?:\/\/[^\s)]*?mermaid\.svg\?code=([^\s)]+))\)/g, (match, codeParam) => {
                try { return `\n\n\`\`\`mermaid\n${decodeURIComponent(codeParam)}\n\`\`\`\n\n`; } catch { return match; }
            });

            // Collect all kroki matches first
            const krokiMatches = [...base.matchAll(KROKI_RE)];
            if (krokiMatches.length === 0) {
                if (!cancelled) {
                    base = base.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
                    base = base.replace(/!\[.*?\]\(\)/g, '');
                    base = base.replace(/\]\((?:image_url|placeholder)\)/g, ']()');
                    setProcessedContent(base);
                }
                return;
            }

            // Decode each kroki payload and replace in-place
            for (const m of krokiMatches) {
                if (cancelled) return;
                try {
                    const diagramCode = await decodeKrokiPayload(m[1]);
                    base = base.replace(m[0], `\n\n\`\`\`mermaid\n${diagramCode}\n\`\`\`\n\n`);
                } catch (e) {
                    console.error('Failed to decode kroki mermaid payload:', e);
                    // Remove the broken image so it doesn't hit the network
                    base = base.replace(m[0], '');
                }
            }

            if (!cancelled) {
                base = base.replace(/!\[.*?\]\((?:image_url|placeholder)\)/g, '');
                base = base.replace(/!\[.*?\]\(\)/g, '');
                base = base.replace(/\]\((?:image_url|placeholder)\)/g, ']()');
                setProcessedContent(base);
            }
        }

        processKroki();
        return () => { cancelled = true; };
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

                        // Intercept kroki.io mermaid SVG URLs — content has already been decoded
                        // in processedContent, but as a safety net handle any that slip through.
                        if (src.includes("kroki.io/mermaid/svg/")) {
                            // Return a lazy-decoded MermaidDiagram
                            return <KrokiImage src={src} isDarkMode={isDarkMode} />;
                        }

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
