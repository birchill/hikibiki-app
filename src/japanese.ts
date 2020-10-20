// This is just a very basic test to help us determine if we should search
// on the kanji/kana indices or the gloss indices.
//
// Basically if we have at least one character that could be Japanese,
// treat the whole string as Japanese
export function hasJapanese(text: string): boolean {
  if (!text.length) {
    return false;
  }

  return [...text]
    .map((c) => c.codePointAt(0)!)
    .some((c) => {
      // Hiragana
      if ((c >= 0x3040 && c <= 0x309f) || c === 0x1b001) {
        return true;
      }

      // Katakana
      if (
        (c >= 0x30a0 && c <= 0x30ff) ||
        (c >= 0x31f0 && c <= 0x31ff) ||
        c === 0x1b000
      ) {
        return true;
      }

      // Kanji
      if (
        (c >= 0x4e00 && c <= 0x9fea) ||
        (c >= 0x3400 && c <= 0x4dbf) /* Ideographs extension A */ ||
        (c >= 0x20000 && c <= 0x2ebef) /* Ideographs extension B&C&D&E */
      ) {
        return true;
      }

      // Half-width katakana
      if (c >= 0xff65 && c <= 0xff9f) {
        return true;
      }

      // Hentaigana
      if (c >= 0x1b002 && c <= 0x1b0ff) {
        return true;
      }

      return false;
    });
}
