/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { PostTitleLink } from '../post-title-link';
import { useWidgetRootContext } from '../widget-root';
import styles from './leaderboard-post-label.module.scss';
import type { ReactElement } from 'react';

/**
 * How tall the row sits.
 *
 * `compact` matches the shared `LeaderboardRow` chrome, so post labels line up
 * with the rows around them. `overlay` keeps the taller block padding the
 * older overlay-bar leaderboards render at.
 */
export type LeaderboardPostLabelVariant = 'compact' | 'overlay';

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
 * Wraps `PostTitleLink` in the row chrome every leaderboard needs: a flex row
 * that keeps the title on one line with an ellipsis and leaves the trailing
 * external-link icon room. Widgets pass no classes for this — only the
 * `variant`, plus a `className` when they need extra spacing.
 *
 * The report window comes from `WidgetRootContext`, the same way `ReportLink`
 * resolves it, so the detail page opens on the range the row was read against
 * without every widget threading it down.
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
		<span className={ clsx( styles.row, styles[ variant ], className ) }>
			<PostTitleLink
				id={ id }
				label={ label }
				link={ link }
				search={ search }
				title={ label }
				classNames={ {
					internal: styles.title,
					external: styles.title,
					plain: styles.title,
					text: styles.text,
				} }
			/>
		</span>
	);
}
