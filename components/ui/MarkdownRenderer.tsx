"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
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
        <div
            className={`prose max-w-none
                ${isDarkMode ? "prose-invert" : ""}
                prose-p:font-serif prose-p:italic prose-p:text-base prose-p:leading-relaxed
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
                            <div className="my-4 rounded-lg overflow-hidden" style={{
                                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            }}>
                                <div className="flex items-center gap-1.5 px-4 py-2" style={{
                                    background: isDarkMode ? "#1a1a1a" : "#f3f4f6",
                                    borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                                }}>
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                                    <span className={`text-[9px] font-mono uppercase tracking-widest ml-2 ${isDarkMode ? "text-white/30" : "text-black/50"}`}>
                                        {match?.[1] || "code"}
                                    </span>
                                </div>
                                <SyntaxHighlighter
                                    language={match?.[1] || "text"}
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
                                    {String(children)}
                                </SyntaxHighlighter>
                            </div>
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
