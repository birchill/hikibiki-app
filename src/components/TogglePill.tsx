import { h, FunctionalComponent } from 'preact';

type Props = {
  label: string;
  value: string;
  checked?: boolean;
  onToggle?: (state: boolean) => void;
};

export const TogglePill: FunctionalComponent<Props> = (props: Props) => {
  let containerStyles =
    'toggle-pill inline-block rounded-full px-8 py-3 pr-10 mb-4 mr-4 border border-transparent border-dotted cursor-pointer font-medium';
  if (props.checked) {
    containerStyles +=
      ' bg-orange-100 hover:bg-orange-50 shadow-orange-default focus-within:border-orange-800';
  } else {
    containerStyles +=
      ' bg-gray-100 text-gray-600 hover:bg-white focus-within:border-gray-600';
  }

  const icon = props.checked ? (
    <svg
      class="inline-block w-8 h-8 mr-4 text-orange-400 fill-current pointer-events-none"
      viewBox="0 0 8 8"
    >
      <path
        role="presentation"
        d="M7.707 2.71L3.71 6.705a1 1 0 1 1-1.416-1.413l3.997-3.998a1 1 0 0 1 1.416 0c.39.39.39 1.024 0 1.416zM3.708 6.707a.994.994 0 0 1-1.407 0L.291 4.699A.996.996 0 0 1 1.7 3.29l2.008 2.011a.991.991 0 0 1 0 1.406z"
      />
    </svg>
  ) : (
    <svg
      class="inline-block w-8 h-8 mr-4 text-gray-600 stroke-current pointer-events-none"
      viewBox="0 0 8 8"
    >
      <circle
        r="3.8"
        cx="4"
        cy="4"
        stroke-width="0.4"
        fill="none"
        stroke-dasharray="1 2"
        stroke-linecap="round"
      />
    </svg>
  );

  return (
    <div class={containerStyles}>
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={props.checked}
          value={props.value}
          onChange={() => {
            if (props.onToggle) {
              props.onToggle(!props.checked);
            }
          }}
          class="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
        {icon}
        <span class="pointer-events-none select-none">{props.label}</span>
      </label>
    </div>
  );
};
