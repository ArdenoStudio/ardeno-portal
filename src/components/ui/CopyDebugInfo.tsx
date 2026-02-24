// ─── Copy Debug Info Button ──────────────────────────
// Renders a small "Copy debug info" button that copies
// structured error context to clipboard for support.

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ApiError } from '@/lib/api';

interface DebugInfoProps {
    error: string | ApiError | Error | unknown;
    endpoint?: string;
}

function extractDebugInfo(error: unknown, endpoint?: string): string {
    const lines: string[] = [];
    lines.push(`Timestamp: ${new Date().toISOString()}`);

    if (error instanceof ApiError) {
        lines.push(`Request ID: ${error.requestId || 'N/A'}`);
        lines.push(`Error Code: ${error.code}`);
        lines.push(`HTTP Status: ${error.status}`);
        lines.push(`Message: ${error.message}`);
    } else if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
    } else if (typeof error === 'string') {
        lines.push(`Error: ${error}`);
    }

    if (endpoint) lines.push(`Endpoint: ${endpoint}`);
    lines.push(`URL: ${window.location.href}`);
    lines.push(`User Agent: ${navigator.userAgent}`);

    return lines.join('\n');
}

export function CopyDebugInfo({ error, endpoint }: DebugInfoProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        const info = extractDebugInfo(error, endpoint);
        try {
            await navigator.clipboard.writeText(info);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = info;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wide"
        >
            {copied ? (
                <>
                    <Check size={10} />
                    Copied
                </>
            ) : (
                <>
                    <Copy size={10} />
                    Copy debug info
                </>
            )}
        </button>
    );
}
