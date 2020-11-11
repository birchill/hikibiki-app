import { useEffect, useState } from 'preact/hooks';

export function useStoredValue<T>({
  key,
  defaultValue,
}: {
  key: string;
  defaultValue: T;
}) {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null
      ? ((storedValue as unknown) as T)
      : defaultValue;
  });

  useEffect(() => {
    if (value) {
      localStorage.setItem(key, String(value));
    } else {
      localStorage.removeItem(key);
    }
  }, [value]);

  return { value, setValue };
}
