/**
 * External dependencies
 */
import { toAuthorId, useReportScope } from '@jetpack-premium-analytics/data';
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import { reports } from '@jetpack-premium-analytics/icons';
import { useOpenSectionRange } from '@jetpack-premium-analytics/routing';
import {
	HeatmapSkeleton,
	MonthlyHeatmap,
	WidgetRoot,
	WidgetState,
	describeError,
	monthRange,
	monthlyHeatmapLabels,
	resolveMonthlyHeatmapMetric,
	useWidgetRootContext,
	yearRange,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapTarget,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import useViewsOverYears from './use-views-over-years';
import type { ViewsOverYearsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ViewsOverYearsRenderAttributes = ViewsOverYearsAttributes &
	Partial< ReportParamsFieldAttributes >;
type ViewsOverYearsWidgetProps = WidgetRenderProps< ViewsOverYearsRenderAttributes >;

// The dashboard section a picked month opens, where the site's traffic is read over a period.
const TRAFFIC_SECTION = 'traffic';

type ViewsOverYearsInnerProps = {
	metric: MonthlyHeatmapMetric;
	authorScoped: boolean;
};

function ViewsOverYearsInner( { metric, authorScoped }: ViewsOverYearsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const authorId = authorScoped ? toAuthorId( reportParams.author_id ) : undefined;
	const { rows, lifeStartsAt, isLoading, isFetching, isError, error, refetch } = useViewsOverYears(
		metric,
		authorId
	);
	const openSectionRange = useOpenSectionRange();
	const { openPeriod } = useReportScope();
	const timeZone = reportingTimeZone();

	// Classic Stats links each month to the traffic page over it; the year's
	// roll-up opens the whole year. On an author's page it becomes that page's period.
	const openMonth = useCallback(
		( { year, month }: MonthlyHeatmapTarget ) => {
			const bounds = { lifeStartsAt, timeZone };
			const range =
				month === undefined ? yearRange( year, bounds ) : monthRange( { year, month }, bounds );

			if ( ! range?.from || ! range.to ) {
				return;
			}

			if ( authorScoped ) {
				openPeriod?.( range );
			} else {
				openSectionRange( TRAFFIC_SECTION, { from: range.from, to: range.to } );
			}
		},
		[ authorScoped, lifeStartsAt, timeZone, openPeriod, openSectionRange ]
	);

	// Without an author on the page, the author-scoped table has nothing to read.
	if ( authorId !== undefined && authorId <= 0 ) {
		return (
			<WidgetState
				isLoading={ false }
				isError={ false }
				isEmpty
				empty={ {
					icon: reports,
					description: __(
						'Open an author to see their all-time traffic here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				{ null }
			</WidgetState>
		);
	}

	// Keep stale rows visible when a background refetch fails.
	const showError = isError && rows.length === 0;

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ showError }
			// A site without views still gets its current month, at zero.
			isEmpty={ false }
			error={
				showError
					? describeError( error, {
							retryDescription: __(
								"We couldn't load your views. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: refetch,
						} )
					: null
			}
			renderLoading={ <HeatmapSkeleton /> }
		>
			<MonthlyHeatmap rows={ rows } { ...monthlyHeatmapLabels( metric ) } onSelect={ openMonth } />
		</WidgetState>
	);
}

export default function ViewsOverYears( { attributes = {} }: ViewsOverYearsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ViewsOverYearsInner
				metric={ resolveMonthlyHeatmapMetric( attributes.metric ) }
				authorScoped={ attributes.authorScoped === true }
			/>
		</WidgetRoot>
	);
}
