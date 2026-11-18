/**
 * External dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Whether the page header is too narrow to hold a full row of actions beside the
 * breadcrumb trail. One action too many collapses the trail's lockup, and its page
 * icon and crumbs then paint under the actions (STATS-630). A control that stands
 * down here must be on offer elsewhere at this width, and off above it.
 *
 * @return Whether the viewport is below the small breakpoint.
 */
export function useNarrowPageHeader() {
	return useViewportMatch( 'small', '<' );
}
