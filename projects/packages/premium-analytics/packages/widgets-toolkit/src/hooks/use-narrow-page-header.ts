/**
 * External dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Whether the page header is too narrow to hold a full row of actions beside the
 * breadcrumb trail. `admin-ui` gives the trail's lockup `min-inline-size: 0` and
 * the actions `flex-shrink: 0`, so an action too many leaves the lockup a few
 * pixels wide and its page icon and crumbs painting under the actions
 * (STATS-630). Each control that stands down here must be on offer somewhere
 * else at this width, and off elsewhere, so exactly one of the two shows.
 *
 * @return Whether the viewport is below the small breakpoint.
 */
export function useNarrowPageHeader() {
	return useViewportMatch( 'small', '<' );
}
