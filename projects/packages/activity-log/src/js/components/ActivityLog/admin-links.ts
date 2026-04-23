/**
 * Resolve wp-admin URLs for activity-log entities. The WPCOM activity-log
 * API exposes entity identity three different ways, and we handle all
 * three:
 *
 * 1. Typed range nodes (type: 'post'/'person'/'plugin'/…) with dedicated
 * id/slug fields — handled by `buildAdminLink`.
 * 2. Anchor ranges (type: 'a'/'link') with a `section` hint and `id`
 * (e.g. section: 'user', id: 42) — also handled by `buildAdminLink`.
 * 3. A top-level `object` on the entry (e.g. object: { type: 'Article',
 * object_id: 25 }) used when the description has no ranges at all —
 * handled by `buildObjectAdminLink`.
 *
 * The `adminUrl` prefix comes from the Initial_State payload
 * (`class-initial-state.php::get_data()`) so non-standard installs
 * (subdirectory, custom `admin_url` filter) are respected instead of
 * hard-coding `/wp-admin/`.
 */
import type { ActivityBlockNode } from './formatted-block/types';
import type { ActivityLogObject } from './types';

interface InitialStateWithAdminUrl {
	siteData?: { adminUrl?: string };
}

declare const JPACTIVITYLOG_INITIAL_STATE: InitialStateWithAdminUrl | undefined;

// Read once at module load; the value doesn't change within a session.
const adminUrlPrefix: string = ( () => {
	const raw =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined'
			? JPACTIVITYLOG_INITIAL_STATE?.siteData?.adminUrl
			: undefined;
	const base = raw && raw.length > 0 ? raw : '/wp-admin/';
	return base.endsWith( '/' ) ? base : `${ base }/`;
} )();

const q = ( value: string | number ) => encodeURIComponent( String( value ) );

const postEditUrl = ( id: string | number ) =>
	`${ adminUrlPrefix }post.php?post=${ q( id ) }&action=edit`;
const userEditUrl = ( id: string | number ) =>
	`${ adminUrlPrefix }user-edit.php?user_id=${ q( id ) }`;
const commentEditUrl = ( id: string | number ) =>
	`${ adminUrlPrefix }comment.php?action=editcomment&c=${ q( id ) }`;
const pluginSearchUrl = ( slug: string ) => `${ adminUrlPrefix }plugins.php?s=${ q( slug ) }`;
const themeDetailsUrl = ( slug: string ) => `${ adminUrlPrefix }themes.php?theme=${ q( slug ) }`;

/**
 * Build a wp-admin URL from a parsed block node (typed entity range or
 * section-tagged anchor), or null when no target can be derived.
 *
 * @param node - The parsed activity-log block node.
 * @return A fully-qualified wp-admin URL string, or null.
 */
export function buildAdminLink( node: ActivityBlockNode ): string | null {
	// Typed entity ranges — dedicated id/slug fields.
	switch ( node.type ) {
		case 'post':
			return node.postId ? postEditUrl( node.postId ) : null;
		case 'person':
			return node.userId ? userEditUrl( node.userId ) : null;
		case 'comment':
			return node.commentId ? commentEditUrl( node.commentId ) : null;
		case 'plugin':
			return node.pluginSlug ? pluginSearchUrl( String( node.pluginSlug ) ) : null;
		case 'theme':
			return node.themeSlug ? themeDetailsUrl( String( node.themeSlug ) ) : null;
	}

	// Anchor ranges carrying entity identity via `section` + `id`. Common
	// when the WPCOM payload wraps a name in an `<a>` pointing at a
	// wordpress.com path (e.g. /people/edit/{blog}/{name}) and tags the
	// range with section: 'user'.
	if ( ( node.type === 'link' || node.type === 'a' ) && node.id !== undefined ) {
		switch ( node.section ) {
			case 'user':
				return userEditUrl( node.id );
			case 'post':
				return postEditUrl( node.id );
			case 'comment':
				return commentEditUrl( node.id );
		}
	}

	return null;
}

/**
 * Build a wp-admin URL from the entry's top-level `object` field, used
 * when the activity description carries no ranges and the only way to
 * identify the subject is the entry-level object (e.g. a `post__published`
 * event whose content.text is literally the post title).
 *
 * @param object - The entry's `object` field, if present.
 * @return A fully-qualified wp-admin URL string, or null.
 */
export function buildObjectAdminLink( object?: ActivityLogObject ): string | null {
	if ( ! object ) {
		return null;
	}
	const { type, object_id: objectId, external_user_id: externalUserId } = object;
	switch ( type ) {
		case 'Article':
			return objectId ? postEditUrl( objectId ) : null;
		case 'Person':
			return externalUserId ? userEditUrl( externalUserId ) : null;
		default:
			return null;
	}
}
