import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_DIR = path.resolve(process.cwd(), '..');
const CONFIG_FILE_PATH = path.join(ROOT_DIR, 'user_config.json');
const ENV_FILE_PATH = path.join(ROOT_DIR, 'Jarvis_code', '.env');
const SECRET_ENV_KEYS = [
  'GOOGLE_API_KEY',
  'OPENAI_API_KEY',
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET',
] as const;

function readEnvFile(): Record<string, string> {
  try {
    return Object.fromEntries(
      fs.readFileSync(ENV_FILE_PATH, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const splitAt = line.indexOf('=');
          const key = line.slice(0, splitAt).trim();
          let value = line.slice(splitAt + 1).trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            try { value = JSON.parse(value) as string; } catch { value = value.slice(1, -1); }
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          return [key, value] as [string, string];
        }),
    );
  } catch {
    return {};
  }
}

function readProfile(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function GET() {
  const profile = readProfile();
  const env = readEnvFile();
  const hasProfile = Object.keys(profile).length > 0;
  return json({
    exists: hasProfile,
    user_id: profile.user_id ?? '',
    user_name: profile.user_name ?? '',
    assistant_name: profile.assistant_name ?? 'JARVIS',
    llm: profile.llm ?? { provider: 'ollama', model: 'qwen3.5:4b', voice: 'ara' },
    language: profile.language ?? 'bn',
    api_keys: { livekit_url: env.LIVEKIT_URL ?? '' },
    api_key_status: {
      google: Boolean(env.GOOGLE_API_KEY),
      openai: Boolean(env.OPENAI_API_KEY),
      livekit_key: Boolean(env.LIVEKIT_API_KEY),
      livekit_secret: Boolean(env.LIVEKIT_API_SECRET),
    },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Cross-origin settings updates are blocked.' }, 403);
  try {
    const data = await request.json();
    if (
      !data || typeof data !== 'object' ||
      typeof data.user_name !== 'string' || !data.user_name.trim() ||
      typeof data.assistant_name !== 'string' ||
      !data.llm || !['ollama', 'google', 'openai'].includes(data.llm.provider)
    ) {
      return json({ error: 'Invalid settings. Check the assistant name and AI provider.' }, 400);
    }

    const model = typeof data.llm.model === 'string' ? data.llm.model.trim() : '';
    if (!model || model.length > 160) return json({ error: 'Enter a model name under 160 characters.' }, 400);

    const profile = {
      user_id: typeof data.user_id === 'string' ? data.user_id.slice(0, 80) : 'primary_user',
      user_name: data.user_name.trim().slice(0, 80),
      assistant_name: data.assistant_name.trim().slice(0, 40) || 'JARVIS',
      llm: {
        provider: data.llm.provider,
        model,
        voice: typeof data.llm.voice === 'string' ? data.llm.voice.slice(0, 100) : 'ara',
        ollama_base_url: typeof data.llm.ollama_base_url === 'string'
          ? data.llm.ollama_base_url.trim().slice(0, 240)
          : 'http://localhost:11434/v1',
      },
      language: typeof data.language === 'string' ? data.language.slice(0, 16) : 'bn',
    };

    const currentEnv = readEnvFile();
    const submitted = data.api_keys && typeof data.api_keys === 'object' ? data.api_keys : {};
    const inputToEnv: Record<string, string> = {
      google: 'GOOGLE_API_KEY',
      openai: 'OPENAI_API_KEY',
      livekit_key: 'LIVEKIT_API_KEY',
      livekit_secret: 'LIVEKIT_API_SECRET',
      livekit_url: 'LIVEKIT_URL',
    };
    for (const [inputName, envName] of Object.entries(inputToEnv)) {
      const value = submitted[inputName];
      if (typeof value === 'string' && value.trim()) currentEnv[envName] = value.trim();
    }

    fs.mkdirSync(path.dirname(ENV_FILE_PATH), { recursive: true });
    fs.mkdirSync(path.dirname(CONFIG_FILE_PATH), { recursive: true });
    const envLines = Object.entries(currentEnv)
      .filter(([key]) => SECRET_ENV_KEYS.includes(key as (typeof SECRET_ENV_KEYS)[number]) || key === 'LIVEKIT_URL')
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`);
    const envTempPath = `${ENV_FILE_PATH}.tmp`;
    const profileTempPath = `${CONFIG_FILE_PATH}.tmp`;
    fs.writeFileSync(envTempPath, `${envLines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
    fs.writeFileSync(profileTempPath, `${JSON.stringify(profile, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(envTempPath, ENV_FILE_PATH);
    fs.renameSync(profileTempPath, CONFIG_FILE_PATH);
    return json({ success: true, message: 'Settings saved locally. API keys are never returned to the browser.' });
  } catch {
    return json({ error: 'Could not save settings. Check folder permissions and try again.' }, 500);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Cross-origin settings updates are blocked.' }, 403);
  try {
    for (const filePath of [CONFIG_FILE_PATH, ENV_FILE_PATH]) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return json({ success: true });
  } catch {
    return json({ error: 'Could not clear local settings.' }, 500);
  }
}
