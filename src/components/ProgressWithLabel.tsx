import { h, FunctionalComponent } from 'preact';

type Props = {
  id: string;
  value?: number;
  max?: number;
  label: string;
};

export const ProgressWithLabel: FunctionalComponent<Props> = (props: Props) => {
  // TODO: Work out where the styles go here -- should they be here or in the
  //       CSS file?
  return (
    <div class="relative flex flex-col justify-center">
      <progress
        max={props.max}
        value={props.value}
        id={props.id}
        class="progress"
      />
      <label for={props.id} class="absolute ml-5 text-white font-semibold">
        {props.label}
      </label>
    </div>
  );
};
