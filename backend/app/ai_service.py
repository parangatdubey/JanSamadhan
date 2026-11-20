"""
JanSamadhan AI-Powered Multilingual NLP Grievance Engine.
Supports:
- India's 22 Scheduled Languages + Hinglish, Bhojpuri, Haryanvi, etc.
- Script-based and heuristic Language Identification
- Multilingual Translation to Standard English via deep-translator (MyMemory/Google) & optional Google Gemini API
- Scikit-Learn TF-IDF Classification + Rule-based heuristics for Department Routing & Priority
- Strict preservation of original citizen input alongside standardized English version
"""

import os
import re
import datetime
from typing import Dict, Any, Optional

try:
    from deep_translator import MyMemoryTranslator, GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.pipeline import Pipeline
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

import requests

# ========================================================
# Script & Language Detection Mapping for Indian Languages
# ========================================================
SCRIPT_RANGES = [
    (0x0900, 0x097F, "Devanagari"),   # Hindi, Marathi, Sanskrit, Bhojpuri, Maithili, Nepali, Konkani, Bodo, Dogri
    (0x0980, 0x09FF, "Bengali"),      # Bengali, Assamese, Manipuri
    (0x0A00, 0x0A7F, "Gurmukhi"),     # Punjabi
    (0x0A80, 0x0AFF, "Gujarati"),     # Gujarati
    (0x0B00, 0x0B7F, "Odia"),         # Odia
    (0x0B80, 0x0BFF, "Tamil"),        # Tamil
    (0x0C00, 0x0C7F, "Telugu"),       # Telugu
    (0x0C80, 0x0CFF, "Kannada"),      # Kannada
    (0x0D00, 0x0D7F, "Malayalam"),    # Malayalam
    (0x0600, 0x06FF, "Perso-Arabic"), # Urdu, Kashmiri
]

# Common regional marker words
REGIONAL_MARKERS = {
    "Bhojpuri": ["नइखे", "आवत", "गइल", "बाटे", "रहल", "हमनी", "काहे", "हमार"],
    "Haryanvi": ["सै", "कोन्या", "म्हारा", "घणा", "गाम", "बावळा", "लठ"],
    "Marathi": ["आहे", "नाही", "झाले", "पाणी", "रस्ता", "कचरा", "लाईट"],
    "Punjabi": ["ਹੈਗਾ", "ਨਹੀਂ", "ਪਾਣੀ", "ਸੜਕ", "ਬੱਤੀ", "ਕੂੜਾ"],
    "Bengali": ["নেই", "হচ্ছে", "জল", "রাস্তা", "বিদ্যুৎ", "আবর্জনা"],
    "Tamil": ["இல்லை", "தண்ணீர்", "மின்சாரம்", "குப்பை", "சாலை"],
    "Telugu": ["లేదు", "నీరు", "విద్యుత్", "చెత్త", "రోడ్డు"],
    "Kannada": ["ಇಲ್ಲ", "ನೀರು", "ವಿದ್ಯುತ್", "ಕಸ", "ರಸ್ತೆ"],
    "Malayalam": ["ഇല്ല", "വെള്ളം", "വൈദ്യുതി", "മാലിന്യം", "റോഡ്"],
    "Gujarati": ["નથી", "પાણી", "વીજળી", "કચરો", "રસ્તો"],
}

# Hinglish vocabulary indicator
HINGLISH_WORDS = [
    "paani", "pani", "bijli", "sadak", "kachra", "naali", "nali", "gaddha", "gaddhe",
    "hamare", "area", "mein", "nhi", "nahi", "raha", "rahi", "din", "se", "bohot",
    "bahut", "badbu", "aag", "tut", "gaya", "chali", "gayi", "dikkat", "samasya",
    "colony", "khamba", "gali", "subah", "shaam", "raat", "peene", "safai"
]

