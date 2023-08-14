import { FunctionalComponent } from 'preact';

import { TogglePill } from './TogglePill';
import { getReferenceLabels } from '../references';
import { LinkLabels } from '../links';

interface Props {
  lang?: string;
  enabledReferences?: Array<string>;
  enabledLinks?: Array<string>;
  onToggleReference?: (ref: string, state: boolean) => void;
  onToggleLink?: (ref: string, state: boolean) => void;
}

export const ReferencesConfig: FunctionalComponent<Props> = (props: Props) => {
  const enabledReferences = new Set(props.enabledReferences || []);
  const enabledLinks = new Set(props.enabledLinks || []);
  const referenceLabels = getReferenceLabels({ lang: props.lang });

  return (
    <div class="mt-10 -mb-4">
      <div class="flex">
        <svg
          class="w-10 h-10 shrink-0 fill-current mr-8 mt-3"
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
          class="w-10 h-10 shrink-0 fill-current mr-8 mt-3"
          viewBox="0 0 16 16"
        >
          <use width="16" height="16" href="#link" />
        </svg>
        <div>
          {LinkLabels.map(([id, label]) => (
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
