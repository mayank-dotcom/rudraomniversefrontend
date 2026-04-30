import React from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import MarkdownRenderer from './ui/MarkdownRenderer';

interface MockPaperViewProps {
    paper: string;
    examType: string;
    duration: string;
    onClose: () => void;
    isDarkMode: boolean;
}

const MockPaperView: React.FC<MockPaperViewProps> = ({ paper, examType, duration, onClose, isDarkMode }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        margin: 15mm; 
                        size: A4;
                    }
                    
                    /* Total Layout Reset */
                    html, body, #__next, [data-nextjs-scroll-focus-boundary], main, div, section {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        float: none !important;
                        visibility: hidden;
                    }

                    /* Show only the paper wrapper and its contents */
                    #printable-paper-wrapper { 
                        visibility: visible !important; 
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 99999 !important;
                    }
                    
                    #printable-paper-wrapper * { 
                        visibility: visible !important; 
                    }

                    #printable-paper {
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        transform: none !important;
                    }
                    
                    /* Fix for Framer Motion transforms */
                    div[style*="transform"] {
                        transform: none !important;
                    }

                    .no-print, style, script { display: none !important; }
                    
                    /* Question-specific flow */
                    h1, h2, h3, p, li {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        color: black !important;
                        display: block !important;
                    }
                }
            `}} />

            <div id="printable-paper-wrapper" className="fixed inset-0 z-[250] bg-black/90 flex flex-col items-center p-4 md:p-10 overflow-hidden">

            <div className="w-full max-w-5xl flex justify-between items-center mb-8 no-print">
                <div className="flex flex-col">
                    <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter">Generated Neural Paper</h2>
                    <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em]">{examType} • {duration} SESSION</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-3 bg-white text-black text-[10px] font-mono font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:scale-105 transition-all"
                    >
                        <Download className="h-4 w-4" /> Download PDF
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-3 border border-white/10 text-white/40 hover:text-white rounded-xl transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl flex-1 bg-white rounded-t-[2rem] p-10 md:p-20 overflow-y-auto shadow-2xl custom-scrollbar light-scrollbar"
                id="printable-paper"
            >
                <div className="text-black font-serif">
                    {/* Header Block */}
                    <div className="text-center border-b-2 border-black pb-8 mb-10">
                        <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">{examType}</h1>
                        <h2 className="text-xl font-medium uppercase mb-4">Mock Examination Paper</h2>
                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest mt-8 px-4">
                            <span>Time: {duration}</span>
                            <span>Max Marks: 100</span>
                        </div>
                    </div>

                    {/* General Instructions */}
                    <div className="mb-10 text-sm">
                        <h3 className="font-bold underline mb-3">General Instructions:</h3>
                        <ul className="list-disc pl-5 space-y-1 opacity-80">
                            <li>All questions are compulsory.</li>
                            <li>Questions carry equal marks as indicated.</li>
                            <li>Maintain cleanliness and clarity in your responses.</li>
                            <li>Generated by Rudranex AI Neural Engine.</li>
                        </ul>
                    </div>

                    {/* Paper Content */}
                    <div className="paper-content-rich">
                        <MarkdownRenderer content={paper} isDarkMode={false} />
                    </div>

                    {/* Footer */}
                    <div className="mt-20 pt-10 border-t border-black/10 text-center text-[10px] uppercase tracking-[0.4em] opacity-30">
                        End of Question Paper • Rudranex Core 2026
                    </div>
                </div>
            </motion.div>
        </div>
        </>
    );
};

export default MockPaperView;