def detect_language_and_script(text: str) -> str:
    """Detects the Indian language or script of the input text."""
    if not text or not text.strip():
        return "English"

    # 1. Check for specific regional keywords in native script using word tokens
    words = set(re.findall(r"\w+", text))
    for lang, markers in REGIONAL_MARKERS.items():
        if any(marker in words for marker in markers):
            return lang

    # 2. Check Unicode Script Ranges
    script_counts = {}
    for char in text:
        code = ord(char)
        for start, end, script_name in SCRIPT_RANGES:
            if start <= code <= end:
                script_counts[script_name] = script_counts.get(script_name, 0) + 1

    if script_counts:
        top_script = max(script_counts, key=script_counts.get)
        if top_script == "Devanagari":
            # Check for Bhojpuri indicators
            if any(w in text for w in ["नइखे", "आवत", "हमार", "बाटे"]):
                return "Bhojpuri"
            if any(w in text for w in ["आहे", "नाही", "झाले"]):
                return "Marathi"
            return "Hindi"
        elif top_script == "Bengali":
            return "Bengali"
        elif top_script == "Gurmukhi":
            return "Punjabi"
        elif top_script == "Gujarati":
            return "Gujarati"
        elif top_script == "Odia":
            return "Odia"
        elif top_script == "Tamil":
            return "Tamil"
        elif top_script == "Telugu":
            return "Telugu"
        elif top_script == "Kannada":
            return "Kannada"
        elif top_script == "Malayalam":
            return "Malayalam"
        elif top_script == "Perso-Arabic":
            return "Urdu"

    # 3. Check for Hinglish in Latin Script
    words_lower = set(re.findall(r"\b[a-zA-Z]+\b", text.lower()))
    hinglish_matches = [w for w in words_lower if w in HINGLISH_WORDS]
    if len(hinglish_matches) >= 2 or (len(words_lower) > 0 and len(hinglish_matches) / len(words_lower) > 0.25):
        return "Hinglish"

    # 4. Default to English if Latin script
    return "English"


# ========================================================
# Hinglish Heuristic Standardizer
# ========================================================
HINGLISH_MAP = {
    # Water Supply
    r"(?i)\b(paani|pani)\b.*?\b(nahi|nhi)\b.*?\b(aa|a)\s*(raha|rahi)\b": "Water supply has been completely halted in the area.",
    r"(?i)\b(pipeline|pipe)\b.*?\b(burst|leak|leaking)\b": "A potable water supply pipeline has burst and is causing continuous water wastage.",
    r"(?i)\b(ganda|badbu|smell)\b.*?\b(paani|pani)\b": "Contaminated and foul-smelling drinking water is being supplied through the taps.",
    # Electricity
    r"(?i)\b(street\s*lights?|bijli|light)\b.*?\b(band|off)\b": "Street lights in the neighborhood are completely non-functional, causing night-time safety hazards.",
    r"(?i)\b(transformer|khamba|wire|taar)\b.*?\b(spark|aag|sparking)\b": "Electric transformer sparking and dangling live wires observed, posing severe fire risk.",
    r"(?i)\b(power\s*cut|bijli\s*chali)\b": "Unscheduled power outages and erratic low voltage are damaging electrical appliances.",
    # Road / PWD
    r"(?i)\b(sadak|road|footpath)\b.*?\b(toot|tut|kharab|gaddhe|gaddha|potholes?)\b": "The main sector road is heavily damaged with deep potholes, causing severe traffic and accident risks.",
    # Sanitation
    r"(?i)\b(kachra|kachre|dustbin|garbage)\b.*?\b(gaadi|dher|overflow|nahi\s*aayi)\b": "Municipal waste collection has not been conducted, resulting in overflowing dustbins and severe hygiene risk.",
    # Drainage
    r"(?i)\b(naali|nali|gutter|drain|sewage)\b.*?\b(overflow|block|jama|badbu)\b": "Blocked drainage and overflowing sewage line is flooding the residential road with stagnant water and foul odor.",
}

