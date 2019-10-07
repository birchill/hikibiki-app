import { h, FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

type Props = {
  deadline: Date;
};

export const CountDown: FunctionalComponent<Props> = (props: Props) => {
  const [dateString, setDateString] = useState(toRelativeTime(props.deadline));

  useEffect(() => {
    const updateIntervalMs = getUpdateIntervalMs(props.deadline);
    if (updateIntervalMs === null) {
      return;
    }

    const setTimeoutHandle = setTimeout(() => {
      setDateString(toRelativeTime(props.deadline));
    }, updateIntervalMs);

    return () => {
      clearTimeout(setTimeoutHandle);
    };
  }, [props.deadline, dateString]);

  return <time dateTime={props.deadline.toISOString()}>{dateString}</time>;
};

function toRelativeTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 100) {
    return 'any time now';
  }

  if (diff <= 1000) {
    return 'in 1 second';
  }

  if (diff < 60.5 * 1000) {
    return `in ${Math.round(diff / 1000)} seconds`;
  }

  if (diff < 90 * 1000) {
    return 'in 1 minute';
  }

  if (diff < 60.5 * 60 * 1000) {
    console.log(diff);
    return `in ${Math.round(diff / (60 * 1000))} minutes`;
  }

  if (diff <= 60.5 * 60 * 1000) {
    return 'in 1 hour';
  }

  return `in ${Math.round(diff / (60 * 60 * 1000))} hours`;
}

function getUpdateIntervalMs(date: Date): number | null {
  const diff = date.getTime() - Date.now();
  if (diff < 100) {
    return null;
  }

  if (diff < 60 * 1000) {
    return 1000;
  }

  // XXX This is all wrong... if the deadline is 70 seconds away, the update
  // interval should be 10 seconds, not 1 minute.
  if (diff < 60 * 60 * 1000) {
    return 60 * 1000;
  }

  return 60 * 60 * 1000;
}
