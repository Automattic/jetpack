import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import { computeSlotRect } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { StackLayout } from './stack-layout';
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
	segmentOf: StackLayout[ 'segmentOf' ];
};

const StackedBarSeries = ( {
	barClassName,
	slotKeys,
	slotKey,
	groupPadding,
	segmentOf,
	...props
}: Props ) => {
	const { xScale, yScale, horizontal } = useContext( DataContext );
	const bandScale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const valueScale = ( horizontal ? xScale : yScale ) as
		( ( value: number ) => number ) | undefined;
	const groupScale = useMemo(
		() => createGroupScale( slotKeys, bandScale?.bandwidth?.() ?? 0, groupPadding ),
		[ slotKeys, bandScale, groupPadding ]
	);
	const { dataKey, xAccessor, yAccessor } = props;
	// Registering the stacked top is what lets the tooltip snap to the stack, not the raw value.
	const stackTop = useCallback(
		( datum: DataPointDate ) => segmentOf( dataKey, datum )?.end ?? NaN,
		[ segmentOf, dataKey ]
	);
	const renderGlyph = useCallback(
		( { datum, color }: GlyphProps< DataPointDate > ) => {
			const segment = segmentOf( dataKey, datum );
			if ( ! segment || ! bandScale?.bandwidth || ! valueScale ) return null;
			const rect = computeSlotRect( {
				horizontal: !! horizontal,
				bandPosition: Number( bandScale( ( horizontal ? yAccessor : xAccessor )( datum ) ) ),
				slotOffset: groupScale( slotKey ) ?? 0,
				slotThickness: groupScale.bandwidth(),
				valuePositions: [ valueScale( segment.start ), valueScale( segment.end ) ],
				widthFactor: 1,
			} );
			return (
				<rect
					{ ...rect }
					className={ clsx( 'visx-bar', barClassName?.( datum ) ) }
					fill={ color }
				/>
			);
		},
		[
			segmentOf,
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
