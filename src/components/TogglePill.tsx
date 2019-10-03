import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';

type Props = {
  label: string;
  value: string;
  checked?: boolean;
  onToggle?: (state: boolean) => void;
};

export const TogglePill: FunctionalComponent<Props> = (props: Props) => {
  let containerStyles =
    'inline-block rounded-full px-8 py-3 pr-10 mb-4 mr-4 border border-transparent border-dotted cursor-pointer font-medium';
  if (props.checked) {
    containerStyles +=
      ' bg-orange-100 hover:bg-orange-50 shadow-orange-default focus-within:border-orange-800';
  } else {
    containerStyles +=
      ' bg-gray-100 text-gray-600 hover:bg-white focus-within:border-gray-600';
  }

  const icon = props.checked ? (
    <svg
      class="inline-block w-8 h-8 mr-4 text-orange-400 pointer-events-none"
      viewBox="0 0 16 16"
    >
      <use width="16" height="16" href="#tick" />
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

  const onChange = useCallback(() => {
    if (props.onToggle) {
      props.onToggle(!props.checked);
    }
  }, [props.onToggle, props.checked]);

  return (
    <div
      class={containerStyles}
      style={{ transition: 'background-color 0.2s' }}
    >
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={props.checked}
          value={props.value}
          onChange={onChange}
          class="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
        {icon}
        <span class="pointer-events-none select-none">{props.label}</span>
      </label>
    </div>
  );
};
