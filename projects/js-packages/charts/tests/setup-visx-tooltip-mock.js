/**
 * Mock for `@visx/tooltip`'s useTooltipInPortal hook to provide valid containerBounds in tests.
 *
 * In JSDOM, react-use-measure (used internally by useTooltipInPortal) cannot update
 * bounds because its ResizeObserver callback fires synchronously before the component
 * is mounted, failing the internal `mounted.current` guard. This leaves containerBounds
 * at {0, 0, ...}, which causes tooltip positioning guards to suppress tooltips.
 *
 * This mock wraps the real hook and ensures containerBounds always has non-zero values.
 */

jest.mock( '@visx/tooltip', () => {
	const actualVisxTooltip = jest.requireActual( '@visx/tooltip' );
	return {
		...actualVisxTooltip,
		useTooltipInPortal: config => {
			const result = actualVisxTooltip.useTooltipInPortal( config );
			return {
				...result,
				// Provide non-zero bounds so tooltip positioning guard passes in tests
				containerBounds: {
					...result.containerBounds,
					width: result.containerBounds.width || 500,
					height: result.containerBounds.height || 500,
					left: result.containerBounds.left || 0,
					top: result.containerBounds.top || 0,
				},
			};
		},
	};
} );
