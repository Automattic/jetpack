/**
 * Resolve wp-admin URLs for entity tokens embedded in an activity-log
 * description. The `adminUrl` comes from the Initial_State payload
 * (`class-initial-state.php::get_data()`) so we honor non-standard
 * installs (subdirectory, custom `admin_url` filter) instead of
 * hard-coding `/wp-admin/`.
 */
import type { ActivityBlockNode } from './formatted-block/types';

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

/**
 * Build a wp-admin URL for a given activity-log entity token, or null
 * when no reasonable target exists (entity has no ID/slug, or no core
 * screen matches the entity type).
 *
 * @param node - The parsed activity-log block node.
 * @return A fully-qualified wp-admin URL string, or null.
 */
export function buildAdminLink( node: ActivityBlockNode ): string | null {
	switch ( node.type ) {
		case 'post':
			return node.postId
				? `${ adminUrlPrefix }post.php?post=${ q( node.postId ) }&action=edit`
				: null;
		case 'person':
			return node.userId ? `${ adminUrlPrefix }user-edit.php?user_id=${ q( node.userId ) }` : null;
		case 'comment':
			return node.commentId
				? `${ adminUrlPrefix }comment.php?action=editcomment&c=${ q( node.commentId ) }`
				: null;
		case 'plugin':
			return node.pluginSlug ? `${ adminUrlPrefix }plugins.php?s=${ q( node.pluginSlug ) }` : null;
		case 'theme':
			return node.themeSlug ? `${ adminUrlPrefix }themes.php?theme=${ q( node.themeSlug ) }` : null;
		// `site` (we're already on it) and `backup` (needs the Backup plugin's
		// own route) have no generic wp-admin destination — fall through to
		// plain-text rendering.
		default:
			return null;
	}
}
