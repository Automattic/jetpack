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

type Announcement = { id: number; text: string };

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
	const [ announcement, setAnnouncement ] = useState< Announcement >();
	const label = getPresetLabel( appliedPresetId ) ?? formatDateRangeNatural( appliedRange );
	// Read when the id fires; a later relabel is not a new change to read out.
	const labelRef = useRef( label );
	labelRef.current = label;

	useEffect( () => {
		if ( attentionId === undefined ) {
			setAnnouncement( undefined );
			return;
		}
		setAnnouncement( {
			id: attentionId,
			text: sprintf(
				/* translators: %s: the applied period, e.g. "July 2026" */
				__( 'Date range updated to %s.', 'jetpack-premium-analytics-pkg' ),
				labelRef.current
			),
		} );
	}, [ attentionId ] );

	return (
		<VisuallyHidden render={ <div /> } role="status">
			{ /* Keyed so a repeat of the same sentence is a new node, which a live region reads. */ }
			{ announcement && <span key={ announcement.id }>{ announcement.text }</span> }
		</VisuallyHidden>
	);
}
