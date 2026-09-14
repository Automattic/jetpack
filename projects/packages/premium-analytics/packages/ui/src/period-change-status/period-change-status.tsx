/**
 * External dependencies
 */
import {
	getPresetLabel,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatDateRangeNatural } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from 'react';

export type PeriodChangeStatusProps = {
	/** The id of the period change to announce; each new one is read out. */
	attentionId?: number;

	/** The applied period, named the way the trigger names it. */
	appliedPresetId?: PrimaryPresetId;

	appliedRange: DateRange;
};

/**
 * A live region announcing a period a navigation set, for readers who cannot
 * see the trigger draw attention to itself. Mount it where it outlives the
 * navigation: a region announces only changes made after it exists.
 */
export function PeriodChangeStatus( {
	attentionId,
	appliedPresetId,
	appliedRange,
}: PeriodChangeStatusProps ) {
	const [ message, setMessage ] = useState( '' );
	const label = getPresetLabel( appliedPresetId ) ?? formatDateRangeNatural( appliedRange );
	// Read when the id fires; a later relabel is not a new change to read out.
	const labelRef = useRef( label );
	labelRef.current = label;

	useEffect( () => {
		if ( attentionId === undefined ) {
			return;
		}
		// Cleared first, in its own update: the same sentence twice is no change
		// to a live region, so a repeat of the period would go unread.
		setMessage( '' );
		const timer = setTimeout( () => {
			setMessage(
				sprintf(
					/* translators: %s: the applied period, e.g. "July 2026" */
					__( 'Date range updated to %s.', 'jetpack-premium-analytics-pkg' ),
					labelRef.current
				)
			);
		}, 0 );

		return () => clearTimeout( timer );
	}, [ attentionId ] );

	return (
		<VisuallyHidden render={ <div /> } role="status">
			{ message }
		</VisuallyHidden>
	);
}
