import { theme } from './theme.js';

export class OverallProgress {
  private total = 0;
  private current = 0;

  public start(total: number): void {
    this.total = total;
    this.current = 0;
    this.print();
  }

  public advance(step = 1, total = this.total): void {
    if (total !== this.total) {
      this.total = total;
    }
    this.current = Math.min(this.current + step, this.total);
    this.print();
  }

  public stop(): void {
    console.log('');
  }

  public getCurrent(): number {
    return this.current;
  }

  private print(): void {
    const percentage = this.total === 0
      ? 0
      : Math.floor((this.current / this.total) * 100);
    const barSize = 20;
    const filled = this.total === 0
      ? 0
      : Math.round((this.current / this.total) * barSize);
    const empty = barSize - filled;
    const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;

    console.log(
      `  ${theme.muted('Overall')}  ${theme.primary(`[${bar}]`)}  ${percentage}%  ${theme.muted(`(${this.current} / ${this.total} steps)`)}`,
    );
  }
}
