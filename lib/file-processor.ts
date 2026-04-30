export interface ProcessedFile {
    name: string;
    type: string;
    size: number;
    /** Base64 data URL for images, extracted text for documents */
    content: string;
    previewUrl?: string;
    isImage?: boolean;
    isPdf?: boolean;
    /** Original File object for reference */
    rawFile?: File;
}

// ─── PDF.js CDN loader ───────────────────────────────────────────────────────
// We intentionally avoid importing pdfjs-dist from npm because webpack bundles
// its canvas.js which uses DOMMatrix — a browser-only API — causing SSR crashes.

const PDF_JS_VERSION = "3.11.174";
const PDF_JS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build`;

let pdfJsLoadPromise: Promise<any> | null = null;

const loadPdfJs = (): Promise<any> => {
    if (typeof window === "undefined") return Promise.reject(new Error("PDF processing requires a browser environment."));
    if (pdfJsLoadPromise) return pdfJsLoadPromise;

    pdfJsLoadPromise = new Promise((resolve, reject) => {
        const existing = (window as any).pdfjsLib;
        if (existing) { resolve(existing); return; }

        const script = document.createElement("script");
        script.src = `${PDF_JS_CDN}/pdf.min.js`;
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            if (!lib) { reject(new Error("PDF.js failed to load from CDN.")); return; }
            lib.GlobalWorkerOptions.workerSrc = `${PDF_JS_CDN}/pdf.worker.min.js`;
            resolve(lib);
        };
        script.onerror = () => reject(new Error("Unable to load PDF.js from CDN."));
        document.head.appendChild(script);
    });

    return pdfJsLoadPromise;
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const processFile = async (file: File): Promise<ProcessedFile> => {
    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";
    const isText  = file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);

    if (isImage) return handleImage(file);
    if (isPdf)   return handlePdf(file);
    if (isText)  return handleText(file);

    throw new Error(`Unsupported file type "${file.type}". Please upload an image, PDF, or text file.`);
};

// ─── Handlers ────────────────────────────────────────────────────────────────

const handleImage = (file: File): Promise<ProcessedFile> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result as string,
            previewUrl: reader.result as string,
            isImage: true,
            rawFile: file,
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const handleText = (file: File): Promise<ProcessedFile> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result as string,
            rawFile: file,
        });
        reader.onerror = reject;
        reader.readAsText(file);
    });

const handlePdf = async (file: File): Promise<ProcessedFile> => {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Reconstruct lines by grouping items with similar Y positions
        const lines: Map<number, string[]> = new Map();
        for (const item of textContent.items as any[]) {
            if (!item.str?.trim()) continue;
            const y = Math.round(item.transform[5]);
            if (!lines.has(y)) lines.set(y, []);
            lines.get(y)!.push(item.str);
        }

        // Sort lines by Y position (descending = top to bottom on PDF)
        const sortedLines = [...lines.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([, words]) => words.join(" "));

        pageTexts.push(`--- Page ${i} ---\n${sortedLines.join("\n")}`);
    }

    const extractedText = pageTexts.join("\n\n");

    // Detect scanned/image-only PDFs (no extractable text)
    const isScanned = extractedText.replace(/--- Page \d+ ---/g, "").trim().length < 50;

    return {
        name: file.name,
        type: file.type,
        size: file.size,
        content: isScanned ? "" : extractedText,
        isPdf: true,
        // Mark as image if scanned so the caller can use vision modality
        isImage: isScanned,
        rawFile: file,
    };
};
