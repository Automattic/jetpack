import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { toSvgId } from '../../private/pie-keyboard-navigation/selected-segment-ring';
import styles from '../bar-chart.module.scss';
import { createGroupScale } from './band-scale';
import { computeComparisonRect, getValueScaleBaseline } from './comparison-bars-geometry';
import type { BandScale } from './band-scale';
import type { DataPointDate } from '../../../types';
import type { FC } from 'react';

/** The bar the keyboard has selected. */
export type SelectedBar = {
	datum: DataPointDate;
	/** The slot the bar sits in. */
	slotKey: string;
	/** The bar's thickness as a share of its slot. */
	thickness: number;
};

type AnyScale = ( ( input: unknown ) => number ) &
	Partial< Pick< BandScale, 'bandwidth' > > & { range: () => unknown[] };

/**
 * Marks the keyboard-selected bar with a two-tone ring outside its edge, so the ring reads against any bar color.
 *
 * @param props              - Component props.
 * @param props.chartId      - The chart's id, which keeps the clip path unique on a page with several charts.
 * @param props.selected     - The selected bar.
 * @param props.slotKeys     - The slots, in the order the bar group lays them out.
 * @param props.groupPadding - The bar group's padding.
 * @param props.horizontal   - Whether the bars run horizontally.
 * @param props.xAccessor    - Reads a datum's x value.
 * @param props.yAccessor    - Reads a datum's y value.
 * @return The ring, or nothing when the bar has no position.
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

	if ( ! bandScale || ! valueScale || ! bandwidth ) {
		return null;
	}

	const groupScale = createGroupScale( slotKeys, bandwidth, groupPadding );
	const slotOffset = groupScale( selected.slotKey );
	const bandPosition = Number(
		bandScale( ( horizontal ? yAccessor : xAccessor )( selected.datum ) as never )
	);
	const valuePosition = Number(
		valueScale( Number( ( horizontal ? xAccessor : yAccessor )( selected.datum ) ) as never )
	);

	if (
		slotOffset == null ||
		! Number.isFinite( bandPosition ) ||
		! Number.isFinite( valuePosition )
	) {
		return null;
	}

	const rect = computeComparisonRect( {
		horizontal,
		bandPosition,
		slotOffset,
		slotThickness: groupScale.bandwidth(),
		valuePosition,
		baseline: getValueScaleBaseline( valueScale ),
		widthFactor: selected.thickness,
	} );
	const clipId = `bar-selected-ring-clip-${ toSvgId( chartId ) }`;
	const clipPath = `url(#${ clipId })`;

	return (
		<g pointerEvents="none" aria-hidden="true">
			<clipPath id={ clipId }>
				<path
					clipRule="evenodd"
					d={ `M-1e6 -1e6H1e6V1e6H-1e6Z M${ rect.x } ${ rect.y }h${ rect.width }v${ rect.height }h${ -rect.width }Z` }
				/>
			</clipPath>
			<rect { ...rect } clipPath={ clipPath } className={ styles[ 'selected-ring__focus' ] } />
			<rect
				{ ...rect }
				clipPath={ clipPath }
				className={ styles[ 'selected-ring__contrast' ] }
				data-testid="bar-chart-selected-ring"
			/>
		</g>
	);
};
