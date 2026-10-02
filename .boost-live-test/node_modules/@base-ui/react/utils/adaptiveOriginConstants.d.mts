export declare const DEFAULT_SIDES: {
  readonly sideX: 'left';
  readonly sideY: 'top';
};
export type AdaptiveOriginMiddleware = {
  name: string;
  fn: (...args: any[]) => any;
};