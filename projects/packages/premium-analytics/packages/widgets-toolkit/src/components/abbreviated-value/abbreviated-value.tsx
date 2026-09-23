/**
 * External dependencies
 */
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './abbreviated-value.module.scss';
import type { DataFormat } from '../../types';

export type AbbreviatedTextProps = {
	/** The shortened text to show, e.g. `'18.4K'`. */
	display: string;
	/** The full text restored in a tooltip and for assistive tech, e.g. `'18,432'`. */
	exact: string;
	/**
	 * Restored in place of `exact`, e.g. `'18,432 opens'`. A unit the display
	 * omits keeps the tooltip even when nothing was shortened.
	 */
	restored?: string;
	className?: string;
};

/**
 * Shows the shortened text and restores the full one in a tooltip and for
 * assistive tech; a plain span when the two agree.
 */
export function AbbreviatedText( { display, exact, restored, className }: AbbreviatedTextProps ) {
	const full = restored ?? exact;

	if ( display === full ) {
		return <span className={ className }>{ display }</span>;
	}

	// Out of the tab order: assistive tech reads the exact figure below, and a
	// focusable span would nest inside leaderboard row buttons and metric tabs.
	return (
		<Tooltip text={ full } placement="bottom">
			<span className={ clsx( styles.anchor, className ) } tabIndex={ -1 }>
				<span aria-hidden="true">{ display }</span>
				<VisuallyHidden render={ <span /> }>{ full }</VisuallyHidden>
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
	 * ISO 4217 currency code (e.g. `'USD'`, `'EUR'`); overrides
	 * `dataFormat.options.currencyCode` when set.
	 */
	currencyCode?: string;

	/**
	 * Restored in place of the exact figure, e.g. `'18,432 opens'`. A unit the
	 * display omits keeps the tooltip even when nothing was shortened.
	 */
	restored?: string;

	className?: string;
};

/**
 * Formats a metric value, restoring the full figure (`18,432`) behind a
 * compact one (`18.4K`).
 */
export function AbbreviatedValue( {
	value,
	dataFormat = { type: 'number' },
	currencyCode,
	restored,
	className,
}: AbbreviatedValueProps ) {
	const { display, exact } = useMemo( () => {
		const options =
			currencyCode === undefined ? dataFormat.options : { ...dataFormat.options, currencyCode };
		return {
			display: formatMetricValue( value, dataFormat.type, options ),
			exact: formatMetricValue( value, dataFormat.type, { ...options, useMultipliers: false } ),
		};
	}, [ value, dataFormat, currencyCode ] );

	return (
		<AbbreviatedText
			display={ display }
			exact={ exact }
			restored={ restored }
			className={ className }
		/>
	);
}
