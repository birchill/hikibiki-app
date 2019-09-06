/**
 * A helper to strip certain fields from an object.
 */
export function stripFields<T extends object, K extends keyof T>(
  o: T,
  fields: K[]
): Omit<T, K> {
  const result: Partial<T> = { ...(<object>o) };
  for (const field of fields) {
    delete result[field];
  }
  return <Omit<T, K>>result;
}

export function isArrayOfStrings(a: any) {
  return (
    Array.isArray(a) &&
    (a as Array<any>).every(elem => typeof elem === 'string')
  );
}

export function isArrayOfStringsOrNumbers(a: any) {
  return (
    Array.isArray(a) &&
    (a as Array<any>).every(
      elem => typeof elem === 'string' || typeof elem === 'number'
    )
  );
}
