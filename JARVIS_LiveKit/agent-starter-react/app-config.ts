import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'J.A.R.V.I.S.',
  pageTitle: 'J.A.R.V.I.S. — Ishaq Dev',
  pageDescription: 'বাংলা-প্রথম LiveKit voice assistant',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#0075f2ff',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Talk To Jarvis',

  agentName: undefined,
};
