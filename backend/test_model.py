import os
import sys
import pickle
import warnings
import types
from sklearn.feature_extraction.text import TfidfVectorizer

# Patch for missing vectorizer class
class tfIdfInheritVectorizer(TfidfVectorizer):
    pass

mock_mod = types.ModuleType("tfIdfInheritVectorizer")
mock_mod.tfIdfInheritVectorizer = tfIdfInheritVectorizer
sys.modules["tfIdfInheritVectorizer"] = mock_mod

warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
m_path = os.path.join(BASE_DIR, 'yt_ai_classifier_model_2.sav')
v_path = os.path.join(BASE_DIR, 'tfidf_vectorizer.sav')

print(f"Testing model loading from: {BASE_DIR}")
m = pickle.load(open(m_path, 'rb'))
v = pickle.load(open(v_path, 'rb'))

tests = [
    'This is amazing and wonderful!',
    'This is terrible garbage!',
    'ok I guess',
    'I hate this so much',
    'great video love it',
    'worst video ever, disliked',
    'meh nothing special',
]

import re
def preprocess(text):
    return re.sub(r"http\S+", "", str(text))

clean = [preprocess(t) for t in tests]
feats = v.transform(clean)
preds = m.predict(feats)
probs = m.predict_proba(feats)

id2label = {0: "bad", 1: "neutral", 2: "good"}

for t, p, pr in zip(tests, preds, probs):
    print(f"pred={p} label={id2label.get(p,'?')} probs={[round(x,2) for x in pr]} | {t}")
