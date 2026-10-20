import { speak } from '@wordpress/a11y';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { rowBadge, rowPurposeLabel } from '../../../screens/overview/setup/record-rows';
import type { DnsLookup, DnsPurpose } from '../../../data/types';

/**
 * What a record does, in plain words: the record rows' own words, so copied steps match the card.
 *
 * @param purpose - Record purpose.
 * @param domain  - The sending domain.
 * @return The label.
 */
export function recordPurposeLabel(
	purpose: DnsPurpose | 'sender_domain',
	domain: string
): string {
	if ( purpose !== 'sender_domain' ) {
		return rowPurposeLabel( purpose );
	}
	/* translators: %s: domain name, e.g. example.com. */
	return sprintf( __( '%s is live', 'jetpack-send-pkg' ), domain );
}

/**
 * Announce rows that change to Found or Done, or that turn out wrong (saying what's wrong).
 *
 * @param lookup - Latest lookup.
 */
export function useAnnounceRecordChanges( lookup: DnsLookup | null ) {
	const previous = useRef< Record< string, string > >( {} );
	useEffect( () => {
		if ( ! lookup ) {
			return;
		}
		const seen: Record< string, string > = {};
		const messages: string[] = [];
		// Numbered like the cards (`requiredRecords`): lockdown first, then the signing record.
		const order: DnsPurpose[] = [
			'lockdown',
			lookup.records.some( row => row.purpose === 'dkim' ) ? 'dkim' : 'spf',
		];
		lookup.records.forEach( row => {
			const number = order.indexOf( row.purpose as DnsPurpose ) + 1;
			if ( ! number ) {
				return;
			}
			seen[ row.purpose ] = row.state;
			const before = previous.current[ row.purpose ];
			if ( before === undefined || before === row.state ) {
				return;
			}
			if ( row.state === 'found' ) {
				/* translators: %d: record number, 1 or 2. */
				messages.push( sprintf( __( 'Record %d found.', 'jetpack-send-pkg' ), number ) );
			} else if ( row.state === 'verified' ) {
				/* translators: %d: record number, 1 or 2. */
				messages.push( sprintf( __( 'Record %d is done.', 'jetpack-send-pkg' ), number ) );
			} else if ( row.state === 'needs_fix' ) {
				messages.push(
					sprintf(
						/* translators: 1: record number, 1 or 2, 2: what's wrong, e.g. "Doesn't match". */
						__( 'Record %1$d: %2$s.', 'jetpack-send-pkg' ),
						number,
						rowBadge( 'needs_fix', row.problem )?.label ?? ''
					)
				);
			}
		} );
		previous.current = seen;
		if ( messages.length ) {
			speak( messages.join( ' ' ) );
		}
	}, [ lookup ] );
}
