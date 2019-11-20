const ReferenceIds = [
  'radical',
  'nelson_r',
  'kanken',
  'conning',
  'nelson_c',
  'halpern_njecd',
  'heisig6',
  'henshall',
  'busy_people',
  'jlpt',
  'kanji_in_context',
  'sh_desc',
  'halpern_kkld_2ed',
  'kodansha_compact',
  'maniette',
  'nelson_n',
  'py',
  'skip',
  'sh_kk2',
  'unicode',
] as const;

export type ReferenceId = typeof ReferenceIds[number];

export const ReferenceLabels: Array<[ReferenceId, string]> = [
  ['radical', 'Radical'],
  ['nelson_r', 'Nelson Radical'],
  ['kanken', '漢検'],
  ['conning', 'Conning'],
  ['nelson_c', 'Classic Nelson'],
  ['halpern_njecd', 'Halpern'],
  ['heisig6', 'Heisig (6th ed.)'],
  ['henshall', 'Henshall'],
  ['busy_people', 'Japanese for Busy People'],
  ['jlpt', 'JLPT'],
  ['kanji_in_context', 'Kanji in Context'],
  ['sh_desc', 'The Kanji Dictionary'],
  ['halpern_kkld_2ed', "Kanji Learner's Dictionary (2nd ed.)"],
  ['kodansha_compact', 'Kodansha Compact Kanji Guide'],
  ['maniette', 'Les Kanjis dans la tete'],
  ['nelson_n', 'New Nelson'],
  ['py', 'Pinyin'],
  ['skip', 'SKIP'],
  ['sh_kk2', 'Tuttle Kanji & Kana (2011)'],
  ['unicode', 'Unicode'],
];

export function filterReferencesByLanguage(
  references: Array<[ReferenceId, string]>,
  lang?: string
): Array<[ReferenceId, string]> {
  return references.filter(
    ([id]) =>
      id !== 'maniette' || (typeof lang !== 'undefined' && lang === 'fr')
  );
}

export function getReferenceLabels({ lang }: { lang?: string }) {
  return filterReferencesByLanguage(ReferenceLabels, lang);
}