def standardize_hinglish_heuristic(text: str) -> Optional[str]:
    """Generates standardized English text from Hinglish citizen descriptions."""
    for pattern, std_eng in HINGLISH_MAP.items():
        if re.search(pattern, text):
            # Extract time duration if mentioned
            duration_match = re.search(r"(\d+|do|teen|chaar|panch|ek)\s*(din|ghante|hafte)", text.lower())
            duration_str = f" for the past {duration_match.group(0)}" if duration_match else ""
            return f"{std_eng.rstrip('.')}{duration_str}."
    return None


# ========================================================
# External Multilingual Translation Pipeline
# ========================================================
def translate_to_standard_english(text: str, detected_lang: str) -> str:
    """Translates Indian regional text into clean standard English."""
    cleaned = text.strip()
    if not cleaned:
        return ""

    if detected_lang == "English":
        return cleaned

    # Check for Gemini API key in environment
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = (
                f"You are a professional citizen grievance intake AI for the JanSamadhan portal in India.\n"
                f"Translate and standardize the following citizen complaint from {detected_lang} into clear, concise, "
                f"formal standard English suitable for municipal department action. Keep factual details exact.\n\n"
                f"Complaint: \"{cleaned}\"\n\n"
                f"Return ONLY the standardized English complaint text."
            )
            resp = requests.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                translated = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if translated:
                    return translated
        except Exception as e:
            print(f"[Gemini API Translation Fallback]: {e}")

    # If Hinglish, check heuristic pattern standardization first
    if detected_lang == "Hinglish":
        heuristic = standardize_hinglish_heuristic(cleaned)
        if heuristic:
            return heuristic

    # Use MyMemory / deep-translator for Indian language translation
    if TRANSLATOR_AVAILABLE:
        # Map detected languages to ISO language codes
        lang_code_map = {
            "Hindi": "hi-IN",
            "Bhojpuri": "hi-IN",
            "Haryanvi": "hi-IN",
            "Marathi": "mr-IN",
            "Bengali": "bn-IN",
            "Punjabi": "pa-IN",
            "Gujarati": "gu-IN",
            "Tamil": "ta-IN",
            "Telugu": "te-IN",
            "Kannada": "kn-IN",
            "Malayalam": "ml-IN",
            "Odia": "or-IN",
            "Urdu": "ur-IN",
        }
        source_code = lang_code_map.get(detected_lang, "hi-IN")

        try:
            translator = MyMemoryTranslator(source=source_code, target="en-GB")
            result = translator.translate(cleaned)
            if result and not result.lower().startswith("mymemory warning"):
                return result.strip()
        except Exception as e:
            print(f"[MyMemory Translator Notice]: {e}")

        # Fallback to GoogleTranslator free endpoint
        try:
            g_trans = GoogleTranslator(source="auto", target="en")
            result = g_trans.translate(cleaned)
            if result:
                return result.strip()
        except Exception as e:
            print(f"[GoogleTranslator Notice]: {e}")

    # Fallback: Construct standard English description from keywords
    text_lower = cleaned.lower()
    if any(k in text_lower for k in ["paani", "pani", "water", "pipeline"]):
        return f"Water supply grievance: Issue reported regarding water supply and pipeline maintenance in the residential area (Original: {cleaned})."
    elif any(k in text_lower for k in ["bijli", "light", "power", "khamba", "transformer"]):
        return f"Electricity supply grievance: Streetlight and electrical power issues reported in the sector (Original: {cleaned})."
    elif any(k in text_lower for k in ["kachra", "garbage", "dustbin", "waste", "safai"]):
        return f"Sanitation grievance: Waste accumulation and lack of municipal garbage clearance reported (Original: {cleaned})."
    elif any(k in text_lower for k in ["naali", "nali", "drain", "sewage", "gutter"]):
        return f"Drainage grievance: Choked municipal drainage and sewage overflow causing stagnation (Original: {cleaned})."
    elif any(k in text_lower for k in ["sadak", "road", "pothole", "gaddha"]):
        return f"Road infrastructure grievance: Damaged road surface and potholes requiring urgent repair (Original: {cleaned})."

    return f"Citizen Civic Grievance Report: {cleaned}"


