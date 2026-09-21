import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { SeriesData } from '../../types';
import type { ReactNode } from 'react';

/**
 * Whether every reading in the series is a whole number.
 *
 * @param series - The series visx renders.
 * @return True when at least one reading exists and none has a fraction.
 */
export const hasOnlyWholeNumbers = ( series: SeriesData[] ): boolean => {
	let sawReading = false;
	for ( const { data } of series ) {
		for ( const point of data ) {
			const value = point?.value;
			if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
				continue;
			}
			if ( ! Number.isInteger( value ) ) {
				return false;
			}
			sawReading = true;
		}
	}
	return sawReading;
};

/**
 * The scale's ticks with the fractional ones dropped.
 *
 * d3 steps by 1, 2 or 5 times a power of ten, so every whole number inside the domain is one of its ticks.
 *
 * @param scale - The value scale visx built.
 * @param count - Ticks to ask the scale for.
 * @return Whole-number ticks, or undefined when visx's own ticks need no change.
 */
export const getWholeNumberTickValues = ( scale: unknown, count = 4 ): number[] | undefined => {
	const ticks = ( scale as { ticks?: ( count: number ) => unknown[] } )?.ticks?.( count );
	if ( ! ticks?.every( ( tick ): tick is number => typeof tick === 'number' ) ) {
		return undefined;
	}
	const whole = ticks.filter( tick => Number.isInteger( tick ) );
	return whole.length > 1 && whole.length < ticks.length ? whole : undefined;
};

type WholeNumberTicksProps = {
	axis: 'x' | 'y';
	numTicks?: number;
	enabled: boolean;
	children: ( tickValues: number[] | undefined ) => ReactNode;
};

/**
 * Hands its children the whole-number ticks of the chart's value scale.
 *
 * @param props          - Component props.
 * @param props.axis     - Which scale carries the values.
 * @param props.numTicks - Ticks to ask the scale for.
 * @param props.enabled  - Whether the plotted values are all whole numbers.
 * @param props.children - Renders the axis and grid with the tick values.
 * @return The rendered children.
 */
export const WholeNumberTicks = ( {
	axis,
	numTicks,
	enabled,
	children,
}: WholeNumberTicksProps ) => {
	const { xScale, yScale } = useContext( DataContext );
	const tickValues = enabled
		? getWholeNumberTickValues( axis === 'x' ? xScale : yScale, numTicks )
		: undefined;
	return <>{ children( tickValues ) }</>;
};
