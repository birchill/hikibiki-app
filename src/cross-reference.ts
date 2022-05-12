import { CrossReference } from '@birchill/jpdict-idb';

export function crossReferenceFromQueryString(
  params: URLSearchParams
): CrossReference | undefined {
  let k = params.get('k') || undefined;
  let r = params.get('r') || undefined;
  let sense = parseInt(params.get('sense') || '', 10) || undefined;

  if (k && r) {
    return { k, r, sense };
  } else if (k) {
    return { k, sense };
  } else if (r) {
    return { r, sense };
  }

  return undefined;
}

export function updateQueryStringFromCrossReference(
  xref: CrossReference | undefined,
  params: URLSearchParams
) {
  if (xref) {
    const k = (xref as any).k as string | undefined;
    if (k) {
      params.set('k', k);
    } else {
      params.delete('k');
    }

    const r = (xref as any).r as string | undefined;
    if (r) {
      params.set('r', r);
    } else {
      params.delete('r');
    }

    if (xref.sense) {
      params.set('sense', String(xref.sense));
    } else {
      params.delete('sense');
    }
  } else {
    params.delete('k');
    params.delete('r');
    params.delete('sense');
  }
}