# ========================================================
# Machine Learning & Rule-Based Domain Classifier
# ========================================================
TRAINING_DATA = [
    # Electricity
    ("Teen din se hamare area ki street lights band hain. Raat ko bahut dikkat hoti hai.", "Electricity"),
    ("Bijli chali gayi hai aur transformer me aag lag gayi hai sparking ho rahi hai", "Electricity"),
    ("Power outage in sector 4 since morning. Low voltage issue damaging appliances.", "Electricity"),
    ("Street light pole wire is hanging loose on the road, very dangerous for pedestrians", "Electricity"),
    ("Electric meter reading fault and wire spark near main gate", "Electricity"),
    ("Bijli ka khamba tut gaya hai andhera faila hua hai", "Electricity"),
    ("আমাদের এলাকায় গত তিন দিন ধরে বিদ্যুৎ নেই।", "Electricity"),
    ("రాత్రి వీధి దీపాలు వెలగడం లేదు, చాలా చీకటిగా ఉంది.", "Electricity"),
    ("மின் கம்பத்தில் இருந்து தீப்பொறி பறக்கிறது.", "Electricity"),

    # Water Supply
    ("Subah se main road par paani ki pipeline leak ho rahi hai, kaafi paani beh raha hai.", "Water Supply"),
    ("Water supply dirty and smelling bad for 2 days. Peene ka paani nahi aa raha.", "Water Supply"),
    ("No water supply in colony since 24 hours, need tanker immediately", "Water Supply"),
    ("Pipeline burst near civil lines, huge potable water wastage on the road", "Water Supply"),
    ("Paani ka pressure bohot kam hai aur ganda paani supply ho raha hai", "Water Supply"),
    ("Drinking water pipeline leakage contaminating tap water", "Water Supply"),
    ("हमारे इलाके में पिछले पांच दिनों से पानी नहीं आ रहा है।", "Water Supply"),
    ("हमार इलाका में पाँच दिन से पानी नइखे आवत।", "Water Supply"),
    ("ಕಳೆದ 3 ದಿನಗಳಿಂದ ಕುಡಿಯುವ ನೀರು ಬರುತ್ತಿಲ್ಲ.", "Water Supply"),

    # Road Maintenance (PWD)
    ("Barish ke baad main sadak par bade gaddhe ho gaye hain, accident ka darr hai.", "Road Maintenance"),
    ("Potholes on highway near bypass causing traffic jams and bike skidding", "Road Maintenance"),
    ("Sadak tooti hui hai, footpath broken near government school", "Road Maintenance"),
    ("Speed breaker unpainted and damaged road causing daily accidents", "Road Maintenance"),
    ("Road patch work incomplete for last one month, dust everywhere", "Road Maintenance"),
    ("Gaddha ho gaya hai sadak par, road construction is urgently required", "Road Maintenance"),
    ("ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿಗಳು ಬಿದ್ದಿವೆ, ವಾಹನ ಸಂಚಾರ ಕಷ್ಟವಾಗಿದೆ.", "Road Maintenance"),
    ("ரோடு மிகவும் மோசமாக உள்ளது, பள்ளங்கள் அதிகம்.", "Road Maintenance"),

    # Sanitation
    ("Hamare ward mein pichle 4 din se kachra gaadi nahi aayi, har taraf gandagi hai.", "Sanitation"),
    ("Garbage dumping in open park, strong foul smell and flies", "Sanitation"),
    ("Dustbins overflowing on market road, waste not cleared by municipal corporation", "Sanitation"),
    ("Colony ke gate ke paas kachre ka dher lag gaya hai, bimari fail sakti hai", "Sanitation"),
    ("Sanitation workers not sweeping the street for one week", "Sanitation"),
    ("Dead animal lying on the road corner, needs urgent disposal", "Sanitation"),
    ("कॉलनीमध्ये चार दिवसांपासून कचरा गाडी आलेली नाही.", "Sanitation"),
    ("ಗ್ರಾಮದಲ್ಲಿ ಕಸದ ರಾಶಿ ಬಿದ್ದಿದೆ, ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ.", "Sanitation"),

    # Drainage
    ("Naali block ho gayi hai aur ganda paani sadak par beh raha hai.", "Drainage"),
    ("Hamare area mein 4 din se naali ka paani road par jama hai aur bahut badbu aa rahi hai.", "Drainage"),
    ("Open manhole on main road, severe hazard in dark and rainy hours", "Drainage"),
    ("Sewage line overflowing into residential colony and ground floors", "Drainage"),
    ("Waterlogging after mild rain due to choked gutters and drains", "Drainage"),
    ("Gutter cover broken and sewage water stagnation creating mosquito breeding", "Drainage"),
    ("Drainage overflow near temple area causing dirty water accumulation", "Drainage"),
    ("நிரம்பி வழியும் கழிவுநீர் சாக்கடை துர்நாற்றம் வீசுகிறது.", "Drainage"),
]

