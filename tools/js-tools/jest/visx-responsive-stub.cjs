/**
 * Stands in for `@visx/responsive` in jsdom, which runs no layout: visx's `ResizeObserver`
 * never fires, so `useParentSize` returns 0x0 forever and a chart that waits for a size never
 * draws.
 *
 * Only that hook is replaced. The rest of the module has to stay real, because `@visx/xychart`
 * reads `debounce` from here in `TooltipProvider` and `AnimatedPath` and `ParentSize` in
 * `XYChart`. Install both halves with `visxResponsiveModuleMapper()` rather than by hand: this
 * file cannot resolve the package itself, and `jest.requireActual` is caught by the same
 * mapping that installs it.
 */

const actual = require( 'jetpack-js-tools/jest/visx-responsive-actual' );

const noop = () => {};

module.exports = {
	...actual,
	useParentSize: () => ( { parentRef: noop, width: 800, height: 400 } ),
};
