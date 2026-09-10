/**
 * External dependencies
 */
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DataFormat } from '../../types';

export type AbbreviatedTextProps = {
	display: string;
	exact: string;
	className?: string;
};

/**
 * Shows the shortened text and restores the full one in a tooltip and for
 * assistive tech; a plain span when the two agree.
 */
export function AbbreviatedText( { display, exact, className }: AbbreviatedTextProps ) {
	if ( display === exact ) {
		return <span className={ className }>{ display }</span>;
	}

	return (
		<Tooltip text={ exact }>
			<span className={ className }>
				<span aria-hidden="true">{ display }</span>
				<VisuallyHidden render={ <span /> }>{ exact }</VisuallyHidden>
			</span>
		</Tooltip>
	);
}

export type AbbreviatedValueProps = {
	value: number;

	/**
	 * @default { type: 'number' }
	 */
	dataFormat?: DataFormat;

	/**
	 * ISO 4217 currency code (e.g. `'USD'`, `'EUR'`).
	 */
	currencyCode?: string;

	className?: string;
};

/**
 * Formats a metric value, restoring the full figure (`18,432`) behind a
 * compact one (`18K`).
 */
export function AbbreviatedValue( {
	value,
	dataFormat = { type: 'number' },
	currencyCode,
	className,
}: AbbreviatedValueProps ) {
	const { display, exact } = useMemo( () => {
		const options = { ...dataFormat.options, currencyCode };
		return {
			display: formatMetricValue( value, dataFormat.type, options ),
			exact: formatMetricValue( value, dataFormat.type, { ...options, useMultipliers: false } ),
		};
	}, [ value, dataFormat, currencyCode ] );

	return <AbbreviatedText display={ display } exact={ exact } className={ className } />;
}
