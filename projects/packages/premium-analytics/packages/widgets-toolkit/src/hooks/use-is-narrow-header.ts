import { useViewportMatch } from '@wordpress/compose';

/**
 * Whether the page header is too narrow to hold more than its breadcrumbs and core actions.
 *
 * @return True below the small breakpoint.
 */
export function useIsNarrowHeader(): boolean {
	return useViewportMatch( 'small', '<' );
}
