/**
 * Stands in for `@visx/responsive` in jsdom, which runs no layout: its ResizeObserver never
 * reports, and `@automattic/charts` holds a chart back until it has a size. `useParentSize`
 * is all the charts package imports from it, so a project that maps this in loses the rest of
 * the module: map it only where the charts package is the only consumer.
 */

const noop = () => {};

module.exports = {
	useParentSize: () => ( { parentRef: noop, width: 800, height: 400 } ),
};
