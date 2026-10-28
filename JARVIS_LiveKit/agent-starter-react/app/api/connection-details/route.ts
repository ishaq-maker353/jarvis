import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_DIR = path.resolve(process.cwd(), '..');
const ENV_FILE_PATH = path.join(ROOT_DIR, 'Jarvis_code', '.env');
const CONFIG_FILE_PATH = path.join(ROOT_DIR, 'user_config.json');

function readEnv(): Record<string, string> {
  try {
    const result: Record<string, string> = {};
    for (const line of fs.readFileSync(ENV_FILE_PATH, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      const separator = trimmed.indexOf('=');
      if (!trimmed || trimmed.startsWith('#') || separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        try { value = JSON.parse(value) as string; } catch { value = value.slice(1, -1); }
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin requests are blocked.' }, { status: 403 });
  }
  try {
    const env = readEnv();
    const livekitUrl = env.LIVEKIT_URL;
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;
    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Add the LiveKit URL, API key, and secret in Settings first.' }, { status: 503 });
    }

    let profile: Record<string, unknown> = {};
    try { profile = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8')) as Record<string, unknown>; } catch { /* handled by defaults */ }
    let body: Record<string, unknown> = {};
    try { body = await request.json() as Record<string, unknown>; } catch { /* room config is optional */ }
    const roomConfig = body.room_config as { agents?: Array<{ agent_name?: string }> } | undefined;
    const rawAgentName = roomConfig?.agents?.[0]?.agent_name;
    const agentName = typeof rawAgentName === 'string' ? rawAgentName.slice(0, 80) : undefined;
    const participantName = typeof profile.user_name === 'string' ? profile.user_name.slice(0, 80) : 'User';
    const suffix = Math.floor(Math.random() * 10_000);
    const roomName = `jarvis_voice_${Date.now()}_${suffix}`;
    const participantToken = await createParticipantToken(
      { identity: `jarvis_user_${suffix}`, name: participantName },
      roomName,
      apiKey,
      apiSecret,
      agentName,
    );
    return NextResponse.json(
      { serverUrl: livekitUrl, roomName, participantName, participantToken },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch {
    return NextResponse.json({ error: 'Could not create a voice session token. Check LiveKit settings.' }, { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  apiKey: string,
  apiSecret: string,
  agentName?: string,
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, { ...userInfo, ttl: '15m' });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  token.addGrant(grant);
  if (agentName) token.roomConfig = new RoomConfiguration({ agents: [{ agentName }] });
  return token.toJwt();
}
