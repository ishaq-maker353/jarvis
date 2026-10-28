'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastAlert } from '@/components/alert-toast';

type Provider = 'ollama' | 'google' | 'openai';
type KeyStatus = { google: boolean; openai: boolean; livekit_key: boolean; livekit_secret: boolean };

const fieldClass = 'border-cyan-900 bg-black/60 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-400';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<KeyStatus>({ google: false, openai: false, livekit_key: false, livekit_secret: false });
  const [form, setForm] = useState({
    user_id: '', user_name: '', assistant_name: 'JARVIS',
    provider: 'ollama' as Provider, model: 'qwen3.5:4b', voice: 'ara', language: 'bn',
    ollama_base_url: 'http://localhost:11434/v1', api_key: '',
    livekit_url: '', livekit_key: '', livekit_secret: '',
  });

  useEffect(() => {
    let active = true;
    fetch('/api/config', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (!data.exists) { router.push('/setup'); return; }
        setStatus(data.api_key_status || { google: false, openai: false, livekit_key: false, livekit_secret: false });
        setForm({
          user_id: data.user_id || '',
          user_name: data.user_name || '',
          assistant_name: data.assistant_name || 'JARVIS',
          provider: data.llm?.provider || 'ollama',
          model: data.llm?.model || 'qwen3.5:4b',
          voice: data.llm?.voice || 'ara',
          language: data.language || 'bn',
          ollama_base_url: data.llm?.ollama_base_url || 'http://localhost:11434/v1',
          api_key: '', livekit_url: data.api_keys?.livekit_url || '', livekit_key: '', livekit_secret: '',
        });
      })
      .catch(() => toastAlert({ title: 'Settings load হয়নি', description: 'Jarvis server চালু আছে কি না দেখুন।' }))
      .finally(() => { if (active) setFetching(false); });
    return () => { active = false; };
  }, [router]);

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
      const hasModelKey = form.provider === 'ollama' || Boolean(form.api_key.trim()) || status[form.provider];
      if (!hasModelKey) throw new Error('এই provider-এর API key দিন।');
      if (!form.livekit_url || (!form.livekit_key && !status.livekit_key) || (!form.livekit_secret && !status.livekit_secret)) {
        throw new Error('LiveKit URL, API key এবং secret পূরণ করুন।');
      }
      const payload = {
        user_id: form.user_id || form.user_name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_'),
        user_name: form.user_name,
        assistant_name: form.assistant_name,
        llm: { provider: form.provider, model: form.model, voice: form.voice, ollama_base_url: form.ollama_base_url },
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
      if (!response.ok) throw new Error(result.error || 'Settings save হয়নি।');
      toastAlert({ title: 'Settings saved', description: 'নতুন settings পরের voice session থেকে প্রযোজ্য হবে।' });
      router.push('/');
    } catch (error) {
      toastAlert({ title: 'সেটিংস সংরক্ষণ হয়নি', description: error instanceof Error ? error.message : 'আবার চেষ্টা করুন।' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <main className="flex min-h-screen items-center justify-center bg-black font-mono text-cyan-300">Loading settings…</main>;

  return (
    <main className="relative flex min-h-screen justify-center overflow-x-hidden bg-black px-4 py-10 font-mono text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
      <div className="relative z-10 my-auto w-full max-w-3xl rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_35px_rgba(6,182,212,0.13)] sm:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/70 pb-6">
          <div>
            <p className="text-xs tracking-[0.25em] text-cyan-500">JARVIS CONTROL PANEL</p>
            <h1 className="mt-2 text-3xl font-bold text-cyan-300">Settings</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push('/')} className="border-cyan-800 text-cyan-200">ফিরে যান</Button>
        </header>

        <form onSubmit={submit} className="space-y-7">
          <section className="grid gap-5 rounded-xl border border-cyan-900/60 bg-black/40 p-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="user_name">আপনাকে কী নামে ডাকব?</Label><Input id="user_name" required value={form.user_name} onChange={(e) => update('user_name', e.target.value)} className={fieldClass} /></div>
            <div className="space-y-2"><Label htmlFor="assistant_name">Assistant-এর নাম</Label><Input id="assistant_name" required value={form.assistant_name} onChange={(e) => update('assistant_name', e.target.value)} className={fieldClass} /></div>
            <div className="space-y-2">
              <Label htmlFor="provider">AI provider</Label>
              <select id="provider" value={form.provider} onChange={(e) => changeProvider(e.target.value as Provider)} className={`h-10 w-full rounded-md border px-3 text-sm ${fieldClass}`}>
                <option value="ollama">Ollama (local Qwen)</option><option value="google">Google Gemini Live</option><option value="openai">OpenAI Realtime</option>
              </select>
            </div>
            <div className="space-y-2"><Label htmlFor="model">Model name</Label><Input id="model" required value={form.model} onChange={(e) => update('model', e.target.value)} className={fieldClass} /></div>
            {form.provider === 'ollama' ? (
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="ollama_base_url">Ollama URL</Label><Input id="ollama_base_url" value={form.ollama_base_url} onChange={(e) => update('ollama_base_url', e.target.value)} className={fieldClass} /></div>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="api_key">{form.provider === 'google' ? 'Google Gemini API key' : 'OpenAI API key'} {status[form.provider] && <span className="text-emerald-400">(সংরক্ষিত; বদলাতে নতুন key দিন)</span>}</Label>
                <Input id="api_key" type="password" autoComplete="new-password" required={!status[form.provider]} value={form.api_key} onChange={(e) => update('api_key', e.target.value)} className={fieldClass} placeholder={status[form.provider] ? 'ফাঁকা রাখলে আগের key থাকবে' : 'API key'} />
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="language">কথোপকথনের ভাষা</Label><select id="language" value={form.language} onChange={(e) => update('language', e.target.value)} className={`h-10 w-full rounded-md border px-3 text-sm ${fieldClass}`}><option value="bn">বাংলা</option><option value="en">English</option><option value="hi">हिन्दी</option></select></div>
            <div className="space-y-2"><Label htmlFor="voice">Voice</Label><Input id="voice" value={form.voice} onChange={(e) => update('voice', e.target.value)} className={fieldClass} /></div>
          </section>

          <section className="space-y-4 rounded-xl border border-cyan-900/60 bg-black/40 p-5">
            <div><h2 className="font-semibold text-cyan-300">LiveKit voice connection</h2><p className="mt-1 text-xs text-slate-400">API key/secret এখানে আবার দেখানো হয় না; বদলাতে নতুন value লিখুন।</p></div>
            <Input aria-label="LiveKit URL" required placeholder="LiveKit URL (wss://...)" value={form.livekit_url} onChange={(e) => update('livekit_url', e.target.value)} className={fieldClass} />
            <Input aria-label="LiveKit API key" type="password" autoComplete="new-password" required={!status.livekit_key} placeholder={status.livekit_key ? 'API key সংরক্ষিত; বদলাতে নতুন key দিন' : 'LiveKit API key'} value={form.livekit_key} onChange={(e) => update('livekit_key', e.target.value)} className={fieldClass} />
            <Input aria-label="LiveKit API secret" type="password" autoComplete="new-password" required={!status.livekit_secret} placeholder={status.livekit_secret ? 'Secret সংরক্ষিত; বদলাতে নতুন secret দিন' : 'LiveKit API secret'} value={form.livekit_secret} onChange={(e) => update('livekit_secret', e.target.value)} className={fieldClass} />
          </section>

          <aside className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
            Ollama mode-এ Qwen local-এ চলে; voice input/output LiveKit Inference দিয়ে হবে। App-এর সেটিংসে API key-এর মান ফেরত পাঠানো হয় না।
          </aside>
          <Button type="submit" disabled={loading} className="w-full bg-cyan-600 py-6 font-bold tracking-widest text-white hover:bg-cyan-500 disabled:opacity-60">{loading ? 'সংরক্ষণ হচ্ছে…' : 'SAVE SETTINGS'}</Button>
        </form>
      </div>
    </main>
  );
}
