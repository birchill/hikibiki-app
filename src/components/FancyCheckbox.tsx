import { h, FunctionalComponent } from 'preact';

type Props = {
  id: string;
  checked?: boolean;
  onChange?: () => void;
  theme: 'orange' | 'gray';
};

export const FancyCheckbox: FunctionalComponent<Props> = (props: Props) => {
  let containerStyles = 'fancy-checkbox relative inline-block w-12 h-12';
  if (props.theme === 'orange') {
    containerStyles += ' -orange';
  } else {
    containerStyles += ' -gray';
  }

  return (
    <div class={containerStyles}>
      <input
        class="absolute opacity-0 w-0 h-0 pointer-events-none"
        type="checkbox"
        id={props.id}
        checked={props.checked}
        onChange={props.onChange}
      />
      <label for={props.id} />
      <svg
        class="tick inline-block absolute left-0 w-10 h-10 m-1 pointer-events-none"
        viewBox="0 0 16 16"
        role="presentation"
      >
        <use width="16" height="16" href="#tick" />
      </svg>
    </div>
  );
};
