import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import { computeSlotRect, getValueScalePosition } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { ValueScale } from './comparison-bars-geometry';
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
 * The side a segment rounds when it ends its drawn stack: the far end of the positives or of the negatives, or both for a comparison total that spans zero.
 *
 * @param stack      - The stack layout.
 * @param key        - The series the segment is drawn for.
 * @param segment    - The segment.
 * @param category   - A datum at the segment's category.
 * @param horizontal - Whether the bars run horizontally.
 * @param clamp      - Holds a value inside the value domain, where the bars are cut off.
 * @return The side to round, or undefined for a segment inside its stack or drawn with no length.
 */
function getStackEnd(
	stack: StackLayout,
	key: string,
	segment: StackSegment,
	category: DataPointDate,
	horizontal: boolean,
	clamp: ( value: number ) => number
): 'top' | 'bottom' | 'left' | 'right' | 'both' | undefined {
	const [ start, end ] = [ segment.start, segment.end ].map( clamp );
	if ( start === end ) {
		return undefined;
	}
	const extent = stack.extentAt( category, key ).map( clamp );
	if ( segment.start < 0 && segment.end > 0 && start === extent[ 0 ] && end === extent[ 1 ] ) {
		return 'both';
	}
	if ( segment.end > 0 && end === extent[ 1 ] ) {
		return horizontal ? 'right' : 'top';
	}
	if ( segment.end < 0 && end === extent[ 0 ] ) {
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
	const valueScale = ( horizontal ? xScale : yScale ) as ValueScale | undefined;
	const groupScale = useMemo(
		() => createGroupScale( slotKeys, bandScale?.bandwidth?.() ?? 0, groupPadding ),
		[ slotKeys, bandScale, groupPadding ]
	);
	const { dataKey, xAccessor, yAccessor } = props;
	const [ domainStart, domainEnd ] = ( horizontal ? xScale : yScale )?.domain() ?? [
		-Infinity,
		Infinity,
	];
	const domainMin = Math.min( Number( domainStart ), Number( domainEnd ) );
	const domainMax = Math.max( Number( domainStart ), Number( domainEnd ) );
	const clamp = useCallback(
		( value: number ) => Math.min( domainMax, Math.max( domainMin, value ) ),
		[ domainMin, domainMax ]
	);
	// The positive end, or the negative end when nothing is positive; clamped so a caller domain keeps it on the drawn bar.
	const stackEnd = useCallback(
		( datum: DataPointDate ) => {
			const [ low, high ] = stack.extentAt( datum, dataKey );
			return clamp( high > 0 ? high : low );
		},
		[ stack, dataKey, clamp ]
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
					data-stack-end={ getStackEnd( stack, dataKey, segment, datum, !! horizontal, clamp ) }
					className={ clsx( 'visx-bar', barClassName?.( datum ) ) }
					fill={ color }
				/>
			);
		},
		[
			stack,
			clamp,
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
			xAccessor={ horizontal ? stackEnd : xAccessor }
			yAccessor={ horizontal ? yAccessor : stackEnd }
			enableEvents={ false }
			renderGlyph={ renderGlyph }
		/>
	);
};

export default StackedBarSeries;
