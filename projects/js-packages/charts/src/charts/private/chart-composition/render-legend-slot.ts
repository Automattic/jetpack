import { createElement, Fragment } from 'react';
import type { LegendChild } from './use-chart-children';
import type { LegendPosition } from '../../../types';
import type { ReactNode } from 'react';

/**
 * Renders legend children filtered by position slot.
 *
 * @param {LegendChild[]}  legendChildren - The legend children to filter and render
 * @param {LegendPosition} position       - The position slot to render
 * @return {ReactNode[]} Array of legend elements for the given position
 */
export function renderLegendSlot(
	legendChildren: LegendChild[],
	position: LegendPosition
): ReactNode[] {
	return legendChildren
		.filter( l => l.position === position )
		.map( ( l, i ) =>
			createElement( Fragment, { key: `legend-${ position }-${ i }` }, l.element )
		);
}
