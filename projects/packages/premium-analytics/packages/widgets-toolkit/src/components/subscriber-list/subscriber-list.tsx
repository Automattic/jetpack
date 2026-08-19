/**
 * External dependencies
 */
import { Link, Stack, Text } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import styles from './subscriber-list.module.scss';
import { useFittedRosterRows } from './use-fitted-roster-rows';

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
	items?: SubscriberListItem[];
	/**
	 * Empty-state message shown when there are no rows.
	 */
	emptyStateText?: string;
	/**
	 * Count of rows the caller did not pass at all — those beyond what it
	 * fetched. Rows that are passed but do not fit the tile are added to this
	 * for the "N more" footer, which renders when the total is greater than zero.
	 */
	moreCount?: number;
	/**
	 * Show only the rows that fit the tile instead of overflowing it. On by
	 * default: a roster sits in a fixed-height tile, and a half-clipped row with
	 * the "N more" footer pushed out of sight reads as broken.
	 */
	fitRows?: boolean;
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
 * @param {SubscriberListProps} props - The component props.
 * @return The rendered list, or the empty state.
 */
export function SubscriberList( {
	items = [],
	emptyStateText,
	moreCount = 0,
	fitRows = true,
	className,
}: SubscriberListProps ) {
	const { listRef, fittedCount } = useFittedRosterRows( fitRows, items.length );

	if ( items.length === 0 ) {
		return <ChartEmptyState text={ emptyStateText } />;
	}

	// Rows that were fetched but do not fit are still "more" to the reader, so
	// they join the rows the caller never fetched in the footer's count.
	const hiddenCount = moreCount + ( items.length - fittedCount );

	return (
		<Stack direction="column" className={ clsx( styles.root, className ) }>
			<div ref={ listRef } className={ styles.list }>
				{ items.map( ( item, index ) => {
					// Callers pass `href` straight from report data, so the scheme is
					// guarded here at the sink rather than in each consuming widget.
					const href = safeHttpUrl( item.href );

					return (
						<Stack
							key={ item.id }
							direction="row"
							align="center"
							justify="space-between"
							gap="md"
							className={ styles.row }
							data-roster-row
							// Rows past the fit stay mounted so the container keeps its
							// natural height for the next measurement; unmounting them would
							// shrink it and let every row "fit" again on the following pass.
							aria-hidden={ index >= fittedCount ? true : undefined }
							style={ index >= fittedCount ? { visibility: 'hidden' } : undefined }
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
								{ href ? (
									<Link
										className={ styles.name }
										href={ href }
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
							{ item.secondaryText && (
								<Text className={ styles.since }>{ item.secondaryText }</Text>
							) }
						</Stack>
					);
				} ) }
			</div>
			{ hiddenCount > 0 && (
				<Text className={ styles.more }>
					{ sprintf(
						// translators: %d is the number of additional subscribers not shown.
						_n( '%d more', '%d more', hiddenCount, 'jetpack-premium-analytics-pkg' ),
						hiddenCount
					) }
				</Text>
			) }
		</Stack>
	);
}
