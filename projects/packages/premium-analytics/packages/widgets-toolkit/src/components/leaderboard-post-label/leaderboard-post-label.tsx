/**
 * External dependencies
 */
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import { LeaderboardRow } from '../chart-leaderboard/leaderboard-row';
import type { ReportOrigin } from '@jetpack-premium-analytics/routing';
import type { ReactElement } from 'react';
/**
 * Internal dependencies
 */

export type LeaderboardPostLabelProps = {
	/**
	 * Post or page ID. Rows carrying one link to the internal detail route.
	 */
	id?: number | string;

	/**
	 * The label to display in the leaderboard row.
	 */
	label: string;

	/**
	 * Public URL of the content. Used only when there is no post ID.
	 */
	link?: string | null;

	/**
	 * Report the detail breadcrumb should link back to.
	 */
	origin: ReportOrigin;

	/**
	 * Optional detail-page tab to open, e.g. `email-opens`. Distinct from
	 * `origin.section`, which becomes `ref_section`.
	 */
	section?: string;
};

/**
 * A leaderboard row label for a post, page, or email.
 */
export function LeaderboardPostLabel( {
	id,
	label,
	link,
	origin,
	section,
}: LeaderboardPostLabelProps ): ReactElement {
	const search = useWidgetNavigationSearch( { origin, section } );

	return (
		<LeaderboardRow
			label={ label }
			media={ { kind: 'none' } }
			action={ { kind: 'postLink', id, href: link, search } }
		/>
	);
}
