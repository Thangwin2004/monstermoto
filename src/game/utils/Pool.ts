export class Pool<T> {
  private items: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 0) {
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      this.items.push(this.createFn());
    }
  }

  get(): T {
    if (this.items.length > 0) {
      return this.items.pop()!;
    }
    return this.createFn();
  }

  release(item: T) {
    this.items.push(item);
  }
}
