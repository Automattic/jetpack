/**
 * Stable class that carries the `--a8c-charts-*` catalog. Applied to the `GlobalChartsProvider` wrapper, to portal-rendered surfaces (which sit outside the provider tree), and to standalone components when no provider is above them.
 *
 * Deliberately unhashed: consumers are documented as being able to target it to override a token on the provider element.
 */
export const CHART_SCOPE_CLASS = 'a8c-charts-scope';

/**
 * Marks the x axis so `chart-paint.scss` can paint its line and tick marks without reaching the y axis.
 *
 * visx renders both axes with the same `.visx-axis-line` and `.visx-axis-tick` classes and nothing to tell them apart, and the y axis draws both unstroked on purpose. The theme fields this replaces — `xAxisLineStyles` and `xTickLineStyles` — are x-axis-only, so the stylesheet needs a matching handle or it paints a y axis line and a column of tick marks no chart has ever had.
 */
export const X_AXIS_CLASS = 'a8c-charts-axis-x';
