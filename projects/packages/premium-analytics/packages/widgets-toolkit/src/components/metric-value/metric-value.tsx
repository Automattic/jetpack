/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import clsx from 'clsx';
import { type CSSProperties, useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './metric-value.module.scss';
import type { DataFormat } from '../../types';
import type { FontSize } from '@wordpress/theme';

export type MetricValueProps = {
	/**
	 * The numeric value to display
	 */
	value: number;

	/**
	 * Format configuration for value display
	 * @default { type: 'number' }
	 */
	dataFormat?: DataFormat;

	/**
	 * ISO 4217 currency code (e.g. `'USD'`, `'EUR'`).
	 */
	currencyCode?: string;

	/**
	 * CSS class for styling
	 */
	className?: string;

	/**
	 * `title` tooltip on the value, e.g. the exact count behind a shortened
	 * display value (`18K` → `18,432`).
	 */
	title?: string;

	/**
	 * Font size token from the WordPress Design System.
	 * Maps directly to `--wpds-typography-font-size-{value}`.
	 * @default 'lg'
	 */
	fontSize?: FontSize;

	/**
	 * Color variant
	 * @default 'neutral'
	 */
	color?: 'neutral' | 'positive' | 'negative';
};

export function MetricValue( {
	value,
	dataFormat = { type: 'number' },
	currencyCode,
	className,
	title,
	fontSize = 'lg',
	color = 'neutral',
}: MetricValueProps ) {
	/**
	 * Create display value using dataFormat configuration
	 */
	const displayValue = useMemo(
		() =>
			formatMetricValue( value, dataFormat.type, {
				...dataFormat.options,
				currencyCode,
			} ),
		[ value, dataFormat, currencyCode ]
	);

	const style = {
		'--wp-ui-metric-font-size': `var( --wpds-typography-font-size-${ fontSize } )`,
	} as CSSProperties;

	return (
		<span
			style={ style }
			title={ title }
			className={ clsx( styles.metricValue, styles[ `color--${ color }` ], className ) }
		>
			{ displayValue }
		</span>
	);
}
