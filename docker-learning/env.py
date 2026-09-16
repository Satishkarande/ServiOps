import os

name = os.getenv("MY_NAME", "Unknown")

print(f"Hello {name}!")