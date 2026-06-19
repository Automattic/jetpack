/**
 * External dependencies
 */
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';

/*
 * Static sample data. The production widget (PR #49505) sources the avg_items
 * metric from the orders report through the analytics widgets-toolkit; that
 * toolkit is not part of this core-packages testing branch, so this stand-in
 * renders representative values to exercise the dashboard end to end.
 */
const SAMPLE_AVG_ITEMS = 3.4;
const SAMPLE_DELTA = 8.2;
const SAMPLE_SERIES = [ 2.8, 3, 2.9, 3.1, 3.3, 3.2, 3.4 ];

/**
 * Minimal inline sparkline so the widget shows a trend without pulling a chart
 * dependency.
 *
 * @param props        - Component props.
 * @param props.points - Series values to plot.
 */
function Sparkline( { points }: { points: number[] } ) {
	const max = Math.max( ...points );
	const min = Math.min( ...points );
	const range = max - min || 1;
	const coords = points
		.map( ( value, index ) => {
			const x = ( index / ( points.length - 1 ) ) * 100;
			const y = 100 - ( ( value - min ) / range ) * 100;
			return `${ x },${ y }`;
		} )
		.join( ' ' );

	return (
		<svg
			className={ styles.sparkline }
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<polyline points={ coords } fill="none" strokeWidth="4" />
		</svg>
	);
}

/**
 * Average items per order widget (stand-in render).
 */
export default function AverageItemsPerOrderRender() {
	const isPositive = SAMPLE_DELTA >= 0;

	return (
		<Stack className={ clsx( styles.root ) }>
			<Text variant="muted">{ __( 'Average items per order', 'jetpack-premium-analytics' ) }</Text>
			<div className={ styles.metricRow }>
				<Text variant="heading-2xl">{ SAMPLE_AVG_ITEMS.toFixed( 1 ) }</Text>
				<span className={ clsx( styles.delta, isPositive ? styles.deltaUp : styles.deltaDown ) }>
					{ isPositive ? '▲' : '▼' } { Math.abs( SAMPLE_DELTA ).toFixed( 1 ) }%
				</span>
			</div>
			<Sparkline points={ SAMPLE_SERIES } />
		</Stack>
	);
}
