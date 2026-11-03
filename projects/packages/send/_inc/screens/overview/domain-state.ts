import { __, sprintf } from '@wordpress/i18n';
import { fixText } from './setup/records';
import type {
	DnsLookup,
	DnsLookupRecord,
	DnsPurpose,
	DnsRecord,
	DnsRecordProblem,
} from '../../data/types';
import type { Badge } from '@wordpress/ui';
import type { ComponentProps } from 'react';

/**
 * Where the domain stands after setup. `confirming`: both records look right but the mail service
 * hasn't agreed yet; `mismatch`: at least one record needs a fix rather than adding again.
 */
export type DomainHealth =
	'connected' | 'checking' | 'confirming' | 'mismatch' | 'missing' | 'not_connected' | 'not_live';

type BadgeIntent = NonNullable< ComponentProps< typeof Badge >[ 'intent' ] >;

/** What's wrong with one record: a fix from the lookup, or gone altogether. */
type RecordProblem = DnsRecordProblem | 'missing' | 'other';

/**
 * The lookup row for each required record.
 *
 * @param records - Required records, in display order.
 * @param lookup  - Latest lookup.
 * @return Rows, in the same order; a record the lookup didn't return is left out.
 */
function rowsFor( records: DnsRecord[], lookup: DnsLookup | null ): DnsLookupRecord[] {
	return records
		.map( record => lookup?.records.find( row => row.purpose === record.purpose ) )
		.filter( ( row ): row is DnsLookupRecord => !! row );
}

/**
 * The required records that need something done: a fix, or adding again.
 *
 * @param records - Required records.
 * @param lookup  - Latest lookup.
 * @return Their lookup rows.
 */
export function failingRows( records: DnsRecord[], lookup: DnsLookup | null ): DnsLookupRecord[] {
	return rowsFor( records, lookup ).filter(
		row => row.state === 'needs_fix' || row.state === 'not_found'
	);
}

/**
 * What's wrong with a failing row.
 *
 * @param row - A failing lookup row.
 * @return The problem.
 */
function problemOf( row: DnsLookupRecord ): RecordProblem {
	if ( row.state === 'not_found' ) {
		return 'missing';
	}
	return row.problem ?? 'other';
}

/**
 * The domain's live-site check, when it fails.
 *
 * @param lookup - Latest lookup.
 * @return The row, or undefined.
 */
function notLiveRow( lookup: DnsLookup | null ): DnsLookupRecord | undefined {
	return lookup?.records.find(
		row => row.purpose === 'sender_domain' && row.state === 'needs_fix'
	);
}

/**
 * Where the domain stands.
 *
 * @param canEnable - The records pass (the status's `can_enable`).
 * @param records   - Required records.
 * @param lookup    - Latest lookup, or null before the first one.
 * @return The state.
 */
export function domainHealth(
	canEnable: boolean,
	records: DnsRecord[],
	lookup: DnsLookup | null
): DomainHealth {
	if ( canEnable ) {
		return 'connected';
	}
	if ( ! lookup ) {
		return 'checking';
	}
	const failing = failingRows( records, lookup );
	if ( failing.length === 0 ) {
		if ( notLiveRow( lookup ) ) {
			return 'not_live';
		}
		const rows = rowsFor( records, lookup );
		const allFound =
			rows.length === records.length &&
			rows.every( row => row.state === 'found' || row.state === 'verified' );
		return allFound ? 'confirming' : 'checking';
	}
	if ( failing.every( row => row.state === 'not_found' ) ) {
		return failing.length === records.length ? 'not_connected' : 'missing';
	}
	return 'mismatch';
}

/**
 * The badge words when records are wrong: the shared problem's own words, or a general change
 * when the records need different things.
 *
 * @param failing - The records that need something done.
 * @return The label.
 */
function mismatchLabel( failing: DnsLookupRecord[] ): string {
	const several = failing.length > 1;
	const problems = failing.map( problemOf );
	const shared = problems.every( problem => problem === problems[ 0 ] ) ? problems[ 0 ] : null;
	switch ( shared ) {
		case 'wrong_value':
			return several
				? __( 'Records don’t match', 'jetpack-send-pkg' )
				: __( 'Record doesn’t match', 'jetpack-send-pkg' );
		case 'doubled':
			return several
				? __( 'Record names doubled', 'jetpack-send-pkg' )
				: __( 'Record name doubled', 'jetpack-send-pkg' );
		case 'conflict':
			return several
				? __( 'Old records in the way', 'jetpack-send-pkg' )
				: __( 'Old record in the way', 'jetpack-send-pkg' );
		case 'proxied':
			return __( 'Proxy on', 'jetpack-send-pkg' );
		case 'not_live':
			return several
				? __( 'Records not live yet', 'jetpack-send-pkg' )
				: __( 'Record not live yet', 'jetpack-send-pkg' );
		default:
			return several
				? __( 'Records need a change', 'jetpack-send-pkg' )
				: __( 'Record needs a change', 'jetpack-send-pkg' );
	}
}

