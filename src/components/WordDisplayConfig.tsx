import { h, FunctionalComponent, JSX } from 'preact';

export type AccentDisplayType = 'downstep' | 'binary' | 'none';

interface Props {
  accentDisplay: AccentDisplayType;
  onChangeAccentDisplay?: (value: AccentDisplayType) => void;
}

export const WordDisplayConfig: FunctionalComponent<Props> = (props: Props) => {
  const onChangeAccentDisplay = (evt: JSX.TargetedEvent<HTMLSelectElement>) => {
    if (props.onChangeAccentDisplay) {
      props.onChangeAccentDisplay(
        evt.currentTarget?.value as AccentDisplayType
      );
    }
  };

  return (
    <div class="mt-10 -mb-4">
      <div class="browser-style">
        <label for="accentDisplay">Pitch accent display</label>
        <select
          id="accentDisplay"
          name="accentDisplay"
          class="ml-4 mt-1 form-select pl-3 pr-10 py-2
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
    </div>
  );
};
