/**
 * Internal dependencies
 */
import { usePostDetailSearch } from '../../hooks/use-post-detail-search';
import { LeaderboardRow, type LeaderboardRowVariant } from '../chart-leaderboard/leaderboard-row';
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
	const search = usePostDetailSearch( section );

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
