import { FunctionalComponent, JSX } from 'preact';
import { useCallback, useRef } from 'preact/hooks';

type Props = {
  search?: string;
  onUpdateSearch?: (options: {
    search: string;
    historyMode?: 'replace' | 'push' | 'skip';
  }) => void;
};

// We update history when either:
//
// a) The user submits the data (e.g. presses Enter, but not when simply
//    committing the input being composed)
//
// b) A suitable delay expires without any input.
//
// To make this behave naturally, we don't actually want to commit the history
// entry until the _next_ input. Otherwise, we'll end up with duplicate history
// entries since the "current" history entry will also have the same data
// and pressing back will appear to not work.
//
// That means we have three states:
//
// 1) No URL to commit, no timer running
// 2) URL to commit on next input, no timer running
// 3) Timer running (current URL will be queued)
type HistoryUpdateState = null | string | number;

export const SearchBox: FunctionalComponent<Props> = (props: Props) => {
  const historyUpdateState = useRef<HistoryUpdateState>();

  const queueHistoryUpdate = () => {
    if (typeof historyUpdateState.current === 'number') {
      self.clearTimeout(historyUpdateState.current);
    }
    historyUpdateState.current = document.location.href;
  };

  const clearHistoryUpdate = () => {
    if (typeof historyUpdateState.current === 'number') {
      self.clearTimeout(historyUpdateState.current);
    }
    historyUpdateState.current = null;
  };

  const onSubmit = useCallback((evt: JSX.TargetedEvent<HTMLFormElement>) => {
    evt.preventDefault();
    queueHistoryUpdate();
    // Hide the on-screen keyboard
    document.documentElement.focus();
  }, []);

  const onInput = useCallback(
    (evt: JSX.TargetedEvent<HTMLInputElement, InputEvent>) => {
      // Commit any pending history update
      if (typeof historyUpdateState.current === 'string') {
        history.pushState({}, '', historyUpdateState.current);
      }
      clearHistoryUpdate();

      const search = evt.currentTarget?.value ?? '';
      if (props.onUpdateSearch) {
        props.onUpdateSearch({ search });
      }

      // Reset history update timer
      historyUpdateState.current = self.setTimeout(queueHistoryUpdate, 3000);
    },
    [props.onUpdateSearch]
  );

  // I failed to make Preact recognize enterKeyHint.
  // Succeeded with React. Who knows.
  const specialProps = {
    enterKeyHint: 'search',
  };

  return (
    <nav class="container mx-auto max-w-3xl -mt-half-input-text-2xl-py-6 mb-12 sm:mb-20 px-12">
      <form action="/" method="get" onSubmit={onSubmit}>
        <input
          class="rounded-full w-full pl-32 sm:pl-40 pr-12 py-6 bg-white text-gray-700 placeholder-gray-700 placeholder-opacity-50 font-medium text-2xl tracking-wide bg-no-repeat outline-none shadow-search-default"
          type="search"
          name="q"
          autofocus={!props.search}
          placeholder="Search"
          value={props.search || ''}
          onInput={onInput}
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%208%208%22%20fill%3D%22%23B8B2A7%22%3E%3Cpath%20d%3D%22M7.7%207.7a1%201%200%200%201-1.4%200L5.13%206.56a.5.5%200%200%201%200-.68l.01-.02-.4-.41a3%203%200%201%201%20.7-.7l.4.41.01-.02a.5.5%200%200%201%20.69%200L7.71%206.3a1%201%200%200%201%200%201.42zM3%201a2%202%200%201%200%200%204%202%202%200%200%200%200-4z%22%2F%3E%3C%2Fsvg%3E%0A')",
            backgroundOrigin: 'content-box',
            backgroundPositionX: '-1.5em',
            backgroundPositionY: 'center',
            backgroundSize: '1em 1em',
          }}
          aria-label="Search"
          {...specialProps}
        />
      </form>
    </nav>
  );
};
