import { h, FunctionalComponent } from 'preact';

import { TogglePill } from './TogglePill';

const referenceLabels: Array<[string, string]> = [
  ['kanken', '漢検'],
  ['conning', 'Conning'],
  ['nelson_c', 'Classic Nelson'],
  ['halpern_njecd', 'Halpbern'],
  ['heisig6', 'Heisig (6th ed.)'],
  ['henshall', 'Henshall'],
  ['busy_people', 'Japanese for Busy People'],
  ['kanji_in_context', 'Kanji in Context'],
  ['sh_desc', 'The Kanji Dictionary'],
  ['halpern_kkld_2ed', "Kanji Learner's Dictionary (2nd ed.)"],
  ['kodansha_compact', 'Kodansha Compact Kanji Guide'],
  ['nelson_n', 'New Nelson'],
  ['skip', 'SKIP'],
  ['sh_kk2', 'Tuttle Kanji & Kana (2011)'],
];

const linkLabels: Array<[string, string]> = [
  ['kanjialive', 'Kanji Alive'],
  ['wiktionary', 'Wiktionary'],
  ['kanjipedia', 'Kanjipedia'],
];

interface Props {
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
  onToggleReference?: (ref: string, state: boolean) => void;
  onToggleLink?: (ref: string, state: boolean) => void;
}

export const ReferencesConfig: FunctionalComponent<Props> = (props: Props) => {
  const enabledReferences = new Set(props.enabledReferences || []);
  const enabledLinks = new Set(props.enabledLinks || []);

  return (
    <div class="mt-10 -mb-4">
      <div class="flex">
        <svg
          class="w-10 h-10 flex-shrink-0 fill-current mr-8 mt-3"
          viewBox="0 0 16 16"
        >
          <use width="16" height="16" href="#book" />
        </svg>
        <div>
          {referenceLabels.map(([id, label]) => (
            <TogglePill
              value={id}
              label={label}
              checked={enabledReferences.has(id)}
              onToggle={(state: boolean) => {
                if (props.onToggleReference) {
                  props.onToggleReference(id, state);
                }
              }}
            />
          ))}
        </div>
      </div>
      <div class="flex mt-8">
        <svg
          class="w-10 h-10 flex-shrink-0 fill-current mr-8 mt-3"
          viewBox="0 0 16 16"
        >
          <use width="16" height="16" href="#link" />
        </svg>
        <div>
          {linkLabels.map(([id, label]) => (
            <TogglePill
              value={id}
              label={label}
              checked={enabledLinks.has(id)}
              onToggle={(state: boolean) => {
                if (props.onToggleLink) {
                  props.onToggleLink(id, state);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
