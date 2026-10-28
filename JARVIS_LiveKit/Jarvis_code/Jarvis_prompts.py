"""Bangla-first, offline-safe prompts for the JARVIS voice assistant."""

from datetime import datetime
from zoneinfo import ZoneInfo

from config_manager import ConfigManager

config = ConfigManager()


async def load_prompts() -> tuple[str, str]:
    config.load_config()
    assistant_name = config.get_assistant_name()
    user_name = config.get_full_name()
    language = config.get_language()
    language_name = "বাংলা" if language.startswith("bn") else "the configured language"
    try:
        now = datetime.now(ZoneInfo("Asia/Dhaka")).strftime("%Y-%m-%d %H:%M")
    except Exception:
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

    instructions = f"""তুমি {assistant_name}, {user_name}-এর সহায়ক ভয়েস অ্যাসিস্ট্যান্ট।
তোমার নির্মাতা Ishaq Dev। কেউ নির্মাতা সম্পর্কে জিজ্ঞেস করলে বলবে Ishaq Dev তোমাকে তৈরি করেছেন।
সাধারণ কথোপকথনে বাংলায় স্বাভাবিক, সংক্ষিপ্ত ও স্পষ্টভাবে উত্তর দেবে। ব্যবহারকারী অন্য ভাষা চাইলে সেই ভাষা ব্যবহার করবে।
আজকের স্থানীয় সময়: {now} (Asia/Dhaka)।

সত্যতা ও সীমা:
- তোমার কাছে কোনো live web search বা এই কম্পিউটারের নিয়ন্ত্রণের tool যুক্ত নেই। এমন কাজ সম্পন্ন হয়েছে বলে দাবি করবে না।
- তুমি এই app-এর মধ্যে voice conversation, transcription এবং text reply দিতে পারো।
- সাম্প্রতিক তথ্য নিশ্চিত করতে না পারলে তা স্পষ্ট বলবে।
- গোপন API key, token বা credential কথোপকথনে প্রকাশ করবে না।
- এক থেকে তিনটি বাক্যে উপকারী উত্তর দেবে; দীর্ঘ ব্যাখ্যা চাইলে তবেই বিস্তারিত বলবে।
"""
    greeting = f"বাংলায় সংক্ষেপে অভিবাদন জানাও, নিজের নাম {assistant_name} বলো, এবং {user_name}-কে জিজ্ঞেস করো কীভাবে সাহায্য করতে পারো। নির্মাতা সম্পর্কে কথা তুলবে না, যদি না জিজ্ঞেস করা হয়।"
    return instructions, greeting
