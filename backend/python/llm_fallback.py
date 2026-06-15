import os
import time
import random
import json
import re
from typing import List
from groq import Groq
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# === Gemini configuration ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash") if GEMINI_API_KEY else None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

API_KEYS = [
    os.getenv("GROQ_API_KEY"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
    os.getenv("GROQ_API_KEY_4"),
    os.getenv("GROQ_API_KEY_5"),
]

API_KEYS = [key for key in API_KEYS if key]

FALLBACK_MODELS = [
    "deepseek-r1-distill-llama-70b",
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "llama-3.3-70b-versatile",
]

class LLMFallbackManager:
    def __init__(self):
        # --- Gemini setup ---
        self.gemini_model = None
        if GEMINI_API_KEY and DEFAULT_GEMINI_MODEL:
            try:
                self.gemini_model = genai.GenerativeModel(DEFAULT_GEMINI_MODEL)
                print(f"🚀 Using Gemini model '{DEFAULT_GEMINI_MODEL}' as primary LLM")
            except Exception as e:
                print(f"⚠️  Failed to initialize Gemini ({e}), will rely on Groq fallback")
                self.gemini_model = None

        if not API_KEYS:
            if self.gemini_model is None:
                raise Exception("Neither GROQ API keys nor Gemini API key found in environment.")
            else:
                print("⚠️  No GROQ API keys found; operating in Gemini-only mode.")
        self.api_keys = API_KEYS
        self.models = FALLBACK_MODELS
        self.key_index = 0
        self.model_index = 0
        self.cooldowns = {}  # Key: timestamp when key becomes available

    def _current_time(self):
        return time.time()

    def _key_available(self, index):
        key = self.api_keys[index]
        return self.cooldowns.get(key, 0) <= self._current_time()

    def _rotate_key(self):
        original = self.key_index
        while True:
            self.key_index = (self.key_index + 1) % len(self.api_keys)
            if self._key_available(self.key_index) or self.key_index == original:
                break
        print(f"🔁 Switched to API key #{self.key_index + 1}")

    def _rotate_model(self):
        self.model_index = (self.model_index + 1) % len(self.models)
        print(f"🔁 Switched to model: {self.models[self.model_index]}")

    def _mark_key_on_cooldown(self, seconds=60):
        key = self.api_keys[self.key_index]
        self.cooldowns[key] = self._current_time() + seconds
        print(f"⏳ Key #{self.key_index + 1} on cooldown for {seconds}s")

    def get_client(self):
        return Groq(api_key=self.api_keys[self.key_index])

    def get_model(self):
        return self.models[self.model_index]

    # Helper: convert messages to prompt
    def _messages_to_prompt(self, messages: List[dict]) -> str:
        prompt_lines = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_lines.append(f"{role.capitalize()}: {content}")
        return "\n".join(prompt_lines)

    def make_request(self, messages, max_tokens=2048, temperature=0.2, max_retries=15):
        # 1️⃣ Try Gemini
        if self.gemini_model is not None:
            try:
                prompt_text = self._messages_to_prompt(messages)
                response = self.gemini_model.generate_content(
                    prompt_text,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    },
                )
                try:
                    content = "".join([part.text for part in response.parts])
                except AttributeError:
                    content = getattr(response, "text", str(response))
                print("Response received successfully")
                return content
            except Exception as gem_err:
                print(f"❌ Gemini failed ({gem_err}); falling back to Groq...")
                self.gemini_model = None

        # Groq fallback
        if not self.api_keys:
            raise Exception("Gemini failed and no GROQ_API_KEYs provided for fallback.")

        last_error = None
        for attempt in range(max_retries):
            try:
                client = self.get_client()
                model = self.get_model()
                print(f"⚙️ Attempt {attempt + 1}: Key #{self.key_index + 1}, Model: {model}")

                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                content = response.choices[0].message.content
                print(f"✅ Success. Tokens used: {response.usage.total_tokens}")
                return content

            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                print(f"[RETRY] {str(e).splitlines()[0]}")

                if "rate limit" in err_str or "too many requests" in err_str:
                    self._mark_key_on_cooldown(seconds=60)
                    self._rotate_key()

                elif "token" in err_str or "context" in err_str:
                    self._rotate_model()

                elif "quota" in err_str or "billing" in err_str:
                    self._mark_key_on_cooldown(seconds=600)
                    self._rotate_key()

                elif "model" in err_str or "not available" in err_str:
                    self._rotate_model()

                else:
                    self._rotate_key()

                delay = min(2 ** attempt + random.uniform(0, 1), 10)
                print(f"⏳ Retrying after {delay:.1f}s...")
                time.sleep(delay)

        print("💥 All retries failed.")
        raise Exception(f"LLM call failed after {max_retries} attempts. Last error: {last_error}")
