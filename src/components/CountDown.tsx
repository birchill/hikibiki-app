import type { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

type Props = {
  deadline: Date;
};

export const CountDown: FunctionalComponent<Props> = (props: Props) => {
  const [relativeTime, setRelativeTime] = useState(
    toRelativeTime(props.deadline)
  );

  useEffect(() => {
    if (relativeTime.date !== props.deadline) {
      setRelativeTime(toRelativeTime(props.deadline));
    }

    if (relativeTime.nextUpdate === null) {
      return;
    }

    const setTimeoutHandle = setTimeout(() => {
      setRelativeTime(toRelativeTime(props.deadline));
    }, relativeTime.nextUpdate - Date.now());

    return () => {
      clearTimeout(setTimeoutHandle);
    };
  }, [props.deadline, relativeTime.date, relativeTime.nextUpdate]);

  return (
    <time dateTime={props.deadline.toISOString()}>{relativeTime.asString}</time>
  );
};

function toRelativeTime(date: Date): {
  date: Date;
  asString: string;
  nextUpdate: number | null;
} {
  const now = Date.now();
  const diff = date.getTime() - now;

  if (diff < 100) {
    return { date, asString: 'any moment now', nextUpdate: null };
  }

  if (diff <= 1000) {
    return { date, asString: 'in 1 second', nextUpdate: date.getTime() };
  }

  // From 00:00:01 ~ 00:01:00 wait 1 second between each update.
  if (diff < 59 * 1000) {
    const toNextSecond = diff % 1000 || 1000;
    return {
      date,
      asString: `in ${Math.ceil(diff / 1000)} seconds`,
      nextUpdate: now + toNextSecond + 100,
    };
  }

  // From 00:01:00 ~ 00:01:30 wait until the end of the minute.
  if (diff < 90 * 1000) {
    return {
      date,
      asString: 'in 1 minute',
      nextUpdate: now + (diff - 59 * 1000 || 100) + 100,
    };
  }

  // From 00:01:30 ~ 00:59:30 wait until the next 30s mark.
  if (diff < 59 * 60 * 1000) {
    const toNextMinute = diff % (60 * 1000) || 60 * 1000;
    return {
      date,
      asString: `in ${Math.ceil(diff / (60 * 1000))} minutes`,
      nextUpdate: now + toNextMinute + 100,
    };
  }

  // From 00:59:30 ~ 01:30:00 wait until the end of the hour.
  if (diff < 90 * 60 * 1000) {
    return {
      date,
      asString: 'in 1 hour',
      nextUpdate: now + (diff - 59 * 60 * 1000 || 100) + 100,
    };
  }

  // From there on, wait until the next 30 min mark
  const toNextHour = diff % (60 * 60 * 1000) || 60 * 60 * 1000;
  return {
    date,
    asString: `in ${Math.ceil(diff / (60 * 60 * 1000))} hours`,
    nextUpdate: now + toNextHour + 100,
  };
}
