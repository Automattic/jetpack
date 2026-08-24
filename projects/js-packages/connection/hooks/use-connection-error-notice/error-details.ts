import { __, _n, sprintf } from '@wordpress/i18n';
import { getConnectionErrorUserScope, isOtherUsersConnectionError } from './viewer-scope.ts';
import type {
	ConnectionErrorDetailLine,
	ConnectionErrorGroup,
	ConnectionErrorMap,
	ConnectionErrorNoticeLink,
	ConnectionErrorObject,
	ConnectionErrorViewer,
} from './types.ts';

/**
 * Whether a raw store value is usable as a connection error map.
 *
 * `connectionErrors` is declared as an array at the store boundary but is a
 * `code → user_id → error` object at runtime, and the selector can fall back to
 * `[]`. Narrowing through a predicate keeps that mismatch to one checked place
 * instead of an `as unknown as` at every call site.
 *
 * @param {unknown} value - The raw selector value.
 * @return {boolean} Whether the value can be read as a connection error map.
 */
export function isConnectionErrorMap( value: unknown ): value is ConnectionErrorMap {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

/**
 * Flatten the store's `code → user_id → error` map into a display list.
 *
 * The map is server-provided and reaches us through an untyped store, so the
 * nullish and non-object cases are real rather than defensive noise — hence the
 * widened parameter type.
 *
 * @param {ConnectionErrorMap} errors - The connection error map from the store.
 * @return {ConnectionErrorObject[]} The flattened, render-ready error list.
 */
export function flattenConnectionErrors(
	errors: ConnectionErrorMap | null | undefined
): ConnectionErrorObject[] {
	if ( ! errors || typeof errors !== 'object' ) {
		return [];
	}

	return Object.values( errors )
		.flatMap( byUser => ( byUser && typeof byUser === 'object' ? Object.values( byUser ) : [] ) )
		.filter( error => Boolean( error?.error_message ) );
}

/**
 * Drop the errors this viewer has no stake in.
 *
 * Another (non-owner) user's broken token does not affect the site's connection
 * and only that user can restore it, so naming it here would report a problem
 * alongside a button that cannot fix it. Site-wide and connection-owner errors
 * are kept: those do break the site's connection, and any admin can act on them.
 *
 * Shares `isOtherUsersConnectionError` with the CTA selection in the hook, so the
 * error a notice names and the error its button acts on cannot disagree.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @param {ConnectionErrorViewer}   viewer - Who is looking at the notice.
 * @return {ConnectionErrorObject[]} The errors worth showing this viewer.
 */
export function excludeOtherUsersErrors(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {}
): ConnectionErrorObject[] {
	return errors.filter( error => ! isOtherUsersConnectionError( error, viewer.currentUserId ) );
}

/**
 * Group errors by their headline message.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @return {Array< { message: string, errors: ConnectionErrorObject[] } >} The errors grouped by shared message.
 */
export function groupConnectionErrorsByMessage(
	errors: ConnectionErrorObject[]
): Array< { message: string; errors: ConnectionErrorObject[] } > {
	const groups = new Map< string, { message: string; errors: ConnectionErrorObject[] } >();

	for ( const error of errors ) {
		const message = error.error_message;
		const group = groups.get( message );

		if ( group ) {
			group.errors.push( error );
		} else {
			groups.set( message, { message, errors: [ error ] } );
		}
	}

	return [ ...groups.values() ];
}

/**
 * Describe which token an error belongs to, in the viewer's own terms.
 *
 * @param {ConnectionErrorObject} error  - The error to describe.
 * @param {ConnectionErrorViewer} viewer - Who is looking at the notice.
 * @return {string} A human-readable scope label.
 */
export function getConnectionErrorScope(
	error: ConnectionErrorObject,
	viewer: ConnectionErrorViewer = {}
): string {
	// Keep every label as its own `return __( 'literal' )`. Two returns that differ
	// only in the string can get minified into `__( cond ? 'a' : 'b' )`, which
	// breaks the production build's translation check. If that happens, put the
	// labels in consts first and choose between the consts.
	const audience = error?.audience ?? 'site';
	const { currentUserId, isOwner, ownerName } = viewer;

	if ( audience === 'owner' ) {
		// This refers to whose token the error describes.
		if ( isOwner ) {
			// This refers to who is looking at the screen.
			return __( 'Your account (connection owner)', 'jetpack-connection-js' );
		}

		return ownerName
			? sprintf(
					/* translators: %s is the display name of the Jetpack connection owner. */
					__( "Connection owner's account (%s)", 'jetpack-connection-js' ),
					ownerName
			  )
			: __( "Connection owner's account", 'jetpack-connection-js' );
	}

	if ( audience === 'user' ) {
		// The same helper the filtering rule uses, so the label cannot name an owner
		// the filter would have kept, or vice versa.
		switch ( getConnectionErrorUserScope( error, currentUserId ) ) {
			case 'self':
				return __( 'Your account', 'jetpack-connection-js' );
			case 'other':
				// Unreachable from the notice: `excludeOtherUsersErrors` drops these before
				// anything gets labelled, and it shares this same predicate. Kept so a
				// caller that labels an unfiltered error still gets an honest answer.
				return __( "Another user's account", 'jetpack-connection-js' );
			default:
				// Unattributed, or the viewer is unidentified. The error is kept because
				// it could be theirs, so the label must not claim it is somebody else's
				// either; name the token type and leave the owner open.
				return __( 'User connection', 'jetpack-connection-js' );
		}
	}

	return __( 'Site connection', 'jetpack-connection-js' );
}

/**
 * Build the detail lines for a set of errors, collapsing any that would read
 * identically.
 *
 * A line says which token the error belongs to, and nothing else.
 *
 * When the title already names the scope, there is nothing left for a line to
 * say; the caller renders no lines at all rather than asking for them here.
 *
 * @param {ConnectionErrorObject[]} errors - The errors to describe.
 * @param {ConnectionErrorViewer}   viewer - Who is looking at the notice.
 * @return {ConnectionErrorDetailLine[]} The deduplicated detail lines.
 */
export function getConnectionErrorDetailLines(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {}
): ConnectionErrorDetailLine[] {
	// Keyed by the line each error would render as.
	const lines = new Set< string >();

	for ( const error of errors ) {
		lines.add( getConnectionErrorScope( error, viewer ) );
	}

	return [ ...lines ].map( detail => ( { key: detail, text: detail } ) );
}

/**
 * Whether the notice title names the error's scope. When it does, the detail
 * line below it must not repeat it.
 *
 * `getConnectionErrorTitle` and its detail lines have to agree on this, so both
 * ask in this helper rather than each carrying its own copy of the rule.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @return {boolean} Whether the title states the scope.
 */
export function titleIncludesScope( errors: ConnectionErrorObject[] ): boolean {
	return errors.length === 1;
}

/**
 * Title for the notice: names the affected scope when there is a single error,
 * and the error count when there are several.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @param {ConnectionErrorViewer}   viewer - Who is looking at the notice.
 * @return {string} The notice title.
 */
export function getConnectionErrorTitle(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {}
): string {
	if ( titleIncludesScope( errors ) ) {
		return sprintf(
			/* translators: %s is what the error applies to, e.g. "Site connection" or "Your account". */
			__( 'Jetpack Connection error: %s', 'jetpack-connection-js' ),
			getConnectionErrorScope( errors[ 0 ], viewer )
		);
	}

	if ( errors.length > 1 ) {
		return sprintf(
			/* translators: %d is the number of connection errors found. */
			_n(
				'%d Jetpack Connection error',
				'%d Jetpack Connection errors',
				errors.length,
				'jetpack-connection-js'
			),
			errors.length
		);
	}

	return __( 'Jetpack Connection error', 'jetpack-connection-js' );
}

/**
 * Collect the notice links declared by a set of errors, deduplicated by URL.
 *
 * Errors that describe the same condition (a blocked request reported against
 * more than one code, say) carry the same link, and it must only be offered once.
 *
 * The data is server-provided and reaches us through an untyped store, so both
 * halves are checked before a link is offered rather than trusting the type.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @return {ConnectionErrorNoticeLink[]} The deduplicated links.
 */
export function getConnectionErrorNoticeLinks(
	errors: ConnectionErrorObject[]
): ConnectionErrorNoticeLink[] {
	const links = new Map< string, ConnectionErrorNoticeLink >();

	for ( const error of errors ) {
		const link = error.error_data?.notice_link;

		if ( link?.url && link.label && ! links.has( link.url ) ) {
			links.set( link.url, link );
		}
	}

	return [ ...links.values() ];
}

/**
 * Whether any of these errors asks for a support link.
 *
 * Set server-side (see `support_link` in `Error_Handler::get_error_display_configs()`)
 * for errors where reconnecting may not be the fix, so the viewer has somewhere
 * else to go.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @return {boolean} Whether to offer the support link.
 */
export function hasSupportLink( errors: ConnectionErrorObject[] ): boolean {
	return errors.some( error => Boolean( error?.error_data?.support_link ) );
}

/**
 * Build everything a notice needs to describe a set of errors: the title, the
 * message groups with their scope lines, and the links to offer beneath them.
 *
 * The single place this shape is derived, so the package's own notice and
 * consumers with their own notice systems (My Jetpack) present the same errors
 * the same way.
 *
 * @param {ConnectionErrorMap}    errors - The connection error map from the store.
 * @param {ConnectionErrorViewer} viewer - Who is looking at the notice.
 * @return {object} The derived detail: `errors`, `title`, `groups`, `showSupportLink`.
 */
export function getConnectionErrorDetails(
	errors: ConnectionErrorMap,
	viewer: ConnectionErrorViewer = {}
): {
	errors: ConnectionErrorObject[];
	title: string;
	groups: ConnectionErrorGroup[];
	showSupportLink: boolean;
} {
	const displayable = excludeOtherUsersErrors( flattenConnectionErrors( errors ), viewer );

	// A detail line only ever states the scope, so where the title already names
	// it there is nothing left to say and no line is rendered.
	const scopeIsInTitle = titleIncludesScope( displayable );

	// Links are attached per-group so a link an error asks for renders directly
	// beneath the message it belongs to, rather than pooled after every group.
	// But dedupe by URL across the whole notice first: two different-message
	// groups sharing a link (e.g. both point at Site Health) must still only
	// show it once, on the group that introduces it, not once per group.
	const seenLinkUrls = new Set< string >();

	return {
		errors: displayable,
		title: getConnectionErrorTitle( displayable, viewer ),
		groups: groupConnectionErrorsByMessage( displayable ).map( group => {
			const noticeLinks = getConnectionErrorNoticeLinks( group.errors ).filter(
				link => ! seenLinkUrls.has( link.url )
			);

			noticeLinks.forEach( link => seenLinkUrls.add( link.url ) );

			return {
				...group,
				detailLines: scopeIsInTitle ? [] : getConnectionErrorDetailLines( group.errors, viewer ),
				noticeLinks,
			};
		} ),
		showSupportLink: hasSupportLink( displayable ),
	};
}
