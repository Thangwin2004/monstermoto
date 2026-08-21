/**
 * Common math helpers used across all game systems.
 */

/** Euclidean distance between two points */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/** Squared distance (avoids sqrt for comparisons) */
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/** Check circle-circle overlap */
export function circlesOverlap(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
): boolean {
    const r = r1 + r2;
    return distanceSq(x1, y1, x2, y2) <= r * r;
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Angle from (x1,y1) to (x2,y2) in radians */
export function angleTo(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
}

/** Normalize a vector, returns [nx, ny] */
export function normalize(x: number, y: number): [number, number] {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return [0, 0];
    return [x / len, y / len];
}

/** Move towards a target value by a maximum step */
export function moveTowards(current: number, target: number, maxStep: number): number {
    const diff = target - current;
    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
}

/** Convert degrees to radians */
export const DEG_TO_RAD = Math.PI / 180;

/** Convert radians to degrees */
export const RAD_TO_DEG = 180 / Math.PI;

/** Smooth step (ease in-out) */
export function smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
}

/** Map a value from one range to another */
export function mapRange(
    value: number,
    inMin: number, inMax: number,
    outMin: number, outMax: number
): number {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