CATEGORY_META = {
    "Electricity": {
        "department": "Electricity Department",
        "sub_category": "Streetlight & Power Supply",
        "keywords": ["light", "lights", "bijli", "pole", "power", "andhera", "transformer", "wire", "voltage", "spark", "విద్యుత్", "மின்சாரம்", "ವಿದ್ಯುತ್", "বিদ্যুৎ"]
    },
    "Water Supply": {
        "department": "Water Supply Department",
        "sub_category": "Pipeline & Water Quality",
        "keywords": ["paani", "pani", "water", "pipe", "pipeline", "leak", "burst", "tanker", "peene", "contamination", "tap", "জল", "நீர்", "నీరు", "ನೀರು", "पाणी"]
    },
    "Road Maintenance": {
        "department": "Public Works Department (PWD)",
        "sub_category": "Potholes & Road Damage",
        "keywords": ["road", "sadak", "pothole", "potholes", "gaddhe", "gaddha", "footpath", "highway", "accident", "breaker", "சாலை", "ರಸ್ತೆ", "ரோடு", "ರಸ್ತೆಯಲ್ಲಿ"]
    },
    "Sanitation": {
        "department": "Municipal Sanitation Corporation",
        "sub_category": "Garbage & Waste Collection",
        "keywords": ["kachra", "garbage", "dustbin", "waste", "dher", "safai", "smell", "gandagi", "sweeping", "कचरा", "చెత్త", "குப்பை", "ಕಸ"]
    },
    "Drainage": {
        "department": "Municipal Drainage Department",
        "sub_category": "Sewage & Manhole Maintenance",
        "keywords": ["naali", "nali", "sewage", "drain", "drainage", "manhole", "gutter", "waterlogging", "choked", "stagnation", "badbu", "சாக்கடை"]
    }
}

