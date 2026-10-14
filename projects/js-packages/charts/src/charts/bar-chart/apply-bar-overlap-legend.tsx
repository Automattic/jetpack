import { ComparisonLineGlyph } from './comparison-line-swatch';
import type { BarOverlapStyles } from './types';
import type { BaseLegendItem } from '../../components/legend/types';

const GLYPH_SIZE = 10;

/**
 * Restyles legend items to match the overlap layout: the outer series' tint and outline, and a
 * line glyph for each comparison.
 *
 * @param items  - Legend items, as `useChartLegendItems` builds them.
 * @param styles - The overlap styles, or null outside the overlap layout.
 * @return The restyled items, or `items` itself when `styles` is null.
 */
export function applyBarOverlapLegend(
	items: BaseLegendItem[],
	styles: BarOverlapStyles | null
): BaseLegendItem[] {
	if ( ! styles ) {
		return items;
	}

	return items.map( item => {
		if ( item.seriesLabels?.[ 0 ] === styles.outer.label ) {
			return {
				...item,
				color: styles.outer.fill,
				shapeStyle: {
					...item.shapeStyle,
					border: `1px solid ${ styles.outer.outline }`,
					boxSizing: 'border-box',
				},
			};
		}

		const comparison = styles.comparisons.find( entry => entry.label === item.describesSeries );

		return comparison
			? {
					...item,
					glyphSize: GLYPH_SIZE,
					renderGlyph: ( { size } ) => (
						<ComparisonLineGlyph
							stroke={ comparison.stroke }
							dash={ comparison.lineStyles.strokeDasharray }
							marker={ comparison.marker }
							width={ size * 2 }
							height={ size * 2 }
						/>
					),
				}
			: item;
	} );
}
