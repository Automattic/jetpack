/**
 * External dependencies
 */
import {
	useStatsFollowers,
	type StatsFollowersItem,
	type StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';
import {
	SubscriberList,
	WidgetRoot,
	type SubscriberListItem,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './subscribers-list.module.css';
import type { SubscribersListAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * Formats a subscription timestamp as the compact relative "since" string the
 * card shows on the right of each row (e.g. "Just now", "12m ago", "1h ago",
 * "Yesterday", "3d ago"), falling back to a locale date for older dates.
 *
 * @param iso - ISO date the subscriber signed up, or undefined.
 * @return The relative-time label, or an empty string when there is no date.
 */
function formatSubscribedSince( iso?: string ): string {
	if ( ! iso ) {
		return '';
	}

	const then = new Date( iso ).getTime();
	if ( Number.isNaN( then ) ) {
		return '';
	}

	const minutes = Math.floor( ( Date.now() - then ) / 60000 );
	if ( minutes < 1 ) {
		return __( 'Just now', 'jetpack-premium-analytics' );
	}
	if ( minutes < 60 ) {
		// translators: %d is a number of minutes.
		return sprintf( __( '%dm ago', 'jetpack-premium-analytics' ), minutes );
	}

	const hours = Math.floor( minutes / 60 );
	if ( hours < 24 ) {
		// translators: %d is a number of hours.
		return sprintf( __( '%dh ago', 'jetpack-premium-analytics' ), hours );
	}

	const days = Math.floor( hours / 24 );
	if ( days === 1 ) {
		return __( 'Yesterday', 'jetpack-premium-analytics' );
	}
	if ( days < 7 ) {
		// translators: %d is a number of days.
		return sprintf( __( '%dd ago', 'jetpack-premium-analytics' ), days );
	}

	return new Date( iso ).toLocaleDateString();
}

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

	return items.map( item => ( {
		id: item.subscription_id ?? item.id ?? item.label,
		name: item.label,
		avatarUrl: item.icon,
		href: item.link,
		secondaryText: formatSubscribedSince( item.date_subscribed ?? item.value?.value ),
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

/**
 * Fetches the latest subscribers through the designated `useStatsFollowers`
 * Stats hook and hands the normalized rows to the presentational roster.
 *
 * @param props            - Component props.
 * @param props.attributes - Widget attributes.
 * @return The widget content.
 */
function SubscribersReport( { attributes }: { attributes?: SubscribersListAttributes } ) {
	// Default to six rows, matching the card design.
	const num = attributes?.num ?? 6;

	// `num = 0` means "show all"; pass through undefined so the query uses its
	// default cap rather than requesting zero rows.
	const { data, isLoading, isError } = useStatsFollowers( {
		type: 'all',
		max: num > 0 ? num : undefined,
	} );

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

/**
 * Widget render entry point.
 *
 * Mirrors the other Stats widgets: attributes flow to the inner component via
 * props (the dashboard's WC-shaped `reportParams` context does not fit the
 * followers query), and `WidgetRoot` provides the analytics query client.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function SubscribersList( {
	attributes = {},
}: WidgetRenderProps< SubscribersListAttributes > ) {
	return (
		<WidgetRoot>
			<SubscribersReport attributes={ attributes } />
		</WidgetRoot>
	);
}