class MultilingualComplaintClassifier:
    def __init__(self):
        self.model = None
        if SKLEARN_AVAILABLE:
            try:
                texts = [item[0] for item in TRAINING_DATA]
                labels = [item[1] for item in TRAINING_DATA]
                self.model = Pipeline([
                    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
                    ("clf", MultinomialNB(alpha=0.5))
                ])
                self.model.fit(texts, labels)
            except Exception as e:
                print(f"[Classifier Fit Error]: {e}")
                self.model = None

    def process(self, raw_text: str, user_selected_lang: Optional[str] = None) -> Dict[str, Any]:
        cleaned_text = raw_text.strip()
        if not cleaned_text:
            return {
                "original_text": "",
                "detected_language": "English",
                "standardized_english": "",
                "category": "Sanitation",
                "sub_category": "General Grievance",
                "priority": "Medium",
                "department": "Municipal Sanitation Corporation",
                "formal_description": "",
                "confidence": 0.5
            }

        # 1. Detect Language
        detected_language = user_selected_lang if user_selected_lang and user_selected_lang != "Auto" else detect_language_and_script(cleaned_text)

        # 2. Standardize & Translate into Clean Standard English
        standardized_english = translate_to_standard_english(cleaned_text, detected_language)
        if not standardized_english:
            standardized_english = cleaned_text

        # Combine text for classification
        combined_text = f"{cleaned_text} {standardized_english}".lower()

        # 3. Rule-based keyword matching with scoring
        scores = {cat: 0 for cat in CATEGORY_META}
        for cat, meta in CATEGORY_META.items():
            for kw in meta["keywords"]:
                if kw in combined_text:
                    scores[cat] += 2

        best_category = max(scores, key=scores.get)
        confidence = 0.92

        # 4. Fallback to ML model if keyword confidence is low
        if scores[best_category] == 0 and self.model is not None:
            try:
                best_category = self.model.predict([cleaned_text])[0]
                proba = max(self.model.predict_proba([cleaned_text])[0])
                confidence = round(float(proba), 2)
            except Exception:
                best_category = "Sanitation"
                confidence = 0.75
        elif scores[best_category] > 0:
            confidence = min(0.98, 0.85 + (scores[best_category] * 0.02))

        meta = CATEGORY_META.get(best_category, CATEGORY_META["Sanitation"])
        department = meta["department"]
        sub_category = meta["sub_category"]

        # 5. Priority Prediction
        critical_words = ["spark", "fire", "live wire", "open manhole", "burst", "urgent", "accident", "emergency", "aag", "जान", "खतरा"]
        high_words = ["5 din", "4 din", "3 din", "five days", "four days", "three days", "overflow", "leak", "ganda", "stagnant", "badbu", "danger", "foul"]

        if any(w in combined_text for w in critical_words):
            priority = "Critical"
        elif any(w in combined_text for w in high_words):
            priority = "High"
        else:
            priority = "Medium"

        # 6. Formal Grievance Description
        formal_description = (
            f"Formal Grievance Report [{best_category} - {sub_category}]: "
            f"{standardized_english} "
            f"[Priority: {priority} | Routed to: {department}]."
        )

        return {
            "original_text": cleaned_text,
            "detected_language": detected_language,
            "standardized_english": standardized_english,
            "category": best_category,
            "sub_category": sub_category,
            "priority": priority,
            "predicted_priority": priority,
            "department": department,
            "assigned_department": department,
            "formal_description": formal_description,
            "confidence": round(confidence, 2)
        }

# Global singleton engine
multilingual_engine = MultilingualComplaintClassifier()

def classify_complaint(text: str, selected_language: Optional[str] = None) -> Dict[str, Any]:
    return multilingual_engine.process(text, selected_language)

analyze_complaint = classify_complaint


# ========================================================
# Speech-to-Text Audio Transcription Engine
# ========================================================
SPEECH_LANG_CODE_MAP = {
    "auto": "hi-IN",
    "hi": "hi-IN",
    "hi-IN": "hi-IN",
    "Hindi": "hi-IN",
    "en": "en-IN",
    "en-IN": "en-IN",
    "English": "en-IN",
    "hinglish": "hi-IN",
    "Hinglish": "hi-IN",
    "bho": "hi-IN",
    "Bhojpuri": "hi-IN",
    "bn": "bn-IN",
    "bn-IN": "bn-IN",
    "Bengali": "bn-IN",
    "mr": "mr-IN",
    "mr-IN": "mr-IN",
    "Marathi": "mr-IN",
    "te": "te-IN",
    "te-IN": "te-IN",
    "Telugu": "te-IN",
    "ta": "ta-IN",
    "ta-IN": "ta-IN",
    "Tamil": "ta-IN",
    "gu": "gu-IN",
    "gu-IN": "gu-IN",
    "Gujarati": "gu-IN",
    "pa": "pa-IN",
    "pa-IN": "pa-IN",
    "Punjabi": "pa-IN",
    "kn": "kn-IN",
    "kn-IN": "kn-IN",
    "Kannada": "kn-IN",
    "ml": "ml-IN",
    "ml-IN": "ml-IN",
    "Malayalam": "ml-IN",
    "or": "or-IN",
    "or-IN": "or-IN",
    "Odia": "or-IN",
    "ur": "ur-IN",
    "ur-IN": "ur-IN",
    "Urdu": "ur-IN",
    "hr": "hi-IN",
    "Haryanvi": "hi-IN",
}

