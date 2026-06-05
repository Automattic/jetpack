/**
 * External dependencies
 */
import {
	formatNumber,
	formatNumberCompact,
	formatCurrency,
	getCurrencyObject,
} from '@automattic/number-formatters';

/**
 * Metric type that determines the formatting strategy.
 *
 * - `number`     → `formatNumber` / `formatNumberCompact` (decimals default: 0)
 * - `currency`   → `formatCurrency` with symbol positioning (decimals default: 2)
 * - `percentage` → `Intl` percent style, signDisplay defaults to `exceptZero` (decimals default: 2)
 * - `average`    → `formatNumber` (decimals default: 2), em dash for Infinity
 */
export type MetricType = 'number' | 'average' | 'currency' | 'percentage';

/**
 * Options for `formatMetricValue`.
 */
export type FormatMetricValueOptions = {
	/**
	 * Decimal precision.
	 * Defaults vary by type: 0 for number, 2 for average/currency/percentage.
	 */
	decimals?: number;

	/**
	 * Use compact notation with K/M suffixes.
	 * @default false
	 */
	useMultipliers?: boolean;

	/**
	 * Sign display mode.
	 * Percentage defaults to `'exceptZero'`; others default to `'auto'`.
	 */
	signDisplay?: Intl.NumberFormatOptions[ 'signDisplay' ];

	/**
	 * ISO 4217 currency code (e.g. `'USD'`, `'EUR'`).
	 * @default 'USD'
	 */
	currencyCode?: string;
};

/**
 * Format a numeric metric value based on its type, precision, and scale.
 * Returns `''` for null, undefined, or NaN input.
 *
 * @example
 * formatMetricValue( 9876.543 )                                             // '9,877'
 * formatMetricValue( 1500, 'number', { useMultipliers: true, decimals: 1 } ) // '1.5K'
 * formatMetricValue( 192088.05, 'currency' )                                 // '$192,088.05'
 * formatMetricValue( 0.25, 'percentage' )                                    // '+25%'
 * formatMetricValue( 0.125, 'average' )                                      // '0.13'
 */
export function formatMetricValue(
	value: string | number | null | undefined,
	type: MetricType = 'number',
	{
		decimals,
		useMultipliers = false,
		signDisplay,
		currencyCode = 'USD',
	}: FormatMetricValueOptions = {}
): string {
	if ( value === null || value === undefined ) {
		return '';
	}

	const numericValue = Number( value );
	if ( isNaN( numericValue ) ) {
		return '';
	}

	switch ( type ) {
		case 'currency': {
			if ( useMultipliers ) {
				const { symbol, symbolPosition } = getCurrencyObject( 0, currencyCode );

				// Detect if the locale places a space between symbol
				// and number (e.g. BRL "R$ 1.5K", EUR "1.5K €").
				// formatCurrency handles this internally; compact mode
				// must preserve it.
				// TODO(WOOA7S-1214): upstream formatCurrencyCompact()
				// in @automattic/number-formatters would remove this.
				const probe = formatCurrency( 0, currencyCode );
				const charIndex =
					symbolPosition === 'before'
						? probe.indexOf( symbol ) + symbol.length
						: probe.lastIndexOf( symbol ) - 1;
				const separator = /\s/.test( probe.charAt( charIndex ) ) ? ' ' : '';

				let sign = '';
				let absoluteValue = numericValue;
				if ( numericValue < 0 ) {
					sign = '-';
					absoluteValue = Math.abs( numericValue );
				} else if (
					signDisplay === 'always' ||
					( signDisplay === 'exceptZero' && numericValue > 0 )
				) {
					sign = '+';
				}

				const compactFormatted = formatNumberCompact( absoluteValue, {
					decimals: decimals ?? 2,
					numberFormatOptions: {
						maximumFractionDigits: decimals ?? 2,
					},
				} );

				return symbolPosition === 'before'
					? `${ sign }${ symbol }${ separator }${ compactFormatted }`
					: `${ sign }${ compactFormatted }${ separator }${ symbol }`;
			}

			const baseFormatted = formatCurrency( numericValue, currencyCode );

			if (
				numericValue > 0 &&
				signDisplay &&
				signDisplay !== 'auto' &&
				( signDisplay === 'always' || signDisplay === 'exceptZero' )
			) {
				return '+' + baseFormatted;
			}

			return baseFormatted;
		}

		case 'average': {
			if ( ! Number.isFinite( numericValue ) ) {
				return '—';
			}

			return formatNumber( numericValue, {
				decimals: decimals ?? 2,
			} );
		}

		case 'percentage': {
			return formatNumber( numericValue, {
				numberFormatOptions: {
					style: 'percent',
					maximumFractionDigits: decimals ?? 2,
					signDisplay: signDisplay ?? 'exceptZero',
				},
			} );
		}

		case 'number':
		default: {
			return useMultipliers
				? formatNumberCompact( numericValue, {
						decimals: decimals ?? 0,
						numberFormatOptions: {
							maximumFractionDigits: decimals ?? 0,
							signDisplay,
						},
				  } )
				: formatNumber( numericValue, {
						decimals: decimals ?? 0,
						numberFormatOptions: {
							signDisplay,
						},
				  } );
		}
	}
}
