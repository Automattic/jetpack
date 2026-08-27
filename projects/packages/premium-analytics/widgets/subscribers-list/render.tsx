/**
 * External dependencies
 */
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	getStatsReportItems,
	useStatsFollowers,
	type StatsFollowersItem,
	type StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';
import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { customer } from '@jetpack-premium-analytics/icons';
import {
	SubscriberList,
	SubscriberListSkeleton,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
	type SubscriberListItem,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { SubscribersListAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** Base URL for the site's subscriber management pages. */
function getSubscribersBaseUrl() {
	// wp-admin always supplies the slug; the null path is for Storybook and other
	// non-admin mounts.
	const siteSlug = getSiteData()?.suffix;

	if ( ! siteSlug ) {
		return null;
	}

	// Atomic goes to Jetpack Cloud, matching the Stats Subscribers module. The
	// wp-admin Subscribers menu sends Atomic to WordPress.com instead.
	const host = isSimpleSite() ? 'https://wordpress.com' : 'https://cloud.jetpack.com';

	return `${ host }/subscribers/${ siteSlug }`;
}

/**
 * Flattens the designated `useStatsFollowers` report into the rows the roster
 * renders.
 */
function toSubscriberItems(
	report: StatsNormalizedReport< StatsFollowersItem > | undefined
): SubscriberListItem[] {
	const items = getStatsReportItems( report );
	const subscribersBaseUrl = getSubscribersBaseUrl();

	return items.map( ( item, index ) => ( {
		// Subscription id is the stable key; fall back to the row index so two
		// nameless subscribers can't collide on an empty-string key.
		id: item.subscription_id ?? `row-${ index }`,
		name: item.label,
		avatarUrl: item.icon,
		// `link` is the subscriber's own site, not their subscriber record. The id
		// mirrors Calypso's fallback chain, so it can be a user ID the page won't resolve.
		href:
			subscribersBaseUrl && item.subscription_id
				? `${ subscribersBaseUrl }/${ item.subscription_id }`
				: null,
		secondaryText: formatRelativeSince( item.date_subscribed ),
	} ) );
}

type SubscribersRosterProps = {
	/**
	 * Subscriber rows to render.
	 */
	items?: SubscriberListItem[];
	/**
	 * Number of subscribers beyond those in `items`. Rows the roster hides to
	 * fit the tile are added to this in the "N more" footer.
	 */
	moreCount?: number;
};

/**
 * Presentational subscriber roster. The card title ("Latest Subscribers") is
 * rendered by the dashboard host from the widget's `title`, so this body
 * renders the list only; loading, error, and empty are handled by
 * `<WidgetState>` in the data-connected `SubscribersReport`. Takes
 * already-fetched rows via props so Storybook can exercise the populated state
 * without an analytics backend.
 *
 * Renders `<SubscriberList>` directly: an intermediate wrapper has auto height,
 * which stops the roster's percentage height resolving against the tile and
 * disables row fitting.
 */
export const SubscribersRoster = ( { items = [], moreCount = 0 }: SubscribersRosterProps ) => (
	<SubscriberList items={ items } moreCount={ moreCount } />
);

/**
 * Fetches the latest subscribers through the designated `useStatsFollowers`
 * Stats hook and hands the normalized rows to the presentational roster, with
 * the loading / error / empty states rendered through `<WidgetState>`.
 */
function SubscribersReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsFollowers( {
		type: 'all',
		max: WIDGET_ROW_LIMIT,
	} );

	const report = data as StatsNormalizedReport< StatsFollowersItem > | undefined;
	const items = useMemo( () => toSubscriberItems( report ), [ report ] );

	// `summary.total` is the full subscriber count; anything past the shown rows
	// becomes the "N more" footer.
	const total = Number( report?.summary?.total ?? 0 );
	const moreCount = Math.max( total - items.length, 0 );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The query keeps the prior response via `placeholderData`, so a failed
			// refetch leaves rows on screen; only surface the error when there is
			// nothing to show.
			isError={ items.length === 0 && isError }
			isEmpty={ items.length === 0 }
			renderLoading={ <SubscriberListSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			error={ {
				description: __(
					"We couldn't load subscribers. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: customer,
				description: __( 'No subscribers yet.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			<SubscribersRoster items={ items } moreCount={ moreCount } />
		</WidgetState>
	);
}

type SubscribersListRenderAttributes = SubscribersListAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscribersListWidgetProps = WidgetRenderProps< SubscribersListRenderAttributes >;

/** The followers query does not use dashboard report parameters. */
export default function SubscribersList( { attributes = {} }: SubscribersListWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscribersReport />
		</WidgetRoot>
	);
}
