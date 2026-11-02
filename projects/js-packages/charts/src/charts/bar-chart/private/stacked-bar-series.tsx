import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import { computeSlotRect, getValueScalePosition } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { StackLayout, StackSegment } from './stack-layout';
import type { DataPointDate } from '../../../types';
import type { BarChartProps } from '../types';
import type { AxisScale } from '@visx/axis';
import type { GlyphProps, SeriesProps } from '@visx/xychart';

type Props = Pick<
	SeriesProps< AxisScale, AxisScale, DataPointDate >,
	'xAccessor' | 'yAccessor'
> & {
	dataKey: string;
	data: DataPointDate[];
	colorAccessor: ( datum: DataPointDate ) => string;
	barClassName?: BarChartProps[ 'barClassName' ];
	/** The slots of a category, in the order the band lays them out. */
	slotKeys: string[];
	/** The slot the stack sits in. */
	slotKey: string;
	groupPadding: number;
	stack: StackLayout;
};

/**
 * The side a segment rounds when it ends its stack: the far end of the positives or of the negatives.
 *
 * @param stack      - The stack layout.
 * @param segment    - The segment.
 * @param category   - A datum at the segment's category.
 * @param horizontal - Whether the bars run horizontally.
 * @return The side to round, or undefined for a segment inside its stack.
 */
function getStackEnd(
	stack: StackLayout,
	segment: StackSegment,
	category: DataPointDate,
	horizontal: boolean
): 'top' | 'bottom' | 'left' | 'right' | undefined {
	const extent = stack.extentAt( category );
	if ( segment.end > 0 && segment.end === extent[ 1 ] ) {
		return horizontal ? 'right' : 'top';
	}
	if ( segment.end < 0 && segment.end === extent[ 0 ] ) {
		return horizontal ? 'left' : 'bottom';
	}
	return undefined;
}

const StackedBarSeries = ( {
	barClassName,
	slotKeys,
	slotKey,
	groupPadding,
	stack,
	...props
}: Props ) => {
	const { xScale, yScale, horizontal } = useContext( DataContext );
	const bandScale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const valueScale = ( horizontal ? xScale : yScale ) as
		Parameters< typeof getValueScalePosition >[ 0 ] | undefined;
	const groupScale = useMemo(
		() => createGroupScale( slotKeys, bandScale?.bandwidth?.() ?? 0, groupPadding ),
		[ slotKeys, bandScale, groupPadding ]
	);
	const { dataKey, xAccessor, yAccessor } = props;
	// The tooltip snaps to what a series registers, so every series registers its stack's top.
	const stackTop = useCallback(
		( datum: DataPointDate ) => stack.extentAt( datum )[ 1 ],
		[ stack ]
	);
	const renderGlyph = useCallback(
		( { datum, color }: GlyphProps< DataPointDate > ) => {
			const segment = stack.segmentOf( dataKey, datum );
			if ( ! segment || ! bandScale?.bandwidth || ! valueScale ) return null;
			const rect = computeSlotRect( {
				horizontal: !! horizontal,
				bandPosition: Number( bandScale( ( horizontal ? yAccessor : xAccessor )( datum ) ) ),
				slotOffset: groupScale( slotKey ) ?? 0,
				slotThickness: groupScale.bandwidth(),
				valuePositions: [ segment.start, segment.end ].map( value =>
					getValueScalePosition( valueScale, value )
				),
				widthFactor: 1,
			} );
			return (
				<rect
					{ ...rect }
					data-testid="bar-chart-stacked-bar"
					data-stack-end={ getStackEnd( stack, segment, datum, !! horizontal ) }
					className={ clsx( 'visx-bar', barClassName?.( datum ) ) }
					fill={ color }
				/>
			);
		},
		[
			stack,
			dataKey,
			bandScale,
			valueScale,
			horizontal,
			groupScale,
			slotKey,
			xAccessor,
			yAccessor,
			barClassName,
		]
	);
	// BandTooltip owns pointer selection, as for slotted bars.
	return (
		<GlyphSeries
			{ ...props }
			xAccessor={ horizontal ? stackTop : xAccessor }
			yAccessor={ horizontal ? yAccessor : stackTop }
			enableEvents={ false }
			renderGlyph={ renderGlyph }
		/>
	);
};

export default StackedBarSeries;
