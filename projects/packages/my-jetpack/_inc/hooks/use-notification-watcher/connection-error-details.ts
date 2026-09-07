import {
	getConnectionErrorUserScope,
	isOtherUsersConnectionError,
} from '@automattic/jetpack-connection';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { ConnectionErrorMap, ConnectionErrorObject } from '@automattic/jetpack-connection';

/**
 * Identity of the person looking at the notice, used to phrase an error's scope
 * from their point of view ("Your account" vs "Another user's account").
 */
export type ConnectionErrorViewer = {
	/** The viewer's local WordPress user ID, if known. */
	currentUserId?: number;
	/** Whether the viewer is the connection owner. */
	isOwner?: boolean;
	/** The connection owner's display name, if the viewer is allowed to see it. */
	ownerName?: string;
};

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
 * The rule itself lives in the connection package, which owns both this
 * judgement and the CTA that has to agree with it.
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
 * A set of errors that share one headline message.
 */
export type ConnectionErrorGroup = {
	/** The shared headline, rendered once for the whole group. */
	message: string;
	/** The errors it covers, each still carrying its own scope and code. */
	errors: ConnectionErrorObject[];
};

/**
 * Group errors by their headline message.
 *
 * @param {ConnectionErrorObject[]} errors - The displayable errors.
 * @return {ConnectionErrorGroup[]} The errors grouped by shared message.
 */
export function groupConnectionErrorsByMessage(
	errors: ConnectionErrorObject[]
): ConnectionErrorGroup[] {
	const groups = new Map< string, ConnectionErrorGroup >();

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
			return __( 'Your account (connection owner)', 'jetpack-my-jetpack' );
		}

		return ownerName
			? sprintf(
					/* translators: %s is the display name of the Jetpack connection owner. */
					__( "Connection owner's account (%s)", 'jetpack-my-jetpack' ),
					ownerName
			  )
			: __( "Connection owner's account", 'jetpack-my-jetpack' );
	}

	if ( audience === 'user' ) {
		// The same helper the filtering rule uses, so the label cannot name an owner
		// the filter would have kept, or vice versa.
		switch ( getConnectionErrorUserScope( error, currentUserId ) ) {
			case 'self':
				return __( 'Your account', 'jetpack-my-jetpack' );
			case 'other':
				// Unreachable from the notice: `excludeOtherUsersErrors` drops these before
				// anything gets labelled, and it shares this same predicate. Kept so a
				// caller that labels an unfiltered error still gets an honest answer.
				return __( "Another user's account", 'jetpack-my-jetpack' );
			default:
				// Unattributed, or the viewer is unidentified. The error is kept because
				// it could be theirs, so the label must not claim it is somebody else's
				// either; name the token type and leave the owner open.
				return __( 'User connection', 'jetpack-my-jetpack' );
		}
	}

	return __( 'Site connection', 'jetpack-my-jetpack' );
}

/**
 * One rendered detail line, standing for one or more errors.
 */
export type ConnectionErrorDetailLine = {
	/** Stable key for rendering. */
	key: string;
	/** The line to display. */
	text: string;
};

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
			__( 'Jetpack Connection error: %s', 'jetpack-my-jetpack' ),
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
				'jetpack-my-jetpack'
			),
			errors.length
		);
	}

	return __( 'Jetpack Connection error', 'jetpack-my-jetpack' );
}
