/**
 * RunState stores data that persists between scenes within a single run.
 * Reset at the start of each run.
 */
export class RunState {
  // Run stats
  public distance: number = 0;
  public kills: number = 0;
  public level: number = 1;
  public scrap: number = 0;
  public runTime: number = 0;
  public victory: boolean = false;
  public bossDefeated: boolean = false;
  public modulesLost: number = 0;

  // Best scores (persisted via localStorage)
  private static STORAGE_KEY = "monsterConvoy_best";

  public static current: RunState = new RunState();

  static reset() {
    RunState.current = new RunState();
  }

  static getBestScore(): number {
    try {
      const val = localStorage.getItem(RunState.STORAGE_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  static saveBestScore(score: number) {
    try {
      const best = RunState.getBestScore();
      if (score > best) {
        localStorage.setItem(RunState.STORAGE_KEY, String(score));
      }
    } catch {
      // localStorage not available
    }
  }

  /** Calculate final score */
  getScore(): number {
    let score = 0;
    score += this.kills * 10;
    score += Math.floor(this.distance);
    score += this.level * 50;
    if (this.victory) score += 2000;
    if (this.bossDefeated) score += 1000;
    return score;
  }
}
