// ─── /api/ai-assistant ──────────────────────────────────
// POST → Send a message to the AI Project Assistant
//        Powered by Google Gemini 1.5/2.5 Flash
//
// Auth: Requires valid JWT (same as all other endpoints)

import type { Handler } from '@netlify/functions';
import { requireJwt } from './middleware/guards';
import { checkRateLimit } from './middleware/rate-limit';
import {
    createRequestId,
    corsPreflightResponse,
    jsonResponse,
    errorResponse,
    methodNotAllowed,
    parseJsonBody,
    handleError,
} from './middleware/response';
import { getDb } from './db/connection';
import { Resend } from 'resend';

// Model Registry for fallback logic
const MODELS = [
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
];

const SYSTEM_INSTRUCTION = `Identity: Aria — Ardeno Client Project Assistant.
Persona: Friendly but professional. Calm, helpful, and human.
Tone: System operator vibe with warmth.

STRICT RULES:
1. No bold, no backticks, no markdown.
2. Vertical structured blocks only.
3. If project details requested:
   <Name>
   Status: <v> | Stage: <v>
   Summary: <sentence>
   Next: • <step> • <step>
4. [[HANDOVER]] only for bugs/change requests.`;

async function sendHandoverNotification(user: any, projectContext: string, clientMessage: string, ariaReply: string, requestId: string) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;
    const resend = new Resend(resendKey);
    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: (process.env.ADMIN_EMAILS || 'support@ardeno.studio').split(','),
            subject: `Aria Handover: ${user.name}`,
            html: `<div style="font-family:sans-serif;color:#fff;background:#050505;padding:20px;border:1px solid #1f1f23;">
                    <h2 style="color:#E50914;">Aria Handover</h2>
                    <p><b>Client:</b> ${user.name} (${user.email})</p>
                    <p><b>Message:</b> ${clientMessage}</p>
                    <p><b>Aria:</b> ${ariaReply}</p>
                   </div>`
        });
    } catch (e) {
        console.error(`[${requestId}] Email failed`, e);
    }
}

export const handler: Handler = async (event) => {
    const origin = event.headers.origin || event.headers.Origin;
    const requestId = createRequestId();

    if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST'], requestId, origin);

    try {
        const user = await requireJwt(event);
        await checkRateLimit(`ai-assistant:${user.sub}`, 500, 60);

        const parsed = parseJsonBody(event.body, requestId);
        if (!parsed.ok) return parsed.response;
        const body = parsed.data;

        const message = body.message as string;
        const history = (body.history as Array<{ role: string; text: string }>) || [];

        if (!message?.trim()) {
            return errorResponse(400, 'INVALID_MESSAGE', 'Message required', requestId, origin);
        }

        let projectContext = '';
        try {
            const sql = getDb();
            const projects = await sql`SELECT project_name, current_stage, current_status FROM projects WHERE user_id = ${user.sub} LIMIT 3`;
            if (projects.length > 0) {
                projectContext = "\n\nProjects:\n" + projects.map((p: any) => `- ${p.project_name} (${p.current_stage})`).join('\n');
            }
        } catch (e) { console.warn(`[${requestId}] DB Context skipped`); }

        // Priming for persona stability across all models
        const contents = [
            {
                role: 'user',
                parts: [{ text: `INSTRUCTIONS: ${SYSTEM_INSTRUCTION}${projectContext}\n\nAcknowledge and wait for client.` }]
            },
            {
                role: 'model',
                parts: [{ text: "Acknowledged. I am Aria. I will follow all persona and formatting rules. Ready for client input." }]
            },
            ...history.slice(-4).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return errorResponse(500, 'CONFIG_ERROR', 'AI not configured', requestId, origin);

        let reply = '';
        let lastError = '';

        // Iterate through known healthy model endpoints until one works
        for (const modelUrl of MODELS) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 9000);

            try {
                const url = new URL(modelUrl);
                url.searchParams.set('key', apiKey);

                const res = await fetch(url.toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents,
                        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
                    })
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) break;
                } else if (res.status === 429) {
                    lastError = 'Rate limited (429)';
                    console.warn(`[${requestId}] 429 on ${modelUrl}`);
                } else {
                    const txt = await res.text();
                    lastError = `API Error ${res.status}`;
                    console.error(`[${requestId}] Error on ${modelUrl}:`, txt);
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                lastError = err.message;
            }
        }

        if (!reply) {
            return errorResponse(502, 'AI_UNAVAILABLE', `Aria is briefly out of sync (${lastError}). Please try again in 10 seconds.`, requestId, origin);
        }

        if (reply.includes('[[HANDOVER]]')) {
            const clean = reply.replace('[[HANDOVER]]', '').trim();
            sendHandoverNotification(user, projectContext, message, clean, requestId).catch(() => { });
            reply = clean;
        }

        return jsonResponse(200, { reply }, requestId, origin);

    } catch (err: any) {
        return handleError(err, requestId, origin);
    }
};
