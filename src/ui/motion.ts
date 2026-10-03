export type ChangeKind = "music" | "scene" | "mix";

/** Non-blocking feedback, shared by the scenery overlay and native-dialog banner. */
export class ChangeFeedback {
  private timer?: ReturnType<typeof setTimeout>;
  private animation?: Animation;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");

  show(
    title: string,
    detail: string,
    kind: ChangeKind = "music",
    duration = 1100,
  ) {
    clearTimeout(this.timer);
    this.animation?.cancel();
    document
      .querySelectorAll<HTMLElement>("[data-change-title]")
      .forEach((el) => (el.textContent = title));
    document
      .querySelectorAll<HTMLElement>("[data-change-label]")
      .forEach(
        (el) =>
          (el.textContent = {
            music: "Settling into",
            scene: "Somewhere new",
            mix: "Shaping your ensemble",
          }[kind]),
      );
    document
      .querySelectorAll<HTMLElement>("[data-change-detail]")
      .forEach((el) => (el.textContent = detail));
    const status = document.querySelector<HTMLElement>("#change-announcement")!;
    status.textContent = `${title}. ${detail}`;
    document.body.dataset.changing = kind;
    const progress = document.querySelector<HTMLElement>("#change-progress")!;
    if (!this.reduced.matches) {
      this.animation = progress.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration, easing: "cubic-bezier(.22,.7,.3,1)", fill: "forwards" },
      );
    }
    this.timer = setTimeout(() => {
      delete document.body.dataset.changing;
      this.animation?.cancel();
    }, duration);
  }

  dispose() {
    clearTimeout(this.timer);
    this.animation?.cancel();
    delete document.body.dataset.changing;
  }
}

const closing = new WeakMap<HTMLDialogElement, Animation>();

export function openPanel(dialog: HTMLDialogElement) {
  closing.get(dialog)?.cancel();
  closing.delete(dialog);
  dialog.classList.remove("is-closing");
  if (!dialog.open) dialog.showModal();
}

/** Keep native focus trapping during exit; cancel pending exits when reopened. */
export function closePanel(dialog: HTMLDialogElement) {
  if (!dialog.open || closing.has(dialog)) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    dialog.close();
    return;
  }
  dialog.classList.add("is-closing");
  const animation = dialog.animate(
    [
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateY(8px) scale(.99)" },
    ],
    { duration: 180, easing: "ease-in", fill: "forwards" },
  );
  closing.set(dialog, animation);
  void animation.finished
    .then(() => {
      if (closing.get(dialog) !== animation) return;
      dialog.close();
      dialog.classList.remove("is-closing");
      closing.delete(dialog);
      animation.cancel();
    })
    .catch(() => {
      /* A newly opened panel canceled the previous exit. */
    });
}
