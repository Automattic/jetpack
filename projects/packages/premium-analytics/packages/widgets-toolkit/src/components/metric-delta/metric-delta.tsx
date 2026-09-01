/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './metric-delta.module.scss';
import type { ComponentProps } from 'react';

export type MetricDeltaProps = {
	current: number;

	previous: number;

	/**
	 * What to display when calculation is not possible
	 * @default '—'
	 */
	fallback?: string;

	/**
	 * Whether to hide when delta is zero
	 * @default false
	 */
	hideZero?: boolean;

	/**
	 * For metrics where decrease is improvement (e.g., bounce rate, returns)
	 * @default false
	 */
	invertColors?: boolean;

	className?: string;

	/**
	 * Text alignment
	 * @default 'center'
	 */
	justify?: ComponentProps< typeof Stack >[ 'justify' ];

	/**
	 * Show absolute change instead of percentage
	 * @default false
	 */
	showAbsolute?: boolean;

	/**
	 * Format for absolute values
	 * @default 'number'
	 */
	absoluteFormat?: 'number' | 'currency';
};

function calculatePercentageChange( current: number, previous: number ): number | null {
	if ( ! Number.isFinite( current ) || ! Number.isFinite( previous ) ) {
		return null;
	}

	// A zero previous value has no defined percentage change, unless the current
	// value is zero too.
	if ( previous === 0 ) {
		return current === 0 ? 0 : null;
	}

	return Math.round( ( ( current - previous ) / Math.abs( previous ) ) * 100 );
}

export function MetricDelta( {
	current,
	previous,
	fallback = '—',
	hideZero = false,
	invertColors = false,
	className,
	justify = 'center',
	showAbsolute = false,
	absoluteFormat = 'number',
}: MetricDeltaProps ) {
	const absoluteChange = current - previous;
	const percentageChange = calculatePercentageChange( current, previous );

	if ( percentageChange === null ) {
		return (
			<Stack justify={ justify } className={ clsx( styles.delta, styles.invalid, className ) }>
				{ fallback }
			</Stack>
		);
	}

	if ( hideZero && percentageChange === 0 ) {
		return null;
	}

	let displayValue: string;
	if ( showAbsolute ) {
		displayValue = formatMetricValue( absoluteChange, absoluteFormat );
		if ( absoluteChange > 0 ) {
			displayValue = `+${ displayValue }`;
		}
	} else {
		displayValue = formatMetricValue( percentageChange / 100, 'percentage' );
	}

	const isPositive =
		( percentageChange > 0 && ! invertColors ) || ( percentageChange < 0 && invertColors );
	const isNegative =
		( percentageChange < 0 && ! invertColors ) || ( percentageChange > 0 && invertColors );

	return (
		<Stack
			justify={ justify }
			className={ clsx(
				styles.delta,
				{
					[ styles.positive ]: isPositive,
					[ styles.negative ]: isNegative,
					[ styles.neutral ]: percentageChange === 0,
				},
				className
			) }
		>
			{ displayValue }
		</Stack>
	);
}
