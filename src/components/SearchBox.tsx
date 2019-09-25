import { h, FunctionalComponent } from 'preact';

type Props = {
  search?: string;
  onUpdateSearch?: (search: string) => void;
};

export const SearchBox: FunctionalComponent<Props> = (props: Props) => {
  return (
    <nav class="container mx-auto max-w-3xl -mt-half-input-text-2xl-py-6 mb-12 sm:mb-20 px-12">
      <input
        class="rounded-full w-full pl-32 sm:pl-40 pr-12 py-6 bg-gray-200 text-gray-700 placeholder-gray-700 font-medium text-2xl tracking-wide bg-no-repeat outline-none"
        type="search"
        name="q"
        placeholder="Search"
        value={props.search}
        onInput={(evt: InputEvent) => {
          if (props.onUpdateSearch && !evt.isComposing) {
            props.onUpdateSearch((evt.target as HTMLInputElement).value || '');
          }
        }}
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%208%208%22%20fill%3D%22%23B8B2A7%22%3E%3Cpath%20d%3D%22M7.7%207.7a1%201%200%200%201-1.4%200L5.13%206.56a.5.5%200%200%201%200-.68l.01-.02-.4-.41a3%203%200%201%201%20.7-.7l.4.41.01-.02a.5.5%200%200%201%20.69%200L7.71%206.3a1%201%200%200%201%200%201.42zM3%201a2%202%200%201%200%200%204%202%202%200%200%200%200-4z%22%2F%3E%3C%2Fsvg%3E%0A')",
          backgroundOrigin: 'content-box',
          backgroundPositionX: '-1.5em',
          backgroundPositionY: 'center',
          backgroundSize: '1em 1em',
        }}
      />
    </nav>
  );
};
