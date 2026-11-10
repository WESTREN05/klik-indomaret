/* Konfigurasi Stylelint: fokus pada kesalahan nyata, bukan preferensi format. */

module.exports = {
  rules: {
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-values'] },
    ],
    'no-duplicate-selectors': true,
    'property-no-unknown': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'unit-no-unknown': true,
    'at-rule-no-unknown': true,
    'font-family-no-duplicate-names': true,
    'no-invalid-double-slash-comments': true,
  },
};
