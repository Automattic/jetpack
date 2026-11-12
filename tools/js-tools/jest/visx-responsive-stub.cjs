/**
 * Reports a parent size in jsdom, which runs no layout, so a chart that waits for one draws.
 *
 * Only that hook is replaced: `@visx/xychart` reads `debounce` from here in `TooltipProvider`
 * and `AnimatedPath`, and `ParentSize` in `XYChart`. Install with
 * `visxResponsiveModuleMapper()`, which carries the entry the `require` below needs.
 */

const actual = require( 'jetpack-js-tools/jest/visx-responsive-actual' );

const noop = () => {};

module.exports = {
	...actual,
	useParentSize: () => ( { parentRef: noop, width: 800, height: 400 } ),
};
