import sys
sys.path.insert(0, r'C:\Users\Lenovo\streamsift\backend')
import pickle
import warnings
warnings.filterwarnings('ignore')

m = pickle.load(open(r'C:\Users\Lenovo\Downloads\yt_ai_classifier_model_2.sav','rb'))
v = pickle.load(open(r'C:\Users\Lenovo\Downloads\tfidf_vectorizer.sav','rb'))

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
