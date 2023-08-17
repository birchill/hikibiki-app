import type { FunctionalComponent, JSX } from 'preact';

import { FancyCheckbox } from './FancyCheckbox';

export type AccentDisplayType = 'downstep' | 'binary' | 'none';

interface Props {
  accentDisplay: AccentDisplayType;
  showWaniKaniLevel: boolean;
  onChangeAccentDisplay?: (value: AccentDisplayType) => void;
  onChangeShowWaniKaniLevel?: (value: boolean) => void;
}

export const WordDisplayConfig: FunctionalComponent<Props> = (props: Props) => {
  const onChangeAccentDisplay = (evt: JSX.TargetedEvent<HTMLSelectElement>) => {
    if (props.onChangeAccentDisplay) {
      props.onChangeAccentDisplay(
        evt.currentTarget?.value as AccentDisplayType
      );
    }
  };

  const onChangeShowWaniKaniLevel = (
    evt: JSX.TargetedEvent<HTMLInputElement>
  ) => {
    props.onChangeShowWaniKaniLevel?.(evt.currentTarget?.checked);
  };

  return (
    <div class="mt-10">
      <div class="flex gap-8 my-8 items-center">
        <label for="accentDisplay">Pitch accent display</label>
        <select
          id="accentDisplay"
          name="accentDisplay"
          class="mt-1 form-select pl-3 pr-10 py-2
           rounded
           leading-6
           border-2 border-transparent border-dotted
           border-orange-100 focus:outline-none
           bg-orange-100 hover:bg-orange-50
           shadow-orange-default
           focus-within:border-orange-800"
          onChange={onChangeAccentDisplay}
        >
          <option
            value="downstep"
            selected={props.accentDisplay === 'downstep'}
          >
            Downstep
          </option>
          <option value="binary" selected={props.accentDisplay === 'binary'}>
            Binary
          </option>
          <option value="none" selected={props.accentDisplay === 'none'}>
            None
          </option>
        </select>
      </div>
      <div class="flex gap-8 my-8">
        <FancyCheckbox
          id="showWaniKaniVocabLevel"
          checked={props.showWaniKaniLevel}
          onChange={onChangeShowWaniKaniLevel}
          theme="orange"
        />
        <label for="showWaniKaniVocabLevel">Show WaniKani levels</label>
      </div>
    </div>
  );
};
