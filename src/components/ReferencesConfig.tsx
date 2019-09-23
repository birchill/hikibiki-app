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
          viewBox="0 0 8 8"
        >
          <path
            role="presentation"
            d="M7 8H2V0h2v4l1.5-1.5L7 4V0c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1zM0 7V1c0-.6.4-1 1-1v8a1 1 0 0 1-1-1z"
          />
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
          viewBox="0 0 8 8"
        >
          <path
            role="presentation"
            d="M7.413 3.416l-.495.497c-.52.518-1.246.66-1.91.489l1.697-1.698a1 1 0 0 0-1.418-1.419L3.595 2.978c-.166-.659-.023-1.379.492-1.896l.497-.496a2 2 0 0 1 2.829 2.83zM2.14 5.854a.5.5 0 0 1 0-.71l3-3a.5.5 0 1 1 .707.709L2.848 5.854a.5.5 0 0 1-.708 0zm-.853.852a1 1 0 0 0 1.419 0l1.697-1.698c.17.663.028 1.392-.491 1.909l-.496.497A2 2 0 0 1 .587 4.585l.496-.498c.515-.515 1.236-.657 1.896-.491L1.287 5.287a1 1 0 0 0 0 1.419z"
          />
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
