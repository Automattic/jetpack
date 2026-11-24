/**
 * External dependencies
 */
import { Link, Stack, Text } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import { ExternalLink } from '../external-link';
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
	 * Open `href` in a new tab. Pass false for links that stay in wp-admin.
	 * @default true
	 */
	openInNewTab?: boolean;
	/**
	 * Right-aligned secondary text, e.g. a relative "since" time.
	 */
	secondaryText?: string;
};

export type SubscriberListProps = {
	items?: SubscriberListItem[];
	emptyStateText?: string;
	/**
	 * Show only the whole rows that fit the available height, rather than letting the
	 * host scroll the roster. Requires an ancestor with a definite height.
	 * @default true
	 */
	fitRows?: boolean;
	className?: string;
};

// Neutral circular placeholder for a missing/broken avatar, mirroring the
// gravatar `?d=mm` fallback used upstream.
const DEFAULT_AVATAR_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="%23e5e7eb"/></svg>';

/**
 * A roster of people — avatar, name, and an optional relative-time secondary line per
 * row. For Stats widgets whose rows are ordered by recency rather than ranked by a
 * metric, where a bar leaderboard would not fit.
 */
export function SubscriberList( {
	items = [],
	emptyStateText,
	fitRows = true,
	className,
}: SubscriberListProps ) {
	const { listRef, fittedCount } = useFittedRosterRows( fitRows, items.length );

	if ( items.length === 0 ) {
		return <ChartEmptyState text={ emptyStateText } />;
	}

	return (
		<Stack
			direction="column"
			className={ clsx( styles.root, fitRows && styles.fitted, className ) }
		>
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
							// Keep hidden rows mounted so they remain available for measurement.
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
								{ ! href && <Text className={ styles.name }>{ item.name }</Text> }
								{ href && ( item.openInNewTab ?? true ) && (
									<ExternalLink className={ styles.name } href={ href } title={ item.name }>
										{ item.name }
									</ExternalLink>
								) }
								{ href && item.openInNewTab === false && (
									<Link
										className={ styles.name }
										href={ href }
										variant="unstyled"
										title={ item.name }
									>
										{ item.name }
									</Link>
								) }
							</Stack>
							{ item.secondaryText && (
								<Text className={ styles.since }>{ item.secondaryText }</Text>
							) }
						</Stack>
					);
				} ) }
			</div>
		</Stack>
	);
}
