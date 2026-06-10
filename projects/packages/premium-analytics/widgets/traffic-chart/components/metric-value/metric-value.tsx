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

/*
 * WPDS font-size token, mapped to `--wpds-typography-font-size-{token}`.
 * Inlined from `@wordpress/theme`'s `FontSize` to avoid a package
 * dependency for a single type. The static map keeps the DS tokens
 * verifiable by the no-unknown-ds-tokens lint rule.
 */
type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const FONT_SIZE_TOKENS: Record< FontSize, string > = {
	xs: 'var(--wpds-typography-font-size-xs)',
	sm: 'var(--wpds-typography-font-size-sm)',
	md: 'var(--wpds-typography-font-size-md)',
	lg: 'var(--wpds-typography-font-size-lg)',
	xl: 'var(--wpds-typography-font-size-xl)',
	'2xl': 'var(--wpds-typography-font-size-2xl)',
};

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
		'--wp-ui-metric-font-size': FONT_SIZE_TOKENS[ fontSize ],
	} as CSSProperties;

	return (
		<span
			style={ style }
			className={ clsx( styles.metricValue, styles[ `color--${ color }` ], className ) }
		>
			{ displayValue }
		</span>
	);
}
