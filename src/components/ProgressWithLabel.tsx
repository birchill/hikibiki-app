import { h, FunctionalComponent } from 'preact';

type Props = {
  value?: number;
  max?: number;
  label: string;
};

export const ProgressWithLabel: FunctionalComponent<Props> = (props: Props) => {
  // TODO: Generate unique IDs here
  // TODO: Work out where the styles go here -- should they be here or in the
  //       css file? Should the CSS file be separate?
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
