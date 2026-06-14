import React from "react";

interface MarkdownProps {
  text: string;
}

export function Markdown({ text }: MarkdownProps) {
  if (!text) return null;

  // Split the text into blocks by double newlines or multiple blank lines
  const blocks = text.split(/\n\s*\n+/);

  const elements: React.JSX.Element[] = [];

  const parseInlineFormatting = (rawStr: string) => {
    // replace **text** with <strong>text</strong>
    const parts = rawStr.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-[#00ffff] tracking-wide">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  blocks.forEach((block, blockIdx) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return;

    // Split the block into trimmed non-empty lines
    const blockLines = trimmedBlock.split("\n").map(l => l.trim()).filter(Boolean);
    if (blockLines.length === 0) return;

    const firstLine = blockLines[0];

    // Check if block represents an Unordered List
    if (firstLine.startsWith("•") || firstLine.startsWith("-") || firstLine.startsWith("*")) {
      const listItems: string[] = [];
      blockLines.forEach((line) => {
        let content = line;
        if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
          content = line.slice(1).trim();
        }
        if (content) {
          listItems.push(content);
        }
      });

      elements.push(
        <ul key={`list-${blockIdx}`} className="list-disc pl-5 my-4 space-y-1.5 text-slate-300">
          {listItems.map((item, itemIdx) => (
            <li key={`li-${itemIdx}`} className="leading-relaxed text-xs text-slate-300">
              {parseInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    } else if (firstLine.startsWith("#")) {
      // Heading structure (matches #, ##, ###, etc.)
      const match = firstLine.match(/^(#{1,6})\s*(.*)$/);
      if (match) {
        const depth = match[1].length;
        const title = match[2];
        const fontSizeClass =
          depth === 1
            ? "text-base sm:text-lg text-emerald-400 mt-5 mb-2.5 font-mono"
            : depth === 2
            ? "text-sm sm:text-base text-[#00ffff] mt-4.5 mb-2 font-mono"
            : "text-xs sm:text-sm text-pink-400 mt-4 mb-1.5 font-mono";
        
        elements.push(
          <h4
            key={`heading-${blockIdx}`}
            className={`${fontSizeClass} font-black uppercase tracking-tight italic border-b border-slate-900 pb-1`}
          >
            {parseInlineFormatting(title)}
          </h4>
        );

        // If there were subsequent lines in this header block, render them as paragraphs
        if (blockLines.length > 1) {
          const subText = blockLines.slice(1).join(" ");
          elements.push(
            <p key={`p-sub-${blockIdx}`} className="leading-relaxed text-xs text-slate-300 mb-3.5 font-sans">
              {parseInlineFormatting(subText)}
            </p>
          );
        }
      } else {
        // Fallback for paragraph
        elements.push(
          <p key={`p-${blockIdx}`} className="leading-relaxed text-xs text-slate-300 mb-3.5 font-sans">
            {parseInlineFormatting(trimmedBlock)}
          </p>
        );
      }
    } else {
      // Regular paragraph - coalesce wrapped/split lines in the block into single-sentence flow
      const paragraphText = blockLines.join(" ");
      elements.push(
        <p key={`p-${blockIdx}`} className="leading-relaxed text-xs text-slate-300 mb-3.5 font-sans">
          {parseInlineFormatting(paragraphText)}
        </p>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
}
