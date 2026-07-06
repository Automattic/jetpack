/**
 * External dependencies
 */
import {
	useStatsFollowers,
	type StatsFollowersItem,
	type StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';
import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import {
	SubscriberList,
	WidgetRoot,
	type ReportParamsFieldAttributes,
	type SubscriberListItem,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { SubscribersListAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * Flattens the designated `useStatsFollowers` report into the rows the roster
 * renders, mapping each subscriber's avatar, name, profile link, and
 * "subscribed since" relative time.
 *
 * @param report - The normalized followers report, or undefined while loading.
 * @return The subscriber rows.
 */
function toSubscriberItems(
	report: StatsNormalizedReport< StatsFollowersItem > | undefined
): SubscriberListItem[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items.map( ( item, index ) => ( {
		// Subscription id is the stable key; fall back to the row index so two
		// nameless subscribers can't collide on an empty-string key.
		id: item.subscription_id ?? `row-${ index }`,
		name: item.label,
		avatarUrl: item.icon,
		href: item.link,
		secondaryText: formatRelativeSince( item.date_subscribed ),
	} ) );
}

type SubscribersRosterProps = {
	/**
	 * Subscriber rows to render. When omitted the empty state is shown (unless
	 * `isLoading` is set).
	 */
	items?: SubscriberListItem[];
	/**
	 * When `true` and there are no rows yet, render the loading overlay.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, render an error message instead of the list.
	 */
	isError?: boolean;
	/**
	 * Count of subscribers beyond those shown; renders an "N more" footer.
	 */
	moreCount?: number;
};

/**
 * Presentational subscriber roster, handling the loading, error, empty, and
 * populated states. The card title ("Latest Subscribers") is rendered by the
 * dashboard host from the widget's `title`, so this body renders the list only.
 * Takes already-fetched rows via props so Storybook can exercise every state
 * without an analytics backend.
 *
 * @param {SubscribersRosterProps} props - The component props.
 * @return The rendered card body.
 */
export const SubscribersRoster = ( {
	items = [],
	isLoading = false,
	isError = false,
	moreCount = 0,
}: SubscribersRosterProps ) => {
	return (
		<div className={ styles.root }>
			{ isError ? (
				<Text>{ __( 'Unable to load subscribers.', 'jetpack-premium-analytics' ) }</Text>
			) : (
				<SubscriberList
					items={ items }
					loading={ isLoading }
					moreCount={ moreCount }
					emptyStateText={ __( 'No subscribers yet.', 'jetpack-premium-analytics' ) }
				/>
			) }
		</div>
	);
};

type SubscribersReportProps = {
	/**
	 * Widget attributes.
	 */
	attributes?: SubscribersListAttributes;
};

/**
 * Fetches the latest subscribers through the designated `useStatsFollowers`
 * Stats hook and hands the normalized rows to the presentational roster.
 *
 * @param {SubscribersReportProps} props - The component props.
 * @return The widget content.
 */
function SubscribersReport( { attributes }: SubscribersReportProps ) {
	// Show six rows by default (matching the card design). A missing or
	// non-positive setting falls back to that default — `?? 6` alone wouldn't,
	// since an explicit `0` from the number field is not nullish.
	const num = attributes?.num && attributes.num > 0 ? attributes.num : 6;

	const { data, isLoading, isError } = useStatsFollowers( { type: 'all', max: num } );

	const report = data as StatsNormalizedReport< StatsFollowersItem > | undefined;
	const items = useMemo( () => toSubscriberItems( report ), [ report ] );

	// `summary.total` is the full subscriber count; anything past the shown rows
	// becomes the "N more" footer.
	const total = Number( report?.summary?.total ?? 0 );
	const moreCount = Math.max( total - items.length, 0 );

	return (
		<SubscribersRoster
			items={ items }
			isLoading={ isLoading }
			isError={ isError }
			moreCount={ moreCount }
		/>
	);
}

type SubscribersListRenderAttributes = SubscribersListAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscribersListWidgetProps = WidgetRenderProps< SubscribersListRenderAttributes >;

/**
 * Widget render entry point.
 *
 * Mirrors the other Stats widgets: attributes flow to the inner component via
 * props (the dashboard's WC-shaped `reportParams` context does not fit the
 * followers query), and `WidgetRoot` provides the analytics query client and
 * receives host attributes for the widget contract.
 *
 * @param {SubscribersListWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SubscribersList( { attributes = {} }: SubscribersListWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscribersReport attributes={ attributes } />
		</WidgetRoot>
	);
}
