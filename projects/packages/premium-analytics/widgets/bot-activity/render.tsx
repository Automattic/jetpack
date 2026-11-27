/**
 * External dependencies
 */
import { isEdgeWindowTooLong, useStatsBotActivity } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	describeError,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildBotGroupRows } from './build-bot-groups';
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

export type BotActivityAttributes = Record< never, never >;

type BotActivityRenderAttributes = BotActivityAttributes & Partial< ReportParamsFieldAttributes >;
type BotActivityProps = WidgetRenderProps< BotActivityRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function rowAriaLabel( row: LeaderboardRowInput ) {
	return sprintf(
		/* translators: %s: a group of bots, e.g. "AI training". */
		__( 'View the bots in %s', 'jetpack-premium-analytics-pkg' ),
		row.label
	);
}

function BotActivityInner() {
	const { reportParams } = useWidgetRootContext();
	const { primary, isLoading, isFetching, isError, error, refetch } =
		useStatsBotActivity( reportParams );
	const isRangeTooLong = isEdgeWindowTooLong( reportParams );
	// No request is sent for a range that long, so the data on hand is the previous range's placeholder.
	const groups = isRangeTooLong ? undefined : primary.data?.data;
	const rows = useMemo( () => buildBotGroupRows( groups ?? [] ), [ groups ] );
	// Rows from a successful load stay on screen when a refresh fails.
	const showError = isError && ! rows.length;
	const columns = useMemo(
		() => ( {
			label: __( 'Bots', 'jetpack-premium-analytics-pkg' ),
			metric: 'requests' as const,
		} ),
		[]
	);
	const drillDown = useMemo(
		() => ( {
			backLabel: __( 'All groups', 'jetpack-premium-analytics-pkg' ),
			rowAriaLabel,
		} ),
		[]
	);

	return (
		<div className={ styles.root }>
			<Leaderboard
				rows={ rows }
				status={ {
					isLoading,
					isFetching,
					isError: showError,
					refetch,
				} }
				error={
					showError
						? describeError( error, {
								retryDescription: __(
									"We couldn't load bot activity. Please try again in a moment.",
									'jetpack-premium-analytics-pkg'
								),
								onRetry: refetch,
							} )
						: undefined
				}
				empty={ {
					description: isRangeTooLong
						? __(
								'Bot activity is available for up to a year at a time. Choose a shorter period.',
								'jetpack-premium-analytics-pkg'
							)
						: __( 'No requests from bots in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				columns={ columns }
				drillDown={ drillDown }
			/>
		</div>
	);
}

export default function BotActivity( { attributes = {}, setError }: BotActivityProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<BotActivityInner />
		</WidgetRoot>
	);
}