/**
 * The Domain card's badge: what's wrong, in two or three words.
 *
 * @param health  - Where the domain stands.
 * @param failing - The records that need something done (see `failingRows`).
 * @return Intent and label.
 */
export function domainBadge(
	health: DomainHealth,
	failing: DnsLookupRecord[]
): { intent: BadgeIntent; label: string } {
	const several = failing.length > 1;
	switch ( health ) {
		case 'connected':
			return { intent: 'stable', label: __( 'Connected', 'jetpack-send-pkg' ) };
		case 'mismatch':
			return { intent: 'medium', label: mismatchLabel( failing ) };
		// After setup, both gone is still the records' own problem, not "Not connected" beside "On".
		case 'missing':
		case 'not_connected':
			return {
				intent: 'medium',
				label: several
					? __( 'Records missing', 'jetpack-send-pkg' )
					: __( 'Record missing', 'jetpack-send-pkg' ),
			};
		case 'not_live':
			return { intent: 'high', label: __( 'Domain not live', 'jetpack-send-pkg' ) };
		default:
			return { intent: 'informational', label: __( 'Checking', 'jetpack-send-pkg' ) };
	}
}

/**
 * The fix for one record, said under its row when the two records need different things.
 *
 * @param row      - A failing lookup row.
 * @param domain   - The sending domain.
 * @param provider - Provider name, or ''.
 * @return The fix.
 */
function rowNote( row: DnsLookupRecord, domain: string, provider: string ): string {
	switch ( problemOf( row ) ) {
		case 'missing':
			return __( 'We can’t find this record. Copy it and add it again.', 'jetpack-send-pkg' );
		case 'wrong_value':
			return __(
				'Its value doesn’t match. Copy it again and replace the old one.',
				'jetpack-send-pkg'
			);
		default:
			return fixText( row, domain, provider );
	}
}

/**
 * The one line for a problem that both records share.
 *
 * @param problem    - The shared problem.
 * @param where      - Where the DNS is managed, or "your DNS host".
 * @param domain     - The sending domain.
 * @param provider   - Provider name, or ''.
 * @param afterSetup - The records passed once, so a wrong value means they changed.
 * @return The line.
 */
function bothLine(
	problem: RecordProblem,
	where: string,
	domain: string,
	provider: string,
	afterSetup: boolean
): string {
	switch ( problem ) {
		case 'wrong_value':
			return afterSetup
				? sprintf(
						/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
						__(
							'Both records changed at %s. Copy them again and replace the old ones.',
							'jetpack-send-pkg'
						),
						where
					)
				: sprintf(
						/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
						__(
							'We found both records at %s, but their values are different. Copy them again and replace the old ones.',
							'jetpack-send-pkg'
						),
						where
					);
		case 'missing':
			return sprintf(
				/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
				__( 'Both records are missing at %s. Copy them and add them again.', 'jetpack-send-pkg' ),
				where
			);
		case 'doubled':
			return sprintf(
				/* translators: 1: provider name, e.g. Cloudflare, 2: domain name. */
				__(
					'%1$s added %2$s to the end of both names. Use just the short names shown.',
					'jetpack-send-pkg'
				),
				provider || __( 'Your DNS host', 'jetpack-send-pkg' ),
				domain
			);
		case 'conflict':
			return __(
				'Both names already have an old record. Delete the old ones, then add these.',
				'jetpack-send-pkg'
			);
		case 'proxied':
			return __( 'Turn off the proxy for both records (DNS only).', 'jetpack-send-pkg' );
		case 'not_live':
			return __(
				'Both records are saved but not live yet. Check they’re published.',
				'jetpack-send-pkg'
			);
		default:
			return __(
				'Something about both records is off. Copy them again and check them.',
				'jetpack-send-pkg'
			);
	}
}

/**
 * The one line for a single record's problem.
 *
 * @param row        - The failing lookup row.
 * @param where      - Where the DNS is managed, or "your DNS host".
 * @param domain     - The sending domain.
 * @param provider   - Provider name, or ''.
 * @param afterSetup - The records passed once, so a wrong value means it changed.
 * @return The line.
 */
function oneLine(
	row: DnsLookupRecord,
	where: string,
	domain: string,
	provider: string,
	afterSetup: boolean
): string {
	const problem = problemOf( row );
	if ( problem === 'wrong_value' && afterSetup ) {
		return sprintf(
			/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
			__( 'One record changed at %s. Copy it again and replace the old one.', 'jetpack-send-pkg' ),
			where
		);
	}
	if ( problem === 'missing' ) {
		return sprintf(
			/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
			__( 'One record is missing at %s. Copy it and add it again.', 'jetpack-send-pkg' ),
			where
		);
	}
	return fixText( row, domain, provider );
}

export type RecordsAdvice = {
	/** One line above the records saying what happened and what to do; '' when nothing's wrong. */
	summary: string;
	/** A line under a row, only when the rows need different things. */
	notes: Partial< Record< DnsPurpose, string > >;
};

