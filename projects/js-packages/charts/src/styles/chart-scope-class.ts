/**
 * Stable class that carries the `--a8c-charts-*` catalog. Applied to the
 * `GlobalChartsProvider` wrapper, to portal-rendered surfaces (which sit outside
 * the provider tree), and to standalone components when no provider is above them.
 *
 * Deliberately unhashed: consumers are documented as being able to target it to
 * override a token on the provider element.
 */
export const CHART_SCOPE_CLASS = 'a8c-charts-scope';
