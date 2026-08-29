/**
 * External dependencies
 */
import { getSiteData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
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
	// Only wp-admin supplies the slug; other mounts get no link.
	const siteSlug = getSiteData()?.suffix;

	if ( ! siteSlug ) {
		return null;
	}

	// Simple and WoA both go to WordPress.com, matching the wp-admin Subscribers
	// menu and the Newsletter widget.
	const host = isWpcomPlatformSite() ? 'https://wordpress.com' : 'https://cloud.jetpack.com';

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
		// `link` is unreliable: the subscriber's own site on some payloads, a
		// user-ID Calypso link that 404s on others.
		href:
			subscribersBaseUrl && item.subscription_id
				? `${ subscribersBaseUrl }/${ item.subscription_id }`
				: null,
		secondaryText: formatRelativeSince( item.date_subscribed ),
	} ) );
}

type SubscribersRosterProps = {
	items?: SubscriberListItem[];
	/**
	 * Number of subscribers beyond those in `items`. Rows the roster hides to
	 * fit the tile are added to this in the "N more" footer.
	 */
	moreCount?: number;
};

/**
 * Presentational subscriber roster; title comes from the widget host, not here.
 * Renders `<SubscriberList>` directly — an intermediate wrapper breaks row fitting.
 */
export const SubscribersRoster = ( { items = [], moreCount = 0 }: SubscribersRosterProps ) => (
	<SubscriberList items={ items } moreCount={ moreCount } />
);

/** Fetches subscribers via `useStatsFollowers` and renders the roster through `<WidgetState>`. */
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
			// `placeholderData` keeps stale rows after a failed refetch; only surface
			// the error when nothing is on screen.
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
