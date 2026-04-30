"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
    content: string;
    isDarkMode: boolean;
}

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
    const processedContent = React.useMemo(() => {
        let processed = content;
        
        // Convert \[ \] to $$ $$
        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        
        // Convert \( \) to $ $
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$');
        
        return processed;
    }, [content]);

    return (
        <div className={`prose max-w-none
            ${isDarkMode ? "prose-invert prose-white" : "prose-black"}
            prose-p:font-serif prose-p:italic prose-p:text-base prose-p:leading-relaxed
            md:prose-p:text-lg
        `}>
            <ReactMarkdown
                remarkPlugins={[[remarkMath, { singleDollar: true, doubleDollar: true }]]}
                rehypePlugins={[[rehypeKatex, { trust: true, strict: false }]]}
                components={{
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

                        return (
                             <pre className={`${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-gray-50 border-black/10"} border p-4 rounded-lg my-4 relative max-w-full whitespace-pre-wrap break-words`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                                        <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                                        <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
                                        <span className={`text-[9px] font-mono uppercase tracking-widest ml-2 ${isDarkMode ? "text-white/30" : "text-black/90"}`}>
                                            {match ? match[1] : "code"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(String(children))}
                                        className={`p-1 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}
                                        title="Copy code"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </button>
                                </div>
                                <code className={`language-${match?.[1] || ""} text-sm font-mono ${isDarkMode ? "text-white/80" : "text-black/80"} whitespace-pre-wrap break-words block`}>
                                    {children}
                                </code>
                            </pre>
                        );
                    },
                    p(props) {
                        const { children } = props;
                        return <p className={`${isDarkMode ? "text-white" : "text-black"} font-serif italic text-base md:text-lg leading-relaxed`}>{children}</p>;
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
