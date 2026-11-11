import analytics from '@automattic/jetpack-analytics';
import type { LibraryItemPrivacy } from '../types/library';

const PRIVACY_VALUES = new Set< LibraryItemPrivacy >( [ 'public', 'private', 'site-default' ] );

/**
 * Record an acknowledged privacy change relative to the setting shown before saving.
 *
 * @param from   - Previously displayed setting, when known.
 * @param to     - Successfully saved setting.
 * @param isBulk - Whether the requested batch contained multiple unique videos.
 */
export function recordVideoPressPrivacyChange(
	from: LibraryItemPrivacy | undefined,
	to: LibraryItemPrivacy | undefined,
	isBulk: boolean
) {
	if (
		! from ||
		! to ||
		! PRIVACY_VALUES.has( from ) ||
		! PRIVACY_VALUES.has( to ) ||
		from === to
	) {
		return;
	}
	analytics.tracks.recordEvent( 'jetpack_videopress_privacy_changed', {
		from,
		to,
		is_bulk: isBulk,
	} );
}
