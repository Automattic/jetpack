import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';

declare global {
	interface Window {
		/** The admin screen id WordPress prints on admin pages, e.g. `dashboard` or `edit-post`. */
		pagenow?: string;
	}
}

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
	// Safe Mode events: send them through `trackIdentityCrisisEvent()`. The README's Safe Mode events table says when.
	idcNoticeView: 'jetpack_idc_notice_view',
	idcNonAdminNoticeView: 'jetpack_idc_non_admin_notice_view',
	idcMigrate: 'jetpack_idc_migrate',
	idcStartFresh: 'jetpack_idc_start_fresh',
	idcConfirmSafeMode: 'jetpack_idc_confirm_safe_mode',
	idcActionSuccess: 'jetpack_idc_action_success',
	idcActionError: 'jetpack_idc_action_error',
	idcQuestionClick: 'jetpack_idc_question_click',
	idcGuideClick: 'jetpack_idc_guide_click',
	idcDisconnectSite: 'jetpack_idc_disconnect_site',
} as const;

/** A canonical connection event, or another `jetpack_` event that takes the same payload. */
export type ConnectionEvent =
	( typeof CONNECTION_EVENTS )[ keyof typeof CONNECTION_EVENTS ] | `jetpack_${ string }`;

export type TrackingProps = Record< string, string | number | boolean | null | undefined >;

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
 * Where on a page a connection surface sits, sent as `placement`. Closed so Tracks data keeps
 * one spelling per place: register a new placement here before passing it.
 */
export type ConnectionPlacement = 'header' | 'connection_card' | 'page_notice' | 'page_modal';

/**
 * The `placement` property for a payload, or nothing when the host gave none.
 *
 * @param placement - Where on the page the event happened, e.g. 'header'.
 * @return The property to spread into the payload.
 */
export function placementProps( placement?: ConnectionPlacement ): {
	placement?: ConnectionPlacement;
} {
	return placement ? { placement } : {};
}

/** Where the Safe Mode screen shows: its `context` prop. */
export type IdentityCrisisContext = 'notice' | 'my-jetpack' | 'connectors';

const IDENTITY_CRISIS_PLACEMENTS: Record< IdentityCrisisContext, ConnectionPlacement > = {
	notice: 'page_notice',
	'my-jetpack': 'page_modal',
	connectors: 'connection_card',
};

/**
 * A WordPress.com blog id, for the Safe Mode events.
 *
 * @param value - A number, or the digits from a URL.
 * @return The id, or undefined unless the value is a positive integer.
 */
export function toBlogId( value: unknown ): number | undefined {
	const id = typeof value === 'string' && /^\d+$/.test( value ) ? Number( value ) : value;
	return typeof id === 'number' && Number.isSafeInteger( id ) && id > 0 ? id : undefined;
}

/**
 * The old Safe Mode screen's `platform` (`IdentityCrisis\UI::get_platform()`), approximated from `site.host`.
 *
 * @return `woa`, `vip`, `newspack` or `self-hosted`; undefined when the page has no `site.host`.
 */
function getIdentityCrisisPlatform(): string | undefined {
	const host = getScriptData()?.site?.host;
	if ( ! host ) {
		return undefined;
	}
	return host === 'woa' || host === 'vip' || host === 'newspack' ? host : 'self-hosted';
}

/**
 * Record a Safe Mode event, with the properties every Safe Mode event carries.
 *
 * @param event   - A Safe Mode event from CONNECTION_EVENTS.
 * @param context - The screen's `context` prop. Sets `placement`; on the notice, the admin screen id is sent as `context`.
 * @param props   - Event-specific properties; the common ones override same-named keys. Undefined values are left out.
 */
export function trackIdentityCrisisEvent(
	event: ConnectionEvent,
	context: IdentityCrisisContext | undefined,
	props: TrackingProps = {}
): void {
	const page =
		context === 'notice' && typeof window.pagenow === 'string' && window.pagenow
			? window.pagenow
			: context;
	const payload: TrackingProps = {
		...props,
		...placementProps( context ? IDENTITY_CRISIS_PLACEMENTS[ context ] : undefined ),
		screen_version: 2,
		platform: getIdentityCrisisPlatform(),
		blog_id: toBlogId( getScriptData()?.site?.wpcom?.blog_id ),
	};
	trackConnectionEvent(
		event,
		page,
		Object.fromEntries( Object.entries( payload ).filter( ( [ , value ] ) => value !== undefined ) )
	);
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
