import { h, FunctionalComponent } from 'preact';

type Props = {
  value?: number;
  max?: number;
  label: string;
};

export const ProgressWithLabel: FunctionalComponent<Props> = (props: Props) => {
  return (
    <div class="relative flex flex-col justify-center">
      <progress
        max={props.max}
        value={props.value}
        id="update-progress"
        class="progress"
      />
      <label for="progress-bar" class="absolute ml-5 text-white font-semibold">
        {props.label}
      </label>
    </div>
  );
};
