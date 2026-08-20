/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { LeaderboardRow, type LeaderboardRowVariant } from '../chart-leaderboard/leaderboard-row';
import { useWidgetRootContext } from '../widget-root';
import type { ReactElement } from 'react';

/** How tall the row sits. */
export type LeaderboardPostLabelVariant = LeaderboardRowVariant;

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
	/**
	 * Row height. Defaults to `compact`.
	 */
	variant?: LeaderboardPostLabelVariant;
	/**
	 * Extra class for the row, for per-widget spacing.
	 */
	className?: string;
};

/**
 * A leaderboard row label for a post, page, or email.
 *
 * `LeaderboardRow` renders the row and its `postLink` action; this component
 * exists only to resolve the report window. That window comes from
 * `WidgetRootContext`, the same way `ReportLink` resolves it, so the detail
 * page opens on the range the row was read against without every widget
 * threading it down.
 *
 * Rows that are not linked entities — an avatar and a name, or a drill-down
 * into child rows — use `buildLeaderboardRow` instead.
 *
 * @return The row label.
 */
export function LeaderboardPostLabel( {
	id,
	label,
	link,
	section,
	variant = 'compact',
	className,
}: LeaderboardPostLabelProps ): ReactElement {
	const { reportParams, navigationParams = reportParams } = useWidgetRootContext();
	const search = useMemo(
		() => ( {
			...pickReportDateParams( navigationParams ),
			...( section ? { section } : {} ),
		} ),
		[ navigationParams, section ]
	);

	return (
		<LeaderboardRow
			label={ label }
			media={ { kind: 'none' } }
			action={ { kind: 'postLink', id, href: link, search } }
			variant={ variant }
			className={ className }
		/>
	);
}
