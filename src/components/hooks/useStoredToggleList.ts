import { useCallback, useEffect, useState } from 'preact/hooks';

export function useStoredToggleList({
  key,
  initialValues,
}: {
  key: string;
  initialValues: Array<string>;
}) {
  const [enabledItems, setEnabledItems] = useState(() => {
    let initialEnabledItems = initialValues;

    // See if we have any stored settings
    //
    // You've heard how bad localStorage is. Trust me, it's fine for this
    // particular usage. Once we have more than two prefs, we should switch to
    // an async approach like local IDB, but for now it's not worth it.
    const storedItems = localStorage.getItem(key);
    if (storedItems !== null) {
      // Drop any empty items since ''.split(',') will give [''] but we want
      // an empty array in that case.
      const asArray = storedItems.split(',').filter((item) => item.length);
      initialEnabledItems = [...new Set(asArray)];
    }

    return initialEnabledItems;
  });

  const toggleItem = useCallback(
    (key: string, state: boolean) => {
      const updatedEnabledItems = new Set(enabledItems);
      if (state) {
        updatedEnabledItems.add(key);
      } else {
        updatedEnabledItems.delete(key);
      }
      setEnabledItems(Array.from(updatedEnabledItems.values()));
    },
    [enabledItems]
  );

  useEffect(() => {
    localStorage.setItem(key, enabledItems.join(','));
  }, [enabledItems]);

  return { enabledItems, toggleItem };
}
