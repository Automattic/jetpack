/**
 * External dependencies
 */
import {
	WidgetRoot,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useStats } from '../../hooks/use-stats';
import { getQueryClient } from '../../utils/query-client';
import { toStatsPeriod } from '../../utils/stats-period';
import FetchErrorNotice from '../fetch-error-notice';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ReactNode } from 'react';

/**
 * What the dashboard hands a widget of the Stats tab: no attributes of its own, the
 * period on show through `reportParams`.
 */
export type StatsWidgetProps = WidgetRenderProps< Partial< ReportParamsFieldAttributes > > & {
	/*
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

type StatsWidgetShellProps = StatsWidgetProps & {
	/*
	 * Renders the widget from the stats of the period on show.
	 */
	children: ( stats: ReturnType< typeof useStats > ) => ReactNode;
};

/**
 * Fetches the stats of the period the dashboard shows and hands them to the widget.
 *
 * @param {Pick< StatsWidgetShellProps, 'children' >} props - The props.
 * @return The widget content, or the fetch error.
 */
function StatsReport( { children }: Pick< StatsWidgetShellProps, 'children' > ) {
	const { reportParams } = useWidgetRootContext();
	const stats = useStats( toStatsPeriod( reportParams?.from, reportParams?.to ) );

	// Only with nothing behind it: a failed background refetch keeps the stats on screen.
	if ( stats.isError && ! stats.hasData ) {
		return (
			<FetchErrorNotice
				message={ __( 'We couldn’t load your video stats.', 'jetpack-videopress-pkg' ) }
				error={ stats.error }
				onRetry={ stats.refetch }
			/>
		);
	}

	return <>{ children( stats ) }</>;
}

/**
 * Shell of a Stats tab widget: the dashboard's widget root over the package's own query client.
 *
 * @param {StatsWidgetShellProps} props - The props.
 * @return The widget.
 */
export default function StatsWidget( {
	attributes = {},
	setError,
	children,
}: StatsWidgetShellProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<QueryClientProvider client={ getQueryClient() }>
				<StatsReport>{ children }</StatsReport>
			</QueryClientProvider>
		</WidgetRoot>
	);
}
