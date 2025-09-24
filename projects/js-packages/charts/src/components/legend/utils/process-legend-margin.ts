import type { CSSProperties } from 'react';

type LegendMarginObject = {
	top?: number | string;
	right?: number | string;
	bottom?: number | string;
	left?: number | string;
};

type LegendMargin = string | LegendMarginObject;

/**
 * Processes legend margin prop into CSS properties
 *
 * @param legendMargin - Margin value as string or object
 * @return CSS properties object for margin
 */
export function processLegendMargin( legendMargin?: LegendMargin ): CSSProperties {
	if ( legendMargin === undefined || legendMargin === null ) {
		return {};
	}

	if ( typeof legendMargin === 'string' ) {
		return { margin: legendMargin };
	}

	// Process object format, filtering out undefined values and converting numbers to px
	const marginProps: CSSProperties = {};

	if ( legendMargin.top !== undefined ) {
		marginProps.marginTop =
			typeof legendMargin.top === 'number' ? `${ legendMargin.top }px` : legendMargin.top;
	}

	if ( legendMargin.right !== undefined ) {
		marginProps.marginRight =
			typeof legendMargin.right === 'number' ? `${ legendMargin.right }px` : legendMargin.right;
	}

	if ( legendMargin.bottom !== undefined ) {
		marginProps.marginBottom =
			typeof legendMargin.bottom === 'number' ? `${ legendMargin.bottom }px` : legendMargin.bottom;
	}

	if ( legendMargin.left !== undefined ) {
		marginProps.marginLeft =
			typeof legendMargin.left === 'number' ? `${ legendMargin.left }px` : legendMargin.left;
	}

	return marginProps;
}
