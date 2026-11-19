/**
 * External dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Whether the page header is too narrow to hold a full row of actions beside the
 * breadcrumb trail. A control that stands down here must be on offer elsewhere at
 * this width, and off above it.
 *
 * @return Whether the viewport is below the small breakpoint.
 */
export function useNarrowPageHeader() {
	return useViewportMatch( 'small', '<' );
}

/**
 * Whether the page header has no room at all beside a full row of actions, so the
 * title lockup has to stand down entirely. The actions hold their width, and the
 * page icon cannot shrink, so it would otherwise paint over them (STATS-630).
 *
 * @return Whether the viewport is below the mobile breakpoint.
 */
export function useCrowdedPageHeader() {
	return useViewportMatch( 'mobile', '<' );
}
