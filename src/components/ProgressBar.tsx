import { FunctionalComponent } from 'preact';

type Props = {
  id: string;
  value?: number;
  max?: number;
  label: string;
};

export const ProgressBar: FunctionalComponent<Props> = ({
  id,
  value,
  max,
  label,
}: Props) => {
  const width =
    typeof value === 'number' && typeof max === 'number'
      ? Math.round(Math.max(Math.min(value / max, 1), 0) * 100) + '%'
      : '100%';

  return (
    <div
      class="progress-bar relative flex flex-col justify-center w-full h-20 rounded-sm border border-red-900 bg-red-100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div class="bar h-full rounded-sm" style={{ width }} id={id} />
      <label for={id} class="label absolute ml-5 text-white font-semibold">
        {label}
      </label>
    </div>
  );
};
