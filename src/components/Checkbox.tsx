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
        class="tick inline-block absolute left-0 w-8 h-8 m-1 fill-current pointer-events-none"
        viewBox="0 0 8 8"
      >
        <path
          role="presentation"
          d="M7.707 2.71L3.71 6.705a1 1 0 1 1-1.416-1.413l3.997-3.998a1 1 0 0 1 1.416 0c.39.39.39 1.024 0 1.416zM3.708 6.707a.994.994 0 0 1-1.407 0L.291 4.699A.996.996 0 0 1 1.7 3.29l2.008 2.011a.991.991 0 0 1 0 1.406z"
        />
      </svg>
    </div>
  );
};
