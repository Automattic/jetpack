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
 * @param {number}                count  - How many errors this label stands for.
 * @return {string} A human-readable scope label.
 */
export function getConnectionErrorScope(
	error: ConnectionErrorObject,
	viewer: ConnectionErrorViewer = {},
	count: number = 1
): string {
	const audience = error?.audience ?? 'site';
	const { currentUserId, isOwner, ownerName } = viewer;

	if ( audience === 'owner' ) {
		if ( isOwner ) {
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
		const isViewersOwnError = Number( error?.user_id ) === currentUserId;

		if ( isViewersOwnError ) {
			return __( 'Your account', 'jetpack-my-jetpack' );
		}

		// Several other admins can hit the same error code, which would otherwise
		// render as identical lines. Count them instead — the viewer can't act on
		// any of them, so the individual identities add nothing.
		return count > 1
			? sprintf(
					/* translators: %d is the number of other users whose accounts have the same error. */
					_n( "%d other user's account", "%d other users' accounts", count, 'jetpack-my-jetpack' ),
					count
			  )
			: __( "Another user's account", 'jetpack-my-jetpack' );
	}

	return __( 'Site connection', 'jetpack-my-jetpack' );
}

/**
 * Build the supporting detail line shown under an error's message: the scope it
 * applies to, plus the raw error code when one is available so the error can be
 * quoted verbatim to support.
 *
 * @param {ConnectionErrorObject} error  - The error to describe.
 * @param {ConnectionErrorViewer} viewer - Who is looking at the notice.
 * @param {number}                count  - How many errors this line stands for.
 * @return {string} The detail line.
 */
export function getConnectionErrorDetail(
	error: ConnectionErrorObject,
	viewer: ConnectionErrorViewer = {},
	count: number = 1
): string {
	const scope = getConnectionErrorScope( error, viewer, count );
	const code = typeof error?.error_code === 'string' ? error.error_code : '';

	if ( ! code ) {
		return scope;
	}

	return sprintf(
		/* translators: %1$s is what the error applies to (e.g. "Site connection"), %2$s is the raw error code. */
		__( '%1$s · Error code: %2$s', 'jetpack-my-jetpack' ),
		scope,
		code
	);
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
 * Errors that differ in the payload can still describe the same thing to this
 * viewer — several admins hitting one error code all reduce to "another user's
 * account". Rendering those verbatim looks like a duplication bug, so collapse
 * them into a single counted line.
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
	const lines = new Map< string, { error: ConnectionErrorObject; count: number } >();

	for ( const error of errors ) {
		const detail = getConnectionErrorDetail( error, viewer );
		const existing = lines.get( detail );

		if ( existing ) {
			existing.count++;
		} else {
			lines.set( detail, { error, count: 1 } );
		}
	}

	return [ ...lines.entries() ].map( ( [ detail, { error, count } ] ) => ( {
		key: detail,
		text: getConnectionErrorDetail( error, viewer, count ),
	} ) );
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
	if ( errors.length > 1 ) {
		return sprintf(
			/* translators: %d is the number of connection errors found. */
			_n(
				'%d Jetpack connection error',
				'%d Jetpack connection errors',
				errors.length,
				'jetpack-my-jetpack'
			),
			errors.length
		);
	}

	if ( errors.length === 1 ) {
		return sprintf(
			/* translators: %s is what the error applies to, e.g. "Site connection" or "Your account". */
			__( 'Jetpack connection error: %s', 'jetpack-my-jetpack' ),
			getConnectionErrorScope( errors[ 0 ], viewer )
		);
	}

	return __( 'Jetpack connection error', 'jetpack-my-jetpack' );
}
