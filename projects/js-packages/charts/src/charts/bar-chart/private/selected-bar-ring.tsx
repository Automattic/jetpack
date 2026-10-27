import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { SelectedRing } from '../../private/selected-ring/selected-ring';
import { createGroupScale } from './band-scale';
import { computeSlotRect, getValueScaleBaseline } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { DataPointDate } from '../../../types';
import type { FC } from 'react';

/** The slot the keyboard has selected. */
export type SelectedBar = {
	/** The data of the bars the slot draws at the selected category, which the ring encloses; only bars the chart draws (a finite value). */
	data: DataPointDate[];
	/** The selected slot. */
	slotKey: string;
	/** The thickness of the slot's widest bar, as a share of the slot. */
	thickness: number;
};

type AnyScale = ( ( input: unknown ) => number ) &
	Partial< Pick< BandScale, 'bandwidth' > > & { range: () => unknown[] };

/**
 * Marks the keyboard-selected slot with a two-tone ring outside its edge, so the ring reads against any bar color.
 *
 * @param props              - Component props.
 * @param props.chartId      - The chart's id, which keeps the clip path unique on a page with several charts.
 * @param props.selected     - The selected slot.
 * @param props.slotKeys     - The slots, in the order the band lays them out.
 * @param props.groupPadding - The padding between slots.
 * @param props.horizontal   - Whether the bars run horizontally.
 * @param props.xAccessor    - Reads a datum's x value.
 * @param props.yAccessor    - Reads a datum's y value.
 * @return The ring, or nothing when the slot has no position.
 */
export const SelectedBarRing: FC< {
	chartId: string;
	selected: SelectedBar;
	slotKeys: string[];
	groupPadding: number;
	horizontal: boolean;
	xAccessor: ( d: DataPointDate ) => string | number | Date | undefined;
	yAccessor: ( d: DataPointDate ) => number | undefined;
} > = ( { chartId, selected, slotKeys, groupPadding, horizontal, xAccessor, yAccessor } ) => {
	const context = useContext( DataContext );
	const bandScale = ( horizontal ? context?.yScale : context?.xScale ) as AnyScale | undefined;
	const valueScale = ( horizontal ? context?.xScale : context?.yScale ) as AnyScale | undefined;
	const bandwidth = bandScale?.bandwidth?.() ?? 0;
	const [ category ] = selected.data;

	if ( ! bandScale || ! valueScale || ! bandwidth || ! category ) {
		return null;
	}

	const groupScale = createGroupScale( slotKeys, bandwidth, groupPadding );
	const slotOffset = groupScale( selected.slotKey );
	const bandPosition = Number(
		bandScale( ( horizontal ? yAccessor : xAccessor )( category ) as never )
	);
	if ( slotOffset == null || ! Number.isFinite( bandPosition ) ) {
		return null;
	}

	const valuePositions = selected.data.map( datum =>
		Number( valueScale( Number( ( horizontal ? xAccessor : yAccessor )( datum ) ) as never ) )
	);

	const rect = computeSlotRect( {
		horizontal,
		bandPosition,
		slotOffset,
		slotThickness: groupScale.bandwidth(),
		valuePositions: [ getValueScaleBaseline( valueScale ), ...valuePositions ],
		widthFactor: selected.thickness,
	} );
	return (
		<SelectedRing
			chartId={ chartId }
			d={ `M${ rect.x } ${ rect.y }h${ rect.width }v${ rect.height }h${ -rect.width }Z` }
			side="outside"
			testId="bar-chart-selected-ring"
		/>
	);
};
