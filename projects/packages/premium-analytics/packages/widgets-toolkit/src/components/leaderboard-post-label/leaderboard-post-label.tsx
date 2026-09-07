/**
 * Internal dependencies
 */
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import { LeaderboardRow } from '../chart-leaderboard/leaderboard-row';
import type { ReactElement } from 'react';

export type LeaderboardPostLabelProps = {
	/**
	 * Post or page ID. Rows carrying one link to the internal detail route.
	 */
	id?: number | string;
	label: string;
	/**
	 * Public URL of the content. Used only when there is no post ID.
	 */
	link?: string | null;
	/**
	 * Optional detail-page tab to open, e.g. `email-opens`.
	 */
	section?: string;
};

/**
 * A leaderboard row label for a post, page, or email.
 *
 * @return The row label.
 */
export function LeaderboardPostLabel( {
	id,
	label,
	link,
	section,
}: LeaderboardPostLabelProps ): ReactElement {
	const search = useWidgetNavigationSearch( section );

	return (
		<LeaderboardRow
			label={ label }
			media={ { kind: 'none' } }
			action={ { kind: 'postLink', id, href: link, search } }
		/>
	);
}
