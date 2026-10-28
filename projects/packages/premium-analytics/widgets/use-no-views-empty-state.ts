/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { summaryCount, type WidgetStateEmpty } from '@jetpack-premium-analytics/widgets-toolkit';

type ListStatus = {
	isLoading: boolean;
	isError: boolean;
	isEmpty: boolean;
};

/**
 * The empty state of a list that follows the date range: `description` on a site with no all-time views, the generic period state otherwise.
 *
 * @param status           - The request state of the widget's own list.
 * @param status.isLoading - The list has no answer yet.
 * @param status.isError   - The list request failed.
 * @param status.isEmpty   - The list came back with no rows.
 * @param description      - The text for a site that has never recorded a view.
 * @return The `isLoading` and `empty` to pass to `WidgetState`.
 */
export function useNoViewsEmptyState(
	{ isLoading, isError, isEmpty }: ListStatus,
	description: string
): {
	isLoading: boolean;
	empty: WidgetStateEmpty | undefined;
} {
	const enabled = ! isLoading && ! isError && isEmpty;
	const site = useStatsSite( undefined, { enabled } );
	const hasNoViews = enabled && ! site.isError && summaryCount( site.data?.stats, 'views' ) === 0;

	return {
		isLoading: isLoading || ( enabled && site.isLoading ),
		empty: hasNoViews ? { description } : undefined,
	};
}
