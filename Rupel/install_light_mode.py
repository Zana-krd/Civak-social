#!/usr/bin/env python3
"""Rupel: add a Light / Dark theme switch.

Usage (from the project folder, e.g. Rupel/):
    python3 install_light_mode.py              # install (auto-detects app/page.tsx)
    python3 install_light_mode.py --regen      # regenerate only the CSS (after adding new colors)
    python3 install_light_mode.py --undo       # restore the backup and remove the CSS file
    python3 install_light_mode.py path/to/page.tsx

How it works (dark mode is NOT touched):
  * New file app/rupel-theme.css = "light" overrides, active only when <html data-theme="light">.
  * The CSS is generated from the Tailwind color classes actually found in your code.
  * page.tsx gets: theme state + saved choice, a toggle in Settings, and a Settings tab in the bottom bar.
If anything is not found exactly as expected, NOTHING is changed.
"""
import pathlib
import re
import shutil
import sys

CSS_NAME = "rupel-theme.css"

# ---------------------------------------------------------------- palettes (Tailwind v3 hex values)
GRAY = {50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280',
        600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712'}
AMBER = {50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
         600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'}
RED = {50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444',
       600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a'}
PALETTES = {'gray': GRAY, 'amber': AMBER, 'red': RED}

# ---------------------------------------------------------------- light-theme mapping
BG_GRAY = {950: '#f3f4f6', 900: '#ffffff', 800: '#e5e7eb', 700: '#d1d5db', 600: '#9ca3af'}
TEXT_GRAY = {50: '#111827', 100: '#111827', 200: '#1f2937', 300: '#374151', 400: '#4b5563', 500: '#6b7280',
             600: '#6b7280', 700: '#4b5563', 800: '#374151', 900: '#111827'}
BORDER_GRAY = {950: '#e5e7eb', 900: '#e5e7eb', 800: '#e5e7eb', 700: '#d1d5db', 600: '#9ca3af', 500: '#9ca3af'}
PLACEHOLDER_GRAY = {400: '#9ca3af', 500: '#9ca3af', 600: '#9ca3af'}
TEXT_AMBER = {100: '#78350f', 200: '#78350f', 300: '#92400e', 400: '#b45309', 500: '#b45309', 600: '#92400e'}
TEXT_RED = {200: '#991b1b', 300: '#b91c1c', 400: '#dc2626', 500: '#dc2626'}

DECL = {'bg': 'background-color', 'text': 'color', 'border': 'border-color', 'divide': 'border-color',
        'placeholder': 'color', 'fill': 'fill', 'stroke': 'stroke', 'decoration': 'text-decoration-color'}
ALLOWED_VARIANTS = {'hover', 'focus', 'group-hover', 'active'}
NEUTRAL = {'transparent', 'current', 'inherit'}

TOKEN = re.compile(
    r'(?<![\w/\[-])((?:[A-Za-z0-9_-]+:)*)'
    r'(bg|text|border|divide|placeholder|fill|stroke|decoration|ring|from|via|to|outline|shadow|accent|caret)-'
    r'(white|black|transparent|current|inherit|'
    r'(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|'
    r'violet|purple|fuchsia|pink|rose)-\d{2,3})'
    r'(?:/(\d{1,3}))?(?![\w-])')
ARBITRARY = re.compile(r'(?<![\w-])(?:bg|text|border|from|via|to|shadow|ring|fill|stroke)-\[(?:#|rgb|hsl|color)')


class Unmapped(Exception):
    pass


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def fmt(hexv, alpha=None):
    if alpha is None:
        return hexv
    r, g, b = hex_rgb(hexv)
    return f"rgba({r},{g},{b},{alpha / 100:g})"


def base_hex(name, shade):
    if name == 'white':
        return '#ffffff'
    if name == 'black':
        return '#000000'
    try:
        return PALETTES[name][shade]
    except KeyError:
        raise Unmapped(f"{name}-{shade}")


def light_color(util, color, alpha):
    if color in ('white', 'black'):
        name, shade = color, None
    else:
        name, shade = color.rsplit('-', 1)
        shade = int(shade)
    a = None if alpha is None else int(alpha)
    ident = lambda: fmt(base_hex(name, shade), a)

    if util == 'bg':
        if name == 'gray':
            if shade == 950 and a is not None and a < 50:
                return ident()                      # dark overlays stay dark
            if shade in BG_GRAY:
                return fmt(BG_GRAY[shade], a)
            raise Unmapped(f"bg-{color}")
        if name == 'red' and shade == 950:
            return fmt('#ef4444', (100 if a is None else a) * 0.25)
        if name in ('amber', 'red', 'black', 'white'):
            return ident()
    elif util == 'text':
        if name == 'white':
            return fmt('#111827', a)
        if name == 'gray':
            if shade == 950:
                return ident()
            if shade in TEXT_GRAY:
                return fmt(TEXT_GRAY[shade], a)
        elif name == 'amber':
            return fmt(TEXT_AMBER.get(shade) or base_hex(name, shade), a)
        elif name == 'red':
            return fmt(TEXT_RED.get(shade) or base_hex(name, shade), a)
        elif name == 'black':
            return ident()
    elif util in ('border', 'divide'):
        if name == 'gray':
            if shade in BORDER_GRAY:
                return fmt(BORDER_GRAY[shade], a)
        elif name in ('amber', 'red', 'white', 'black'):
            return ident()
    elif util == 'placeholder':
        if name == 'gray' and shade in PLACEHOLDER_GRAY:
            return fmt(PLACEHOLDER_GRAY[shade], a)
        if name in ('amber', 'red'):
            return ident()
    elif util in ('fill', 'stroke', 'decoration'):
        if name in ('amber', 'red', 'black', 'white'):
            return ident()
    raise Unmapped(f"{util}-{color}")


def esc(s):
    return re.sub(r'([^A-Za-z0-9_-])', r'\\\1', s)


def build_css(texts):
    tokens, flagged = {}, []
    for label, text in texts:
        for m in ARBITRARY.finditer(text):
            flagged.append(f"{label}: arbitrary color {m.group(0)}...")
        for m in TOKEN.finditer(text):
            tokens[m.group(0)] = m.groups()
    rules = {'base': [], 'focus': [], 'hover': [], 'group': []}
    for tok in sorted(tokens):
        prefix, util, color, alpha = tokens[tok]
        if color in NEUTRAL:
            continue
        variants = [v for v in prefix.split(':') if v]
        if len(variants) > 1 or (variants and variants[0] not in ALLOWED_VARIANTS):
            flagged.append(f"{tok}  (unsupported variant)")
            continue
        try:
            val = light_color(util, color, alpha)
        except Unmapped:
            flagged.append(f"{tok}  (no light mapping)")
            continue
        c = esc(tok)
        root = 'html[data-theme="light"]'
        variant = variants[0] if variants else ''
        if util == 'divide':
            sel = {'': f'{root} .{c} > *', 'hover': f'{root} .{c}:hover > *', 'focus': f'{root} .{c}:focus > *'}.get(variant)
            if sel is None:
                flagged.append(f"{tok}  (unsupported variant)")
                continue
        elif util == 'placeholder':
            sel = f'{root} .{c}::placeholder'
        elif variant == '':
            sel = f'{root} .{c}'
        elif variant == 'hover':
            sel = f'{root} .{c}:hover'
        elif variant == 'focus':
            sel = f'{root} .{c}:focus'
        elif variant == 'active':
            sel = f'{root} .{c}:active'
        else:  # group-hover
            sel = f'{root} .group:hover .{c}'
        line = f"{sel} {{ {DECL[util]}: {val}; }}"
        bucket = {'': 'base', 'focus': 'focus', 'active': 'focus', 'hover': 'hover', 'group-hover': 'group'}[variant]
        rules[bucket].append(line)
    out = ['/* Generated by install_light_mode.py - do not edit by hand.',
           '   Light theme overrides. Active only when <html data-theme="light">. */',
           'html[data-theme="light"] { color-scheme: light; }',
           'html[data-theme="dark"] { color-scheme: dark; }',
           'html[data-theme="light"] body { background-color: #f3f4f6; color: #111827; }', '']
    out += rules['base'] + rules['focus']
    if rules['hover']:
        out += ['@media (hover: hover) {'] + ['  ' + r for r in rules['hover']] + ['}']
    out += rules['group']
    n = sum(len(v) for v in rules.values())
    return "\n".join(out) + "\n", n, flagged


# ---------------------------------------------------------------- page.tsx patches
THEME_STATE = r'''
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem('rupel_theme');
    } catch {
      // Ignore storage access issues
    }
    const initial = saved === 'light' ? 'light' : 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const applyTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('rupel_theme', next);
    } catch {
      // Ignore storage errors
    }
  };'''

SETTINGS_ROW = r'''
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div>
                <p className="text-sm font-medium text-white">
                  {dict.themeLabel}
                </p>
                <p className="text-xs text-gray-400">
                  {dict.themeDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-pressed={theme === 'light'}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-amber-400 rounded-xl transition"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
                <span>{theme === 'dark' ? dict.themeLight : dict.themeDark}</span>
              </button>
            </div>'''

SETTINGS_TAB = r'''

          <button
            type="button"
            onClick={() => {
              setViewedAuthor(null);
              setActiveSection('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 transition ${
              activeSection === 'settings' ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span className="text-[11px] font-medium truncate max-w-[92px]">{dict.settingsNav}</span>
          </button>'''

KU_KEYS = ("    themeLabel: 'Dîmen',\n    themeDesc: 'Moda tarî / ronî',\n"
           "    themeLight: 'Moda ronî',\n    themeDark: 'Moda tarî',")
SO_KEYS = ("    themeLabel: 'ڕەنگی ڕووکار',\n    themeDesc: 'تاریک / ڕووناک',\n"
           "    themeLight: 'ڕووناک',\n    themeDark: 'تاریک',")


def fail(msg):
    print("\n[STOP] " + msg)
    print("Nothing was changed.")
    sys.exit(1)


def one(text, needle, label):
    n = text.count(needle)
    if n != 1:
        fail(f"{label}: expected exactly 1 match, found {n}.")


def sub_once(text, pattern, repl, label, flags=0):
    ms = list(re.finditer(pattern, text, flags))
    if len(ms) != 1:
        fail(f"{label}: expected exactly 1 match, found {len(ms)}.")
    m = ms[0]
    return text[:m.start()] + repl(m) + text[m.end():]


def insert_after_line(text, anchor, new, label):
    one(text, anchor, label)
    i = text.index(anchor)
    j = text.index("\n", i)
    return text[:j] + "\n" + new + text[j:]


def patch_page(text):
    if "rupel_theme" in text:
        fail("page.tsx already contains the theme switch (already installed?).")
    text = sub_once(text, r"(\n  Compass,)(\s*\} from 'lucide-react';)",
                    lambda m: m.group(1) + "\n  Sun,\n  Moon," + m.group(2), "lucide import")
    text = insert_after_line(text, "import { createClient } from '@supabase/supabase-js';",
                             f"import './{CSS_NAME}';", "css import")
    text = insert_after_line(text, "const [lang, setLang] = useState<'ku' | 'so'>('ku');",
                             THEME_STATE.lstrip("\n"), "theme state")
    text = insert_after_line(text, "interfaceLangDesc: 'Kurmancî (Sereke) / Soranî (Tê tomarkirin)',",
                             KU_KEYS, "ku dict")
    text = insert_after_line(text, "interfaceLangDesc: 'کورمانجی (سەرەکی) / سۆرانی (پاشەکەوت دەکرێت)',",
                             SO_KEYS, "so dict")
    text = sub_once(text, r"(<span>\{dict\.switchLang\}</span>\s*</button>\s*</div>)(\s*</section>)",
                    lambda m: m.group(1) + SETTINGS_ROW + m.group(2), "settings row")
    one(text, "grid grid-cols-3 items-center h-14 px-2", "bottom nav grid")
    text = text.replace("grid grid-cols-3 items-center h-14 px-2", "grid grid-cols-4 items-center h-14 px-2")
    k = text.find("Fixed Bottom Navigation Bar")
    if k < 0:
        fail("bottom navigation marker not found.")
    m = re.compile(r"</button>(\s*</div>\s*</nav>)").search(text, k)
    if not m:
        fail("end of the bottom navigation not found.")
    text = text[:m.start()] + "</button>" + SETTINGS_TAB + m.group(1) + text[m.end():]
    return text


def collect_texts(page, page_text):
    texts = [(str(page), page_text)]
    roots = [page.parent]
    comp = page.parent.parent / "components"
    if comp.exists():
        roots.append(comp)
    for root in roots:
        for p in root.rglob("*"):
            if p.suffix in (".tsx", ".ts", ".jsx", ".js") and p != page and "node_modules" not in p.parts:
                try:
                    texts.append((str(p), p.read_text(encoding="utf-8")))
                except Exception:
                    pass
    return texts


def find_page():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        return pathlib.Path(args[0])
    for p in pathlib.Path(".").rglob("page.tsx"):
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        try:
            if "rupel_lang" in p.read_text(encoding="utf-8"):
                return p
        except Exception:
            pass
    return None


def main():
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    page = find_page()
    if not page or not page.exists():
        fail("Could not find page.tsx. Pass its path: python3 install_light_mode.py app/page.tsx")
    css_path = page.parent / CSS_NAME
    bak = pathlib.Path(str(page) + ".lm.bak")

    if "--undo" in flags:
        if not bak.exists():
            fail(f"No backup found ({bak}).")
        shutil.copy(bak, page)
        bak.unlink()
        if css_path.exists():
            css_path.unlink()
        print("Restored page.tsx and removed", css_path)
        return

    text = page.read_text(encoding="utf-8")
    if "--regen" in flags:
        css, n, flagged = build_css(collect_texts(page, text))
        if flagged and "--force" not in flags:
            fail("Some color classes have no light mapping:\n  " + "\n  ".join(sorted(set(flagged))))
        css_path.write_text(css, encoding="utf-8")
        print(f"Regenerated {css_path} ({n} rules).")
        return

    new_text = patch_page(text)
    css, n, flagged = build_css(collect_texts(page, new_text))
    if flagged and "--force" not in flags:
        fail("Some color classes have no light mapping (send me this list):\n  "
             + "\n  ".join(sorted(set(flagged))) + "\n  (or re-run with --force to accept the gaps)")
    shutil.copy(page, bak)
    css_path.write_text(css, encoding="utf-8")
    page.write_text(new_text, encoding="utf-8")
    print("Done.")
    print(f"  updated : {page}   (backup: {bak})")
    print(f"  created : {css_path}   ({n} rules)")
    if flagged:
        print("  warning : unmapped classes were skipped:", ", ".join(sorted(set(flagged))))
    print("Next: npx tsc --noEmit   then   npm run dev")
    print("Undo any time: python3 install_light_mode.py --undo")


if __name__ == "__main__":
    main()
