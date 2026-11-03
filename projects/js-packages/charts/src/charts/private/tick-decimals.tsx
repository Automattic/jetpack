import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { isReading } from './readings';
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
			if ( ! isReading( value ) ) {
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

// Float error in tick * 10^decimals grows with the value, e.g. 0.07 * 100 = 7.000000000000001.
const EPSILON = 1e-12;
const tolerance = ( scaled: number ): number => EPSILON * Math.max( 1, Math.abs( scaled ) );

const isValidDecimals = ( decimals: number | undefined ): decimals is number =>
	Number.isInteger( decimals ) && ( decimals as number ) >= 0;

const isOnDecimals = ( value: number, decimals: number ): boolean => {
	const scaled = value * 10 ** decimals;
	return Math.abs( scaled - Math.round( scaled ) ) < tolerance( scaled );
};

/**
 * The scale's ticks with those finer than `decimals` places dropped.
 *
 * d3 steps by 1, 2 or 5 times a power of ten, so every multiple of 10^-decimals inside the domain is one of its ticks.
 *
 * @param scale    - The value scale visx built.
 * @param count    - Ticks to ask the scale for; undefined uses the scale's own default, as visx does.
 * @param decimals - Decimal places a tick may carry; 0 keeps whole numbers.
 * @return The kept ticks, or undefined when visx's own ticks need no change.
 */
export const getTickDecimalValues = (
	scale: unknown,
	count?: number,
	decimals = 0
): number[] | undefined => {
	const ticks = ( scale as { ticks?: ( count?: number ) => unknown[] } )?.ticks?.( count );
	if ( ! ticks?.every( ( tick ): tick is number => typeof tick === 'number' ) ) {
		return undefined;
	}
	const kept = ticks.filter( tick => isOnDecimals( tick, decimals ) );
	return kept.length > 1 && kept.length < ticks.length ? kept : undefined;
};

/**
 * A value domain widened to the nearest `decimals` steps when fewer than two fit inside it, so the axis shows at least two ticks.
 *
 * @param domain   - The domain the chart would scale to.
 * @param decimals - The axis's `tickDecimals`.
 * @return The widened domain, or undefined when `domain` needs no change.
 */
export const getTickDecimalsDomain = (
	domain: [ number, number ] | null | undefined,
	decimals: number | undefined
): [ number, number ] | undefined => {
	if ( ! domain || ! isValidDecimals( decimals ) ) {
		return undefined;
	}
	const scale = 10 ** decimals;
	const low = domain[ 0 ] * scale;
	const high = domain[ 1 ] * scale;
	if ( Math.floor( high + tolerance( high ) ) - Math.ceil( low - tolerance( low ) ) >= 1 ) {
		return undefined;
	}
	const floor = Math.floor( low + tolerance( low ) );
	// Keeps one step when float noise rounds both ends to the same value.
	const ceil = Math.max( Math.ceil( high - tolerance( high ) ), floor + 1 );
	return [ floor / scale, ceil / scale ];
};

/**
 * The decimals a value axis's ticks are held to: 0 for whole-number data, else the caller's `tickDecimals`.
 *
 * @param hasWholeNumberValues - Whether every plotted value is a whole number.
 * @param tickDecimals         - The axis's `tickDecimals`.
 * @return Decimal places, or undefined to keep visx's ticks.
 */
export const getTickDecimals = (
	hasWholeNumberValues: boolean,
	tickDecimals: number | undefined
): number | undefined => {
	if ( hasWholeNumberValues ) {
		return 0;
	}
	return isValidDecimals( tickDecimals ) ? tickDecimals : undefined;
};

type TickDecimalsProps = {
	axis: 'x' | 'y';
	numTicks?: number;
	decimals: number | undefined;
	children: ( tickValues: number[] | undefined ) => ReactNode;
};

/**
 * Hands its children the chart's value-scale ticks, held to `decimals` places.
 *
 * @param props          - Component props.
 * @param props.axis     - Which scale carries the values.
 * @param props.numTicks - Ticks to ask the scale for.
 * @param props.decimals - Decimal places a tick may carry, or undefined to keep visx's ticks.
 * @param props.children - Renders the axis and grid with the tick values.
 * @return The rendered children.
 */
export const TickDecimals = ( { axis, numTicks, decimals, children }: TickDecimalsProps ) => {
	const { xScale, yScale } = useContext( DataContext );
	const tickValues =
		decimals === undefined
			? undefined
			: getTickDecimalValues( axis === 'x' ? xScale : yScale, numTicks, decimals );
	return <>{ children( tickValues ) }</>;
};
