"""LiveKit voice agent for JARVIS, with cloud realtime and local Ollama modes."""

import asyncio
import logging
import os
import sys
import time

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, ChatContext, RoomInputOptions, inference
from livekit.plugins import google, openai, silero

from config_manager import ConfigManager, ENV_FILE_PATH
from Jarvis_prompts import load_prompts

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("jarvis.agent")
config = ConfigManager()


class Assistant(Agent):
    def __init__(self, chat_ctx: ChatContext, instructions_text: str) -> None:
        super().__init__(instructions=instructions_text, chat_ctx=chat_ctx)


async def entrypoint(ctx: agents.JobContext) -> None:
    config.load_config()
    instructions, greeting = await load_prompts()
    llm_config = config.get_llm_config()
    provider = llm_config.get("provider", "ollama").lower()
    model_name = llm_config.get("model", "qwen3.5:4b")
    language = config.get_language() or "bn"
    voice_name = llm_config.get("voice", "ara")

    session_options = {"preemptive_generation": True}
    if provider == "google":
        api_key = config.get_api_key("google")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is missing. Add it in JARVIS Settings.")
        llm = google.beta.realtime.RealtimeModel(
            model=model_name,
            api_key=api_key,
            voice=voice_name or "Puck",
        )
    elif provider == "openai":
        api_key = config.get_api_key("openai")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is missing. Add it in JARVIS Settings.")
        llm = openai.realtime.RealtimeModel(
            model=model_name,
            api_key=api_key,
            voice=voice_name or "alloy",
        )
    elif provider == "ollama":
        base_url = llm_config.get("ollama_base_url") or "http://localhost:11434/v1"
        llm = openai.LLM.with_ollama(model=model_name, base_url=base_url)
        session_options.update(
            stt=inference.STT(model="google/gemini-3.5-transcribe-live", language=language),
            tts=inference.TTS(model="xai/tts-1", voice=voice_name or "ara", language=language),
            vad=silero.VAD.load(),
        )
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

    session = AgentSession(llm=llm, **session_options)
    initial_context = ChatContext()
    initial_context.add_message(
        role="assistant",
        content=f"The user's name is {config.get_full_name()}. Reply in the configured language.",
    )
    await session.start(
        room=ctx.room,
        agent=Assistant(chat_ctx=initial_context, instructions_text=instructions),
        room_input_options=RoomInputOptions(),
    )
    await session.generate_reply(instructions=greeting)


def main() -> None:
    load_dotenv(ENV_FILE_PATH, override=False)
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    print("JARVIS voice agent is starting. Waiting for LiveKit credentials...")
    while True:
        config.load_config()
        livekit_values = [
            config.get_api_key("livekit_url"),
            config.get_api_key("livekit_key"),
            config.get_api_key("livekit_secret"),
        ]
        if all(livekit_values):
            os.environ["LIVEKIT_URL"] = livekit_values[0]
            os.environ["LIVEKIT_API_KEY"] = livekit_values[1]
            os.environ["LIVEKIT_API_SECRET"] = livekit_values[2]
            logger.info("Local profile found; launching voice worker.")
            break
        print("Add the LiveKit URL, API key, and secret in the Settings page. Checking again shortly...")
        time.sleep(2)

    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))


if __name__ == "__main__":
    main()
