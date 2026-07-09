/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './metric-delta.module.scss';
import type { ComponentProps } from 'react';

export type MetricDeltaProps = {
	/**
	 * The current/new value
	 */
	current: number;

	/**
	 * The previous/comparison value
	 */
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

	/**
	 * CSS class for styling
	 */
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
	// Handle invalid inputs
	if ( ! Number.isFinite( current ) || ! Number.isFinite( previous ) ) {
		return null;
	}

	// Handle zero previous value
	if ( previous === 0 ) {
		return current === 0 ? 0 : null;
	}

	// Calculate percentage change, rounded to integer
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
	// Calculate the change
	const absoluteChange = current - previous;
	const percentageChange = calculatePercentageChange( current, previous );

	// Handle edge cases
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

	// Determine display value
	let displayValue: string;
	if ( showAbsolute ) {
		displayValue = formatMetricValue( absoluteChange, absoluteFormat );
		if ( absoluteChange > 0 ) {
			displayValue = `+${ displayValue }`;
		}
	} else {
		displayValue = formatMetricValue( percentageChange / 100, 'percentage' );
	}

	// Determine color based on direction and inversion
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
