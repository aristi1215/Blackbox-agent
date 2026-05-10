# Witsmith pitch slides

LaTeX Beamer deck for the 3-minute pitch (tracked under `slides/`).

**Build** (from `slides/`):

```sh
latexmk -pdf witsmith_pitch.tex
# or: pdflatex witsmith_pitch.tex (twice)
```

**Script / structure:** follows your local `docs/pitch_story_v2.md` beats. Appendix frames: toggle `\showappendixtrue` in `witsmith_pitch.tex`.

**Assets:** `assets/wow-diff.png`, `assets/qr.png`, `assets/smith.png` (see also `assets/README.md`).
