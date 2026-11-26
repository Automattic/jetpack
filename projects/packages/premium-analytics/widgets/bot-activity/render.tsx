/**
 * External dependencies
 */
import { isEdgeWindowTooLong, useStatsBotClasses } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	describeError,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
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
	// The template reads AI bots and the rest in separate requests.
	const ai = useStatsBotClasses( reportParams, 'ai' );
	const other = useStatsBotClasses( reportParams, 'non-ai' );
	const aiItems = ai.primary.data?.data;
	const otherItems = other.primary.data?.data;
	const rows = useMemo(
		() => buildBotGroupRows( [ ...( aiItems ?? [] ), ...( otherItems ?? [] ) ] ),
		[ aiItems, otherItems ]
	);
	const aiRefetch = ai.refetch;
	const otherRefetch = other.refetch;
	const refetch = useCallback(
		() => Promise.all( [ aiRefetch(), otherRefetch() ] ),
		[ aiRefetch, otherRefetch ]
	);
	// A half with no rows would rank the groups as if it had no bots; a failed refresh keeps its rows.
	const failed = [ ai, other ].find( half => half.isError && ! half.primary.data?.data );
	const isRangeTooLong = isEdgeWindowTooLong( reportParams );
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
					isLoading: ai.isLoading || other.isLoading,
					isFetching: ai.isFetching || other.isFetching,
					isError: !! failed,
					refetch,
				} }
				error={
					failed &&
					describeError( failed.error, {
						retryDescription: __(
							"We couldn't load bot activity. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} )
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
