import { isOtherUsersConnectionError } from '@automattic/jetpack-connection';
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

		const yourAccountLabel = __( 'Your account', 'jetpack-my-jetpack' );
		// `Error_Handler` leaves another user's token error out of this viewer's set,
		// so this is only reachable for an error injected by a consumer filter.
		const anotherUsersAccountLabel = __( "Another user's account", 'jetpack-my-jetpack' );

		return isViewersOwnError ? yourAccountLabel : anotherUsersAccountLabel;
	}

	return __( 'Site connection', 'jetpack-my-jetpack' );
}

/**
 * How to phrase a detail line.
 */
export type ConnectionErrorDetailOptions = {
	/** Leave the scope out and return the code alone. */
	omitScope?: boolean;
};

/**
 * Build the supporting detail line shown under an error's message: the scope it
 * applies to, plus the raw error code when one is available so the error can be
 * quoted verbatim to support.
 *
 * @param {ConnectionErrorObject}        error   - The error to describe.
 * @param {ConnectionErrorViewer}        viewer  - Who is looking at the notice.
 * @param {ConnectionErrorDetailOptions} options - How to phrase the line.
 * @return {string} The detail line, empty when there is nothing left to say.
 */
export function getConnectionErrorDetail(
	error: ConnectionErrorObject,
	viewer: ConnectionErrorViewer = {},
	{ omitScope = false }: ConnectionErrorDetailOptions = {}
): string {
	const code = typeof error?.error_code === 'string' ? error.error_code : '';

	if ( omitScope ) {
		return code
			? sprintf(
					/* translators: %s is the raw error code. */
					__( 'Error code: %s', 'jetpack-my-jetpack' ),
					code
			  )
			: '';
	}

	const scope = getConnectionErrorScope( error, viewer );

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
 * viewer — the same code reported against both the blog token and a consumer's
 * injected copy of it reduces to one line. Rendering those verbatim looks like a
 * duplication bug, so collapse them.
 *
 * @param {ConnectionErrorObject[]} errors    - The errors to describe.
 * @param {ConnectionErrorViewer}   viewer    - Who is looking at the notice.
 * @param {boolean}                 omitScope - Leave the scope out, for when it is already in the title.
 * @return {ConnectionErrorDetailLine[]} The deduplicated detail lines.
 */
export function getConnectionErrorDetailLines(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {},
	omitScope: boolean = false
): ConnectionErrorDetailLine[] {
	// Keyed by the line each error would render as.
	const lines = new Set< string >();

	for ( const error of errors ) {
		const detail = getConnectionErrorDetail( error, viewer, { omitScope } );

		// Without a scope, a codeless error has nothing left to say.
		if ( ! detail ) {
			continue;
		}

		lines.add( detail );
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
