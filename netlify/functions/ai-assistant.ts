// ─── /api/ai-assistant ──────────────────────────────────
// POST → Send a message to the AI Project Assistant
//        Powered by Google Gemini 1.5 Flash
//
// Auth: Requires valid JWT (same as all other endpoints)
// Rate limit: 20 messages per hour per user

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

const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const SYSTEM_INSTRUCTION = `You are Aria, the AI Project Assistant for Ardeno Studio — a professional creative and digital studio that builds premium websites, apps, branding, and digital experiences.

Your role is to assist clients with:
- Understanding the status and progress of their projects
- Answering questions about milestones, timelines, and deliverables
- Explaining Ardeno Studio's processes, services, and workflows
- Providing general guidance on their project

Your personality:
- Professional, warm, and concise
- Speak like a senior member of the Ardeno Studio team
- Never make up specific project details you don't have access to — always refer clients to their project dashboard or to contact the team directly for specifics
- Keep responses short and helpful (2–4 sentences unless more detail is clearly needed)

Ardeno Studio services include: web design, web development, mobile apps, UI/UX design, brand identity, logo design, and digital marketing.

If asked about pricing, timelines, or project-specific details you don't have, say: "For specific details on your project, please check your project dashboard or reach out directly to the Ardeno Studio team."

Never reveal that you are powered by Google Gemini or any third-party AI. You are simply "Aria, the Ardeno Studio Project Assistant".`;

export const handler: Handler = async (event) => {
    const origin = event.headers.origin || event.headers.Origin;
    const requestId = createRequestId();

    if (event.httpMethod === 'OPTIONS') {
        return corsPreflightResponse(origin);
    }

    if (event.httpMethod !== 'POST') {
        return methodNotAllowed(['POST'], requestId, origin);
    }

    try {
        // ── 1. Authenticate ──────────────────────────────
        const user = await requireJwt(event);

        // ── 2. Rate limit: 20 messages per hour ──────────
        await checkRateLimit(`ai-assistant:${user.sub}`, 20, 60);

        // ── 3. Parse request body ────────────────────────
        const parsed = parseJsonBody(event.body, requestId);
        if (!parsed.ok) return parsed.response;
        const body = parsed.data;

        const message = body.message as string;
        const history = (body.history as Array<{ role: string; text: string }>) || [];

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return errorResponse(400, 'INVALID_MESSAGE', 'Message is required', requestId, origin);
        }
        if (message.length > 2000) {
            return errorResponse(400, 'MESSAGE_TOO_LONG', 'Message must be under 2000 characters', requestId, origin);
        }

        // ── 4. Fetch project context for this user ───────
        let projectContext = '';
        try {
            const sql = getDb();
            const projects = await sql`
        SELECT project_name, current_stage, status, description, deadline
        FROM projects
        WHERE user_id = ${user.sub}
        ORDER BY created_at DESC
        LIMIT 5
      `;
            if (projects.length > 0) {
                projectContext = `\n\nClient project context (use this to give informed answers):\n` +
                    projects.map((p: Record<string, any>) =>
                        `- "${p.project_name}": Stage = ${p.current_stage || 'N/A'}, Status = ${p.status || 'active'}, Deadline = ${p.deadline || 'not set'}`
                    ).join('\n');
            }
        } catch {
            // Non-critical — continue without project context
        }

        // ── 5. Build conversation for Gemini ─────────────
        const contents = [
            // Include recent conversation history (last 10 messages)
            ...history.slice(-10).map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.text }],
            })),
            // Current user message
            {
                role: 'user',
                parts: [{ text: message }],
            },
        ];

        // ── 6. Call Gemini API ───────────────────────────
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return errorResponse(500, 'CONFIG_ERROR', 'AI assistant is not configured', requestId, origin);
        }

        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION + projectContext }],
                },
                contents,
                generationConfig: {
                    maxOutputTokens: 512,
                    temperature: 0.7,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('Gemini API error:', errText);
            return errorResponse(502, 'AI_ERROR', 'AI assistant is temporarily unavailable', requestId, origin);
        }

        const geminiData = await geminiRes.json() as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
                finishReason?: string;
            }>;
        };
        const reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I'm sorry, I couldn't generate a response. Please try again.";

        return jsonResponse(200, { reply }, requestId, origin);
    } catch (err) {
        return handleError(err, requestId, origin);
    }
};
