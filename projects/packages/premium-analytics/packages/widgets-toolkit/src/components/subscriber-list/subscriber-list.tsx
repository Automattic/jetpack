/**
 * External dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import styles from './subscriber-list.module.scss';

/**
 * A single row in the subscriber list: a person with an avatar, a name (which
 * may link to their profile), and an optional right-aligned secondary line
 * (e.g. a "subscribed since" relative time).
 */
export type SubscriberListItem = {
	/**
	 * Stable key for the row (e.g. a subscription id, or a caller-provided fallback).
	 */
	id: string | number;
	/**
	 * Display name.
	 */
	name: string;
	/**
	 * Avatar image URL. Falls back to a neutral placeholder when missing or it
	 * fails to load.
	 */
	avatarUrl?: string | null;
	/**
	 * Profile URL. When present the name renders as a link; otherwise as text.
	 */
	href?: string | null;
	/**
	 * Right-aligned secondary text, e.g. a relative "since" time.
	 */
	secondaryText?: string;
};

export type SubscriberListProps = {
	/**
	 * Rows to render. When empty (and not loading) the empty state is shown.
	 */
	items?: SubscriberListItem[];
	/**
	 * When `true` and there are no rows yet, render the loading overlay.
	 */
	loading?: boolean;
	/**
	 * Empty-state message shown when there are no rows.
	 */
	emptyStateText?: string;
	/**
	 * Count of additional rows beyond those shown; renders an "N more" footer
	 * when greater than zero.
	 */
	moreCount?: number;
	/**
	 * Optional extra class for the list container.
	 */
	className?: string;
};

// Neutral circular placeholder for a missing/broken avatar, mirroring the
// gravatar `?d=mm` fallback used upstream.
const DEFAULT_AVATAR_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="%23e5e7eb"/></svg>';

/**
 * A roster of people — avatar, name, and an optional relative-time secondary
 * line per row, with an optional "N more" footer. Used by list-style Stats
 * widgets (e.g. the Subscribers card) where rows are ordered by recency rather
 * than ranked by a metric, so a bar leaderboard would not fit.
 *
 * @param {SubscriberListProps} props - The component props.
 * @return The rendered list, or the loading/empty state.
 */
export function SubscriberList( {
	items = [],
	loading = false,
	emptyStateText,
	moreCount = 0,
	className,
}: SubscriberListProps ) {
	if ( loading && items.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	if ( items.length === 0 ) {
		return <ChartEmptyState text={ emptyStateText } />;
	}

	return (
		<Stack direction="column" className={ className }>
			{ items.map( item => (
				<Stack
					key={ item.id }
					direction="row"
					align="center"
					justify="space-between"
					gap="md"
					className={ styles.row }
				>
					<Stack direction="row" align="center" gap="sm" className={ styles.person }>
						<img
							src={ item.avatarUrl || DEFAULT_AVATAR_URL }
							onError={ ( e: React.SyntheticEvent< HTMLImageElement > ) => {
								e.currentTarget.src = DEFAULT_AVATAR_URL;
							} }
							alt=""
							aria-hidden="true"
							className={ styles.avatar }
						/>
						{ item.href ? (
							<Link
								className={ styles.name }
								href={ item.href }
								variant="unstyled"
								openInNewTab
								title={ item.name }
							>
								{ item.name }
							</Link>
						) : (
							<Text className={ styles.name }>{ item.name }</Text>
						) }
					</Stack>
					{ item.secondaryText && <Text className={ styles.since }>{ item.secondaryText }</Text> }
				</Stack>
			) ) }
			{ moreCount > 0 && (
				<Text className={ styles.more }>
					{ sprintf(
						// translators: %d is the number of additional subscribers not shown.
						_n( '%d more', '%d more', moreCount, 'jetpack-premium-analytics' ),
						moreCount
					) }
				</Text>
			) }
		</Stack>
	);
}
