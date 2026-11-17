import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext, useMemo } from 'react';
import { createGroupScale } from './band-scale';
import { computeSlotRect, getValueScaleBaseline } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
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
	/** The slot the bars sit in. */
	slotKey: string;
	/** The bars' thickness as a share of the slot, centered in it. */
	thickness: number;
	groupPadding: number;
};

const SlottedBarSeries = ( {
	barClassName,
	slotKeys,
	slotKey,
	thickness,
	groupPadding,
	...props
}: Props ) => {
	const { xScale, yScale, horizontal } = useContext( DataContext );
	const bandScale = ( horizontal ? yScale : xScale ) as BandScale | undefined;
	const valueScale = horizontal ? xScale : yScale;
	const groupScale = useMemo(
		() => createGroupScale( slotKeys, bandScale?.bandwidth?.() ?? 0, groupPadding ),
		[ slotKeys, bandScale, groupPadding ]
	);
	const renderGlyph = useCallback(
		( { datum, x, y, color }: GlyphProps< DataPointDate > ) => {
			if ( ! bandScale?.bandwidth || ! valueScale ) return null;
			const baseline = getValueScaleBaseline(
				valueScale as Parameters< typeof getValueScaleBaseline >[ 0 ]
			);
			const rect = computeSlotRect( {
				horizontal: !! horizontal,
				bandPosition: Number(
					bandScale( ( horizontal ? props.yAccessor : props.xAccessor )( datum ) )
				),
				slotOffset: groupScale( slotKey ) ?? 0,
				slotThickness: groupScale.bandwidth(),
				valuePositions: [ baseline, horizontal ? x : y ],
				widthFactor: thickness,
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
			bandScale,
			valueScale,
			horizontal,
			groupScale,
			slotKey,
			thickness,
			props.xAccessor,
			props.yAccessor,
			barClassName,
		]
	);
	// BandTooltip owns pointer selection: these handlers subscribe after it and would rank bars by their tops, not their slots.
	return <GlyphSeries { ...props } enableEvents={ false } renderGlyph={ renderGlyph } />;
};

export default SlottedBarSeries;
