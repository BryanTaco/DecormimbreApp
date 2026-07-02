# Fonts

Place these files here for full UTF-8 PDF support (tildes, ñ, etc.):

- `DejaVuSans.ttf`
- `DejaVuSans-Bold.ttf`

Download from the DejaVu Fonts project:
  https://dejavu-fonts.github.io/

If these files are missing, ReportLab will fall back to Helvetica
(no UTF-8 support — tildes and ñ will not render correctly).

Quick download via Python (run once, from the project root):

```python
import urllib.request, os
base = "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/"
dest = "utils/fonts/"
for f in ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf"):
    urllib.request.urlretrieve(base + f, dest + f)
    print(f"Downloaded {f}")
```
