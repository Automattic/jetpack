/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { AbbreviatedValue } from '../abbreviated-value';
import styles from './metric-value.module.scss';
import type { DataFormat } from '../../types';
import type { FontSize } from '@wordpress/theme';
import type { CSSProperties } from 'react';

export type MetricValueProps = {
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

	className?: string;

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
	fontSize = 'lg',
	color = 'neutral',
}: MetricValueProps ) {
	const style = {
		'--wp-ui-metric-font-size': `var( --wpds-typography-font-size-${ fontSize } )`,
	} as CSSProperties;

	return (
		<span
			style={ style }
			className={ clsx( styles.metricValue, styles[ `color--${ color }` ], className ) }
		>
			<AbbreviatedValue value={ value } dataFormat={ dataFormat } currencyCode={ currencyCode } />
		</span>
	);
}
