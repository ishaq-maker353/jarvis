'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastAlert } from '@/components/alert-toast';

type Provider = 'ollama' | 'google' | 'openai';

const fieldClass = 'border-cyan-900 bg-black/60 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-400';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user_id: '', user_name: '', assistant_name: 'JARVIS',
    provider: 'ollama' as Provider, model: 'qwen3.5:4b', voice: 'ara', language: 'bn',
    ollama_base_url: 'http://localhost:11434/v1', api_key: '',
    livekit_url: '', livekit_key: '', livekit_secret: '',
  });

  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const changeProvider = (provider: Provider) => setForm((current) => ({
    ...current,
    provider,
    model: provider === 'ollama' ? 'qwen3.5:4b' : provider === 'google'
      ? 'gemini-2.5-flash-native-audio-preview-09-2025' : 'gpt-4o-realtime-preview',
    voice: provider === 'ollama' ? 'ara' : provider === 'google' ? 'Puck' : 'alloy',
    api_key: '',
  }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        user_id: form.user_id || form.user_name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_'),
        user_name: form.user_name,
        assistant_name: form.assistant_name,
        llm: {
          provider: form.provider, model: form.model, voice: form.voice,
          ollama_base_url: form.ollama_base_url,
        },
        language: form.language,
        api_keys: {
          google: form.provider === 'google' ? form.api_key : '',
          openai: form.provider === 'openai' ? form.api_key : '',
          livekit_url: form.livekit_url,
          livekit_key: form.livekit_key,
          livekit_secret: form.livekit_secret,
        },
      };
      const response = await fetch('/api/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'সেটিংস সংরক্ষণ করা যায়নি।');
      toastAlert({ title: 'সেটআপ সম্পন্ন', description: 'Settings এই কম্পিউটারে সংরক্ষিত হয়েছে।' });
      router.push('/');
    } catch (error) {
      toastAlert({ title: 'সেটআপে সমস্যা', description: error instanceof Error ? error.message : 'আবার চেষ্টা করুন।' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-black px-4 py-10 font-mono text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(6,182,212,0.13)] sm:p-10">
        <header className="mb-8 border-b border-cyan-900/70 pb-6">
          <p className="text-xs tracking-[0.25em] text-cyan-500">INITIAL SYSTEM CONFIGURATION</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[0.15em] text-cyan-300">J.A.R.V.I.S.</h1>
          <p className="mt-2 text-sm text-slate-300">ভয়েস অ্যাসিস্ট্যান্ট চালু করতে নিচের তথ্য দিন।</p>
        </header>

        <form onSubmit={submit} className="space-y-8">
          <section className="grid gap-5 rounded-xl border border-cyan-900/60 bg-black/40 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user_name">আপনাকে কী নামে ডাকব?</Label>
              <Input id="user_name" required value={form.user_name} onChange={(e) => update('user_name', e.target.value)} className={fieldClass} placeholder="আপনার নাম" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistant_name">Assistant-এর নাম</Label>
              <Input id="assistant_name" required value={form.assistant_name} onChange={(e) => update('assistant_name', e.target.value)} className={fieldClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">AI provider</Label>
              <select id="provider" value={form.provider} onChange={(e) => changeProvider(e.target.value as Provider)} className={`h-10 w-full rounded-md border px-3 text-sm ${fieldClass}`}>
                <option value="ollama">Ollama (local Qwen)</option>
                <option value="google">Google Gemini Live</option>
                <option value="openai">OpenAI Realtime</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model name</Label>
              <Input id="model" required value={form.model} onChange={(e) => update('model', e.target.value)} className={fieldClass} />
              {form.provider === 'ollama' && <p className="text-xs text-slate-400">Ollama-তে আগে `ollama list` দিয়ে model নাম মিলিয়ে নিন।</p>}
            </div>
            {form.provider === 'ollama' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ollama_base_url">Ollama URL</Label>
                <Input id="ollama_base_url" value={form.ollama_base_url} onChange={(e) => update('ollama_base_url', e.target.value)} className={fieldClass} />
              </div>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="api_key">{form.provider === 'google' ? 'Google Gemini API key' : 'OpenAI API key'}</Label>
                <Input id="api_key" type="password" autoComplete="new-password" required value={form.api_key} onChange={(e) => update('api_key', e.target.value)} className={fieldClass} placeholder="API key" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="language">কথোপকথনের ভাষা</Label>
              <select id="language" value={form.language} onChange={(e) => update('language', e.target.value)} className={`h-10 w-full rounded-md border px-3 text-sm ${fieldClass}`}>
                <option value="bn">বাংলা</option><option value="en">English</option><option value="hi">हिन्दी</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Input id="voice" value={form.voice} onChange={(e) => update('voice', e.target.value)} className={fieldClass} />
              <p className="text-xs text-slate-400">Ollama mode-এ LiveKit voice-এর default হলো `ara`।</p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-cyan-900/60 bg-black/40 p-5">
            <div>
              <h2 className="font-semibold text-cyan-300">LiveKit voice connection</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">Browser microphone ও voice agent যুক্ত করতে LiveKit project-এর URL, API key এবং secret লাগবে।</p>
            </div>
            <Input aria-label="LiveKit URL" required placeholder="LiveKit URL (wss://...)" value={form.livekit_url} onChange={(e) => update('livekit_url', e.target.value)} className={fieldClass} />
            <Input aria-label="LiveKit API key" required type="password" autoComplete="new-password" placeholder="LiveKit API key" value={form.livekit_key} onChange={(e) => update('livekit_key', e.target.value)} className={fieldClass} />
            <Input aria-label="LiveKit API secret" required type="password" autoComplete="new-password" placeholder="LiveKit API secret" value={form.livekit_secret} onChange={(e) => update('livekit_secret', e.target.value)} className={fieldClass} />
          </section>

          <aside className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
            Ollama mode-এ উত্তর তৈরি হবে আপনার PC-র Qwen model দিয়ে। Voice transcription ও Bangla speech LiveKit Inference ব্যবহার করে, তাই voice চালাতে LiveKit Cloud access/usage লাগবে। API key-গুলো browser-এ ফেরত পাঠানো হয় না।
          </aside>

          <Button type="submit" disabled={loading} className="w-full bg-cyan-600 py-6 font-bold tracking-widest text-white hover:bg-cyan-500 disabled:opacity-60">
            {loading ? 'সংরক্ষণ হচ্ছে…' : 'SAVE SETTINGS AND OPEN JARVIS'}
          </Button>
        </form>
      </div>
    </main>
  );
}
