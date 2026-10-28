'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWakeWord } from '@/hooks/useWakeWord';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  assistantName?: string;
  disabled: boolean;
  sessionStarted: boolean;
}

export const SessionView = ({
  appConfig,
  assistantName = "Jarvis",
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    await send(message);
  }

  // --- WAKE WORD LOGIC ---
  const [hasUnmuted, setHasUnmuted] = useState(false);

  // Use the native Web Speech API hook (no API key required)
  const { keywordDetection, isLoaded, isListening } = useWakeWord(undefined, sessionStarted);

  // Auto-mute mic initially if wake word is active
  useEffect(() => {
    if (sessionStarted && isLoaded) {
      room.localParticipant.setMicrophoneEnabled(false);
      toastAlert({ title: 'WAKE WORD ACTIVE', description: 'Microphone muted. Say "Jarvis" to begin.' });
    }
  }, [sessionStarted, isLoaded, room]);

  // Unmute mic when wake word is detected
  useEffect(() => {
    if (keywordDetection !== null) {
      console.log('Wake word detected!');
      room.localParticipant.setMicrophoneEnabled(true);
      toastAlert({ title: 'JARVIS LISTENING', description: 'Microphone unmuted.' });
    }
  }, [keywordDetection, room]);

  // Auto re-mute after agent finishes
  useEffect(() => {
    if (agentState === 'thinking' || agentState === 'speaking') {
      if (room.localParticipant.isMicrophoneEnabled) {
        setHasUnmuted(true);
      }
    } else if (agentState === 'listening' && hasUnmuted) {
      room.localParticipant.setMicrophoneEnabled(false);
      setHasUnmuted(false);
      toastAlert({ title: 'Jarvis idle', description: 'Microphone muted.' });
    }
  }, [agentState, hasUnmuted, room]);
  // -----------------------

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'opacity-0',
        // prevent page scrollbar
        // when !chatOpen due to 'translate-y-20'
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-3 whitespace-pre-wrap">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      <div className="bg-background mp-12 fixed top-0 right-0 left-0 h-32 md:h-36">
        {/* skrim */}
        <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
      </div>

      <MediaTiles chatOpen={chatOpen} />

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center text-xl tracking-widest',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                {!isLoaded ? (
                  <p className="animate-text-shimmer inline-block !bg-clip-text font-bold text-transparent from-cyan-400 to-blue-600 bg-gradient-to-r">
                    {assistantName} is now listening...
                  </p>
                ) : (
                  <p className={cn(
                    "inline-block font-bold transition-all duration-300",
                    isListening && (room.localParticipant.isMicrophoneEnabled)
                      ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]"
                      : "text-blue-500/50 animate-pulse"
                  )}>
                    {isListening && (room.localParticipant.isMicrophoneEnabled)
                      ? "LISTENING TO REQUEST 🎙️"
                      : 'WAITING FOR WAKE WORD "JARVIS"...'}
                  </p>
                )}
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
