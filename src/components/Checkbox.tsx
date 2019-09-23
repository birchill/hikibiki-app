import { h, FunctionalComponent } from 'preact';

type Props = {
  id: string;
  checked?: boolean;
  onChange?: () => void;
  theme: 'orange' | 'gray';
};

export const Checkbox: FunctionalComponent<Props> = (props: Props) => {
  const containerStyles =
    props.theme === 'orange' ? 'checkbox -orange' : 'checkbox -gray';

  return (
    <div class={containerStyles}>
      <input
        type="checkbox"
        id={props.id}
        checked={props.checked}
        onChange={props.onChange}
      />
      <label for={props.id} />
      <svg
        class="tick inline-block absolute left-0 w-8 h-8 m-1 pointer-events-none"
        viewBox="0 0 16 16"
      >
        <use width="16" height="16" href="#tick" />
      </svg>
    </div>
  );
};
