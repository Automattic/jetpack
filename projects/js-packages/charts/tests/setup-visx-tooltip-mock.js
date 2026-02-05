/**
 * Mock for `@visx/tooltip`'s useTooltipInPortal hook to provide valid containerBounds in tests.
 *
 * In JSDOM, getBoundingClientRect() returns zeros since there's no real layout.
 * This causes our tooltip positioning guard (which checks containerBounds.width/height > 0)
 * to prevent tooltips from showing in tests.
 *
 * This mock wraps the real hook and overrides containerBounds with non-zero values.
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
				},
			};
		},
	};
} );
