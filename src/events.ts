export interface MusicEvent {
  kind: "note" | "chord" | "cycle" | "beat";
  time: number;
  midi?: number;
  voice?: number;
  chord?: number;
  cycle: number;
  stage: number;
}

export class MusicEvents {
  private listeners = new Set<(event: MusicEvent) => void>();
  on(listener: (event: MusicEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event: MusicEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
