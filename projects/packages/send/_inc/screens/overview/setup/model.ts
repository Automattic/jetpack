import type { DnsLookup, DnsLookupRecord, SendStatus } from '../../../data/types';

/** Which Overview shows: the setup checklist, or the page for a site that's sending. */
export type SetupMode = 'setup' | 'active';

export type TaskId = 'sender' | 'connect' | 'test';

export type TaskState =
	| 'todo'
	| 'waiting'
	| 'needs_fix'
	| 'no_answer'
	| 'done'
	| 'locked'
	| 'skipped'
	| 'failed'
	| 'sent'
	| 'auto';

export type TaskStates = Record< TaskId, TaskState >;

/** A test sent from this page, before the server's status catches up. */
export type LocalTest = 'sent' | 'failed' | null;

export const TASK_IDS: readonly TaskId[] = [ 'sender', 'connect', 'test' ];

const DONE_STATES: readonly TaskState[] = [ 'done', 'sent', 'auto', 'skipped' ];

const STAGING_SUFFIXES = [
	'wpcomstaging.com',
	'mystagingwebsite.com',
	'mybluehost.me',
	'hostingersite.com',
	'wpengine.com',
	'pressable.com',
];
const TEMPORARY_SUFFIXES = [ 'local', 'localhost', 'test', 'example', 'invalid' ];

/**
 * Whether a host can't carry email records: an IP, localhost, a reserved name or a staging address.
 *
 * @param host - The site's host or a typed domain.
 * @return True when it's temporary.
 */
export function isTemporaryDomain( host: string ): boolean {
	const value = host.trim().toLowerCase().replace( /\.+$/, '' );
	if ( ! value || value.includes( ':' ) || /^\d{1,3}(\.\d{1,3}){3}$/.test( value ) ) {
		return true;
	}
	const endsWith = ( suffix: string ) => value === suffix || value.endsWith( `.${ suffix }` );
	return TEMPORARY_SUFFIXES.some( endsWith ) || STAGING_SUFFIXES.some( endsWith );
}

/**
 * Setup is finished once it was closed (Finish or a skipped test) or a test was seen to go out.
 *
 * @param status - Dashboard status.
 * @return The mode.
 */
export function setupMode( status: SendStatus ): SetupMode {
	if ( ! status.account ) {
		return 'setup';
	}
	const { closed_at: closedAt, test_sent_at: sentAt, verified_seen_at: seenAt } = status.onboarding;
	return closedAt || ( sentAt && seenAt ) ? 'active' : 'setup';
}

/**
 * The domain the page is about, or '' when the site is on a temporary address.
 *
 * @param status - Dashboard status.
 * @return The domain, or ''.
 */
export function headingDomain( status: SendStatus ): string {
	const domain = status.account?.domain ?? status.suggested_domain;
	return status.account || ! isTemporaryDomain( domain ) ? domain : '';
}

/**
 * The lookup rows for the records the user adds (no live-domain row).
 *
 * @param lookup - Latest lookup.
 * @return Rows.
 */
export function recordRows( lookup: DnsLookup | null ): DnsLookupRecord[] {
	return ( lookup?.records ?? [] ).filter( row => row.purpose !== 'sender_domain' );
}

/**
 * How many of the required records are visible.
 *
 * @param lookup - Latest lookup.
 * @param total  - Required records.
 * @return Found and total.
 */
export function foundCount(
	lookup: DnsLookup | null,
	total: number
): { found: number; total: number } {
	const found = recordRows( lookup ).filter(
		row => row.state === 'found' || row.state === 'verified'
	).length;
	return { found, total };
}

/**
 * Task 2's state from the status and the latest lookup.
 *
 * @param status - Dashboard status.
 * @param lookup - Latest lookup, or null before the first one.
 * @return The state.
 */
function connectState( status: SendStatus, lookup: DnsLookup | null ): TaskState {
	if ( ! status.account ) {
		return 'locked';
	}
	if ( status.can_enable ) {
		return 'done';
	}
	const rows = lookup?.records ?? [];
	if ( rows.some( row => row.state === 'needs_fix' ) ) {
		return 'needs_fix';
	}
	const required = recordRows( lookup );
	if ( required.length && required.every( row => row.state === 'no_answer' ) ) {
		return 'no_answer';
	}
	return required.some( row => row.state === 'found' || row.state === 'verified' )
		? 'waiting'
		: 'todo';
}

/**
 * Task 3's state. A test sent on this visit wins over what the server last said.
 *
 * @param status - Dashboard status.
 * @param local  - The result of a test sent on this page.
 * @return The state.
 */
function testState( status: SendStatus, local: LocalTest ): TaskState {
	if ( ! status.account || ! status.can_enable || ! status.settings.enabled ) {
		return 'locked';
	}
	if ( local ) {
		return local;
	}
	const { auto_test_log_id: autoId, test_sent_at: sentAt, closed_at: closedAt } = status.onboarding;
	if ( autoId && sentAt ) {
		return 'auto';
	}
	if ( sentAt ) {
		return 'sent';
	}
	return closedAt ? 'skipped' : 'todo';
}

/**
 * Every task's state.
 *
 * @param status - Dashboard status.
 * @param lookup - Latest lookup.
 * @param local  - A test sent on this page.
 * @return States by task.
 */
export function taskStates(
	status: SendStatus,
	lookup: DnsLookup | null,
	local: LocalTest = null
): TaskStates {
	return {
		sender: status.account ? 'done' : 'todo',
		connect: connectState( status, lookup ),
		test: testState( status, local ),
	};
}

/**
 * Whether a state counts as completed.
 *
 * @param state - Task state.
 * @return True when done.
 */
export function isComplete( state: TaskState ): boolean {
	return DONE_STATES.includes( state );
}

/**
 * How many tasks are complete.
 *
 * @param states - States by task.
 * @return The count.
 */
export function completedCount( states: TaskStates ): number {
	return TASK_IDS.filter( id => isComplete( states[ id ] ) ).length;
}

/**
 * The first task that isn't complete or locked, or null when none is.
 *
 * @param states - States by task.
 * @return The task id, or null.
 */
export function nextIncompleteId( states: TaskStates ): TaskId | null {
	return TASK_IDS.find( id => ! isComplete( states[ id ] ) && states[ id ] !== 'locked' ) ?? null;
}
