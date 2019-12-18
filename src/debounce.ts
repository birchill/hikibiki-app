export function debounce(func: Function, wait: number) {
  let timeout: number | null;
  return function() {
    const context = this;
    const args = arguments;
    self.clearTimeout(timeout as number);
    timeout = self.setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}
