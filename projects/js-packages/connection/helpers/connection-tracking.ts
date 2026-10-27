import jetpackAnalytics from '@automattic/jetpack-analytics';

/** The parts of `@automattic/jetpack-analytics` used here; the package ships no types. */
interface AnalyticsApi {
	tracks: { recordEvent( event: string, props: Record< string, unknown > ): void };
	mc: { bumpStat( group: string, name: string ): void };
	setMcAnalyticsEnabled( enabled: boolean ): void;
}

const analytics: AnalyticsApi = jetpackAnalytics;

/**
 * Canonical Tracks events for the connection UI.
 *
 * One event per action; the surface is carried in the `context` property, not the event name.
 */
export const CONNECTION_EVENTS = {
	/** The Connectors card rendered. */
	cardView: 'jetpack_connection_card_view',
	/** A link or button on the Connectors card was clicked; `action` says which. */
	cardActionClick: 'jetpack_connection_card_action_click',
	/** The transfer link in the owner's disconnect warning was clicked. */
	ownerTransferClick: 'jetpack_connection_owner_transfer_click',
	ownerTransferAttempt: 'jetpack_connection_owner_transfer_attempt',
	ownerTransferSuccess: 'jetpack_connection_owner_transfer_success',
	ownerTransferError: 'jetpack_connection_owner_transfer_error',
	protectedOwnerConfirm: 'jetpack_connection_protected_owner_confirm',
	protectedOwnerRelease: 'jetpack_connection_protected_owner_release',
} as const;

/** A canonical connection event, or another `jetpack_` event that takes the same payload. */
export type ConnectionEvent =
	( typeof CONNECTION_EVENTS )[ keyof typeof CONNECTION_EVENTS ] | `jetpack_${ string }`;

type TrackingProps = Record< string, string | number | boolean | null | undefined >;

/**
 * Record one connection event with the surface it happened on.
 *
 * A missing `context` is sent as null, so a caller that forgot it shows up in the data
 * instead of going untracked.
 *
 * @param event   - One of CONNECTION_EVENTS, or another event name that takes the same payload.
 * @param context - The surface reporting the event, e.g. 'connectors'.
 * @param props   - Event-specific properties.
 */
export function trackConnectionEvent(
	event: ConnectionEvent,
	context: string | undefined | null,
	props: TrackingProps = {}
): void {
	try {
		// `context` last so a same-named key in `props` cannot override it.
		analytics.tracks.recordEvent( event, { ...props, context: context || null } );
	} catch {
		// Tracking must never break the UI, so a failed record is dropped.
	}
}

/**
 * Bump an MC stat, for surfaces that cannot bundle `@automattic/jetpack-analytics`.
 *
 * MC stats skip the Tracks script, so the caller must check that the site allows tracking.
 * Turns MC stats on for the whole page, as the Identity Crisis screen does.
 *
 * @param group - The stat group, e.g. 'jetpack-idc'.
 * @param name  - The stat to bump within the group.
 */
export function bumpConnectionStat( group: string, name: string ): void {
	try {
		analytics.setMcAnalyticsEnabled( true );
		analytics.mc.bumpStat( group, name );
	} catch {
		// Tracking must never break the UI, so a failed bump is dropped.
	}
}
