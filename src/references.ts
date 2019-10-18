export const ReferenceLabels: Array<[string, string]> = [
  ['kanken', '漢検'],
  ['conning', 'Conning'],
  ['nelson_c', 'Classic Nelson'],
  ['halpern_njecd', 'Halpern'],
  ['heisig6', 'Heisig (6th ed.)'],
  ['henshall', 'Henshall'],
  ['busy_people', 'Japanese for Busy People'],
  ['kanji_in_context', 'Kanji in Context'],
  ['sh_desc', 'The Kanji Dictionary'],
  ['halpern_kkld_2ed', "Kanji Learner's Dictionary (2nd ed.)"],
  ['kodansha_compact', 'Kodansha Compact Kanji Guide'],
  ['maniette', 'Les Kanjis dans la tete'],
  ['nelson_n', 'New Nelson'],
  ['skip', 'SKIP'],
  ['sh_kk2', 'Tuttle Kanji & Kana (2011)'],
];

export function filterReferencesByLanguage(
  references: Array<[string, string]>,
  lang?: string
): Array<[string, string]> {
  return references.filter(
    ([id]) =>
      id !== 'maniette' || (typeof lang !== 'undefined' && lang === 'fr')
  );
}

export function getReferenceLabels({ lang }: { lang?: string }) {
  return filterReferencesByLanguage(ReferenceLabels, lang);
}
