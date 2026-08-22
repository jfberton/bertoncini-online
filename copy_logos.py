import os
import shutil

dest_dir = r"e:\Federico\Desarrollo\Mios\BertonciniOnline\assets\images"
os.makedirs(dest_dir, exist_ok=True)

img1 = r"C:\Users\berton\.gemini\antigravity\brain\86179fa5-9f74-4f0a-8dd1-29e7cf1abd93\.user_uploaded\media_1787404092715.png"
img2 = r"C:\Users\berton\.gemini\antigravity\brain\86179fa5-9f74-4f0a-8dd1-29e7cf1abd93\.user_uploaded\media_1787404113552.png"

shutil.copy(img1, os.path.join(dest_dir, "logo-light.png"))
shutil.copy(img2, os.path.join(dest_dir, "logo-dark.png"))

print("Files copied successfully to", dest_dir)
for f in os.listdir(dest_dir):
    print(" -", f)
