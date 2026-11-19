/**
 * External dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Whether the page header has no room for its title lockup beside a full row of
 * actions. The actions hold their width, and the page icon cannot shrink, so it
 * paints over them unless the lockup stands down (STATS-630).
 *
 * @return Whether the viewport is 480px wide or less.
 */
export function useCrowdedPageHeader() {
	return useViewportMatch( 'mobile', '<' );
}
