let timer: ReturnType<typeof setInterval> | undefined;
self.onmessage = (event: MessageEvent<boolean>) => {
  if (timer) clearInterval(timer);
  timer = event.data
    ? setInterval(() => self.postMessage("tick"), 25)
    : undefined;
};
