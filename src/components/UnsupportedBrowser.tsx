import { h, FunctionalComponent } from 'preact';

type Props = {
  missingFeatures: Array<string>;
};

export const UnsupportedBrowser: FunctionalComponent<Props> = (
  props: Props
) => {
  return (
    <div class="unsupported-browser container mx-auto max-w-3xl my-12 p-12 rounded-lg bg-orange-100 text-orange-1000 font-medium">
      <p>
        We&rsquo;re really sorry, but your browser doesn&rsquo;t support some
        features this app needs (namely {props.missingFeatures.join(',')}).
      </p>
      <p class="mt-12">
        If you like, you could try{' '}
        <a
          class="font-bold border-b border-dotted border-orange-1000"
          href="https://getfirefox.com"
        >
          downloading Firefox
        </a>{' '}
        and using it instead to open this app.
      </p>
    </div>
  );
};