def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: Optional[str] = None,
    language_hint: Optional[str] = "auto"
) -> Dict[str, Any]:
    """
    Transcribes spoken citizen grievance audio to text.
    Supports multilingual Indian languages using Google Speech Recognition
    with optional Google Gemini multimodal model fallback.
    """
    import io
    import speech_recognition as sr

    if not audio_bytes or len(audio_bytes) == 0:
        raise ValueError("Audio file is empty. Please record your grievance clearly.")

    lang_code = SPEECH_LANG_CODE_MAP.get(str(language_hint).strip(), "hi-IN")
    transcribed_text = None

    # Option A: Google Gemini Multimodal Audio Transcription (if GEMINI_API_KEY is configured)
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            import base64
            mime_type = "audio/wav"
            if filename and filename.lower().endswith(".mp3"):
                mime_type = "audio/mp3"
            elif filename and filename.lower().endswith(".ogg"):
                mime_type = "audio/ogg"
            elif filename and filename.lower().endswith(".webm"):
                mime_type = "audio/webm"

            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            prompt = (
                "You are an accurate multilingual speech-to-text transcriber for the JanSamadhan citizen grievance portal in India. "
                "Listen to this audio recording of a citizen complaint. Transcribe the exact words spoken by the citizen in the original language. "
                "If spoken in Hindi, Marathi, Bengali, Bhojpuri, Punjabi, etc., transcribe in the native script or Hinglish as spoken. "
                "Return ONLY the plain transcription text without commentary or prefixes."
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_audio
                                }
                            }
                        ]
                    }
                ]
            }
            resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                candidate_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                if candidate_text:
                    transcribed_text = candidate_text
        except Exception as e:
            print(f"[Gemini Audio Transcription Notice]: {e}")

    # Option B: SpeechRecognition (Google Web Speech API)
    if not transcribed_text:
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True

        audio_data = None
        # Attempt 1: Direct RIFF/WAV loading
        try:
            with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
                audio_data = recognizer.record(source)
        except Exception as wav_err:
            # Attempt 2: Pydub conversion if other container format
            try:
                from pydub import AudioSegment
                segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
                wav_io = io.BytesIO()
                segment.export(wav_io, format="wav")
                wav_io.seek(0)
                with sr.AudioFile(wav_io) as source:
                    audio_data = recognizer.record(source)
            except Exception as pydub_err:
                raise RuntimeError(
                    f"Unable to decode audio format. Please ensure audio is in WAV, MP3, or WebM format. (Details: {wav_err})"
                )

        if not audio_data:
            raise RuntimeError("Could not process audio track.")

        # Try specified language first
        try:
            transcribed_text = recognizer.recognize_google(audio_data, language=lang_code)
        except sr.UnknownValueError:
            # If specified language failed, and it wasn't English, try en-IN or hi-IN as secondary attempt
            if lang_code != "en-IN":
                try:
                    transcribed_text = recognizer.recognize_google(audio_data, language="en-IN")
                except Exception:
                    pass
            if not transcribed_text:
                raise ValueError("Could not understand audio. Please speak clearly into the microphone and try again.")
        except sr.RequestError as req_err:
            raise RuntimeError(f"Speech recognition service unavailable: {req_err}")

    if not transcribed_text or not transcribed_text.strip():
        raise ValueError("No speech detected in the recording. Please speak clearly into the microphone.")

    detected_lang = detect_language_and_script(transcribed_text)
    return {
        "success": True,
        "text": transcribed_text.strip(),
        "detected_language": detected_lang
    }
