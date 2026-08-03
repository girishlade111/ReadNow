import React from 'react';
import { Article } from '../types';
import { X, Download, FileText, Code, Printer, Copy } from 'lucide-react';

interface ExportModalProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ article, isOpen, onClose }) => {
  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    let md = `# ${article.title}\n\n`;
    md += `* **Source**: [${article.siteName || article.url}](${article.url})\n`;
    if (article.byline) md += `* **Author**: ${article.byline}\n`;
    md += `* **Saved Date**: ${new Date(article.savedAt).toLocaleDateString()}\n\n`;

    if (article.aiAnalysis?.summary) {
      md += `## Executive Summary\n\n> ${article.aiAnalysis.summary}\n\n`;
    }

    if (article.aiAnalysis?.keyTakeaways?.length) {
      md += `## Key Takeaways\n\n`;
      article.aiAnalysis.keyTakeaways.forEach(t => md += `- ${t}\n`);
      md += `\n`;
    }

    md += `## Article Content\n\n${article.textContent}\n`;
    downloadFile(`${article.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`, md, 'text/markdown');
  };

  const handleExportHtml = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${article.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { border-bottom: 4px solid #000; padding-bottom: 12px; }
    blockquote { background: #f4f4f0; border-left: 6px solid #dc2626; margin: 0; padding: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <p><strong>Source:</strong> <a href="${article.url}">${article.url}</a></p>
  ${article.aiAnalysis?.summary ? `<blockquote>${article.aiAnalysis.summary}</blockquote>` : ''}
  <div>${article.content}</div>
</body>
</html>`;
    downloadFile(`${article.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`, html, 'text/html');
  };

  const handleExportText = () => {
    const txt = `${article.title}\nSource: ${article.url}\n\nSUMMARY:\n${article.aiAnalysis?.summary || ''}\n\nCONTENT:\n${article.textContent}`;
    downloadFile(`${article.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, txt, 'text/plain');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md brutal-card !p-8 border-4 border-black">
        <div className="flex justify-between items-center pb-4 border-b-4 border-black mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Download className="w-6 h-6 text-red-600" /> Export Options
          </h3>
          <button onClick={onClose} className="brutal-button !py-1 !px-2.5 !bg-gray-100 hover:!bg-black hover:!text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportMarkdown}
            className="w-full p-4 brutal-card hover:!bg-black hover:!text-white text-left font-bold flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-600 group-hover:text-white" />
              <span>Export as Markdown (.md)</span>
            </div>
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportHtml}
            className="w-full p-4 brutal-card hover:!bg-black hover:!text-white text-left font-bold flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-blue-600 group-hover:text-white" />
              <span>Export as Clean HTML (.html)</span>
            </div>
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportText}
            className="w-full p-4 brutal-card hover:!bg-black hover:!text-white text-left font-bold flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600 group-hover:text-white" />
              <span>Export as Plain Text (.txt)</span>
            </div>
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="w-full p-4 brutal-card hover:!bg-black hover:!text-white text-left font-bold flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-purple-600 group-hover:text-white" />
              <span>Print / Save as PDF</span>
            </div>
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
