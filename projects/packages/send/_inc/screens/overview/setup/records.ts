import { __, sprintf } from '@wordpress/i18n';
import { requiredRecords } from '../../../components/onboarding/providers';
import { mergeLockdown } from './record-rows';
import type { DisplayRecord } from './record-rows';
import type { DnsHost, DnsLookup, DnsLookupRecord, SendStatus } from '../../../data/types';

/**
 * The records to show, with values merged into ones the domain already has.
 *
 * @param status  - Send status.
 * @param dnsHost - Detection result.
 * @return Required records in display order.
 */
export function displayRecords( status: SendStatus, dnsHost: DnsHost | null ): DisplayRecord[] {
	const account = status.account;
	if ( ! account ) {
		return [];
	}
	return requiredRecords( account.dns_records ).map( record => {
		if ( record.purpose === 'lockdown' && dnsHost?.existing?.lockdown ) {
			// A short name can't hold both a pointer and a text value, so a merge is always text.
			const ours =
				record.type.toUpperCase() === 'TXT'
					? record.value
					: `v=mc1 auth=${ account.lockdown_auth_id }`;
			const merged = mergeLockdown( dnsHost.existing.lockdown, ours );
			if ( merged ) {
				return { ...record, type: 'TXT', value: merged, mergedFrom: dnsHost.existing.lockdown };
			}
		}
		if ( record.purpose === 'spf' && status.spf_suggestion?.state === 'merge' ) {
			return {
				...record,
				value: status.spf_suggestion.value,
				mergedFrom: account.existing_spf ?? dnsHost?.existing?.spf ?? '',
			};
		}
		return record;
	} );
}

/**
 * The fix for a record that needs one, in plain words.
 *
 * @param row      - The lookup row.
 * @param domain   - The sending domain.
 * @param provider - Provider name, or ''.
 * @return The fix.
 */
export function fixText( row: DnsLookupRecord, domain: string, provider: string ): string {
	switch ( row.problem ) {
		case 'wrong_value':
			return provider
				? sprintf(
						/* translators: %s: provider name, e.g. Cloudflare. */
						__(
							'One record has a different value at %s. Copy it again and replace the old one.',
							'jetpack-send-pkg'
						),
						provider
					)
				: __(
						'One record has a different value. Copy it again and replace the old one.',
						'jetpack-send-pkg'
					);
		case 'doubled':
			return sprintf(
				/* translators: 1: provider name, e.g. Cloudflare, 2: domain name, 3: short record name. */
				__( '%1$s added %2$s to the end of the name. Use just %3$s.', 'jetpack-send-pkg' ),
				provider || __( 'Your provider', 'jetpack-send-pkg' ),
				domain,
				row.host
			);
		case 'conflict':
			return __(
				'There’s already a record with this name. Delete the old one, then add this one.',
				'jetpack-send-pkg'
			);
		case 'proxied':
			return __( 'Turn off the proxy for this record (DNS only).', 'jetpack-send-pkg' );
		case 'not_live':
			return __( 'It’s saved but not live yet. Check it’s published.', 'jetpack-send-pkg' );
		default:
			return __(
				'Something about this record is off. Copy it again and check it.',
				'jetpack-send-pkg'
			);
	}
}

/**
 * The lookup with record 1 still to do while the host's own permission record lacks Jetpack:
 * the step left is to edit Jetpack into it (as its row says), not to replace a wrong value.
 *
 * @param lookup           - Latest lookup.
 * @param existingLockdown - The host's record found before setup, or null.
 * @return The lookup to show.
 */
export function withPendingMerge(
	lookup: DnsLookup | null,
	existingLockdown: string | null | undefined
): DnsLookup | null {
	if ( ! lookup || ! existingLockdown ) {
		return lookup;
	}
	const pending = ( row: DnsLookupRecord ) =>
		row.purpose === 'lockdown' && row.state === 'needs_fix' && row.problem === 'wrong_value';
	if ( ! lookup.records.some( pending ) ) {
		return lookup;
	}
	return {
		...lookup,
		records: lookup.records.map( row =>
			pending( row ) ? { ...row, state: 'not_found', problem: undefined } : row
		),
	};
}
