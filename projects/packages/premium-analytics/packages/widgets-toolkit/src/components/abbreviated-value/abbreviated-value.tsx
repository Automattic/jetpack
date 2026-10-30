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
import { useIsClipped } from './use-is-clipped';
import type { DataFormat } from '../../types';
import type { Ref } from 'react';

export type AbbreviatedTextProps = {
	/** The shortened text to show, e.g. `'18.4K'`. */
	display: string;
	/** The full text restored in a tooltip and for assistive tech, e.g. `'18,432'`. */
	exact: string;
	/** Restored in place of `exact`, e.g. `'18,432 opens'`; assistive tech only when nothing was shortened. */
	restored?: string;
	className?: string;
	/** The element holding the text, for a caller that measures it. */
	ref?: Ref< HTMLSpanElement >;
};

/**
 * Shows the shortened text and restores the full one in a tooltip and for
 * assistive tech; no tooltip when nothing was shortened.
 */
export function AbbreviatedText( {
	display,
	exact,
	restored,
	className,
	ref,
}: AbbreviatedTextProps ) {
	const full = restored ?? exact;

	if ( display === full ) {
		return (
			<span ref={ ref } className={ className }>
				{ display }
			</span>
		);
	}

	// Sighted users get the unit from the column header, which assistive tech doesn't tie to the value.
	if ( display === exact ) {
		return (
			<span ref={ ref } className={ className }>
				<span aria-hidden="true">{ display }</span>
				<VisuallyHidden render={ <span /> }>{ full }</VisuallyHidden>
			</span>
		);
	}

	// Out of the tab order: assistive tech reads the exact figure below, and a
	// focusable span would nest inside leaderboard row buttons and metric tabs.
	return (
		<Tooltip text={ full } placement="bottom">
			<span ref={ ref } className={ clsx( styles.anchor, className ) } tabIndex={ -1 }>
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

	/** Builds the text restored in place of the exact figure, e.g. `'18,432 opens'`. */
	formatRestored?: ( exact: string ) => string;

	className?: string;
};

/**
 * Formats a metric value, restoring the full figure (`18,432`) behind a
 * compact one (`18.4K`). With `dataFormat.preferExact` the full figure shows
 * instead, and the compact one only once the full figure gets clipped.
 */
export function AbbreviatedValue( {
	value,
	dataFormat = { type: 'number' },
	currencyCode,
	formatRestored,
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
	const preferExact = dataFormat.preferExact === true && display !== exact;
	const [ ref, isClipped ] = useIsClipped( exact, preferExact );

	return (
		<AbbreviatedText
			ref={ ref }
			display={ preferExact && ! isClipped ? exact : display }
			exact={ exact }
			restored={ formatRestored?.( exact ) }
			className={ className }
		/>
	);
}
