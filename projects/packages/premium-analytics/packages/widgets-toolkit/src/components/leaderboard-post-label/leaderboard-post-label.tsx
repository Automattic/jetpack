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
	/**
	 * Visible row title.
	 */
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
 * @param props           - Component props.
 * @param props.id        - Post or page ID.
 * @param props.label     - Visible row title.
 * @param props.link      - Public URL, used only without a post ID.
 * @param props.section   - Optional detail-page tab to open.
 * @param props.variant   - Row height.
 * @param props.className - Extra class for the row.
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
	const { reportParams } = useWidgetRootContext();
	const search = useMemo(
		() => ( {
			...pickReportDateParams( reportParams ),
			...( section ? { section } : {} ),
		} ),
		[ reportParams, section ]
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
