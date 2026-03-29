import pickle
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
v_path = os.path.join(BASE_DIR, 'tfidf_vectorizer.sav')

with open(v_path, 'rb') as f:
    data = f.read()

# Look for module name in the binary data
# Pickle module names typically appear after \x8c (short string) or \x8d (long string)
print(f"Data length: {len(data)}")
# We can use pickle tools to inspect
import pickletools
try:
    with open(v_path, 'rb') as f:
        for op, arg, pos in pickletools.genops(f):
            if op.name in ['GLOBAL', 'SHORT_BINUNICODE', 'BINUNICODE']:
                print(f"Pos {pos}: {op.name} {arg}")
            if pos > 2000: # Just look at the start
                break
except Exception as e:
    print(f"Error inspecting pickle: {e}")