/**
 * Say each records problem once: one line when the failing records share a problem (or only one
 * fails), else one line saying both need a change plus a note under each row with its own fix.
 *
 * @param failing    - The records that need something done.
 * @param domain     - The sending domain.
 * @param provider   - Provider name, or '' when we don't know where the DNS is managed.
 * @param afterSetup - The records passed once (the dashboard), rather than being added for the first time.
 * @return The summary and notes.
 */
export function fixAdvice(
	failing: DnsLookupRecord[],
	domain: string,
	provider: string,
	afterSetup: boolean
): RecordsAdvice {
	const notes: RecordsAdvice[ 'notes' ] = {};
	if ( ! failing.length ) {
		return { summary: '', notes };
	}
	const where = provider || __( 'your DNS host', 'jetpack-send-pkg' );
	if ( failing.length === 1 ) {
		return { summary: oneLine( failing[ 0 ], where, domain, provider, afterSetup ), notes };
	}
	const problems = failing.map( problemOf );
	if ( problems.every( problem => problem === problems[ 0 ] ) ) {
		return { summary: bothLine( problems[ 0 ], where, domain, provider, afterSetup ), notes };
	}
	failing.forEach( row => {
		notes[ row.purpose as DnsPurpose ] = rowNote( row, domain, provider );
	} );
	return {
		summary: sprintf(
			/* translators: %s: where the domain's DNS is managed, e.g. Cloudflare. */
			__( 'Both records need a change at %s.', 'jetpack-send-pkg' ),
			where
		),
		notes,
	};
}

/**
 * What to say about the records on the dashboard, once (see `fixAdvice`), plus the domain-wide
 * problems: the domain isn't live, or its DNS doesn't answer.
 *
 * @param args           - Inputs.
 * @param args.canEnable - The records pass.
 * @param args.records   - Required records.
 * @param args.lookup    - Latest lookup.
 * @param args.domain    - The sending domain.
 * @param args.provider  - Provider name, or '' when we don't know where the DNS is managed.
 * @return The summary and notes.
 */
export function recordsAdvice( {
	canEnable,
	records,
	lookup,
	domain,
	provider,
}: {
	canEnable: boolean;
	records: DnsRecord[];
	lookup: DnsLookup | null;
	domain: string;
	provider: string;
} ): RecordsAdvice {
	if ( canEnable || ! lookup ) {
		return { summary: '', notes: {} };
	}
	const advice = fixAdvice( failingRows( records, lookup ), domain, provider, true );
	const lines = advice.summary ? [ advice.summary ] : [];
	if ( notLiveRow( lookup ) ) {
		lines.push(
			sprintf(
				/* translators: %s: domain name, e.g. example.com. */
				__( '%s isn’t pointing at a website or mailbox yet.', 'jetpack-send-pkg' ),
				domain
			)
		);
	}
	if ( rowsFor( records, lookup ).some( row => row.state === 'no_answer' ) ) {
		lines.push(
			sprintf(
				/* translators: %s: domain name, e.g. example.com. */
				__( 'We can’t reach %s’s DNS right now. We’ll keep trying.', 'jetpack-send-pkg' ),
				domain
			)
		);
	}
	return { summary: lines.join( ' ' ), notes: advice.notes };
}

/**
 * The waiting note under the records while something's wrong.
 *
 * @param health  - Where the domain stands.
 * @param enabled - Sending is on, so it goes back to normal by itself once fixed.
 * @return The live lead and the detail.
 */
export function waitingCopy(
	health: DomainHealth,
	enabled: boolean
): { lead: string; detail: string } {
	if ( health === 'confirming' ) {
		return {
			lead: __( 'Waiting for the mail service to confirm', 'jetpack-send-pkg' ),
			detail: __( 'Both records look right. This can take a few minutes.', 'jetpack-send-pkg' ),
		};
	}
	if ( health === 'not_live' ) {
		// The badge and the summary already say the domain isn't live.
		return {
			lead: __( 'Checking every few minutes', 'jetpack-send-pkg' ),
			detail: enabled
				? __( 'Once it’s live, sending goes back to normal by itself.', 'jetpack-send-pkg' )
				: __( 'Once it’s live, you can turn sending back on.', 'jetpack-send-pkg' ),
		};
	}
	if ( health === 'checking' ) {
		// Nothing is known to be wrong yet, so there's nothing to fix.
		return {
			lead: __( 'Checking your records', 'jetpack-send-pkg' ),
			detail: __( 'We’ll say here if anything needs changing.', 'jetpack-send-pkg' ),
		};
	}
	return {
		lead: __( 'Waiting for your changes', 'jetpack-send-pkg' ),
		detail: enabled
			? __( 'Once it’s fixed, sending goes back to normal by itself.', 'jetpack-send-pkg' )
			: __( 'Once it’s fixed, you can turn sending back on.', 'jetpack-send-pkg' ),
	};
}
