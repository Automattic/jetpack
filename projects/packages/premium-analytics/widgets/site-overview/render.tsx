/**
 * External dependencies
 */
import { useStatsSummary, type StatsSummaryResponse } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Icon, comment, people, seen, starEmpty } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { SiteOverviewAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type SiteOverviewRenderAttributes = SiteOverviewAttributes & Partial< ReportParamsFieldAttributes >;
type SiteOverviewWidgetProps = WidgetRenderProps< SiteOverviewRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * The period metrics shown, in display order. Each key is a numeric field of the
 * summary response, paired with its Stats icon. `summary` totals views/visitors/
 * likes/comments over the period; `followers` is excluded because it is an
 * all-time running total, not a period metric, so it has no meaningful
 * period-over-period comparison.
 */
const METRICS = [
	{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ), icon: seen },
	{ key: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ), icon: people },
	{ key: 'likes', label: __( 'Likes', 'jetpack-premium-analytics' ), icon: starEmpty },
	{ key: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ), icon: comment },
] as const;

/**
 * Fetches the period summary through the designated `useStatsSummary` Stats hook
 * and renders views, visitors, likes, and comments as metric tiles. The date
 * range and comparison period come from the dashboard picker via `reportParams`.
 *
 * When a comparison period is requested and returns data, each tile shows its
 * period-over-period change; the comparison total is looked up per metric so a
 * primary metric is never paired with a fabricated previous value.
 *
 * @return The widget content.
 */
function SiteOverviewReport() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, isError } =
		useStatsSummary( reportParams );

	const summary = primary.data as StatsSummaryResponse | undefined;
	const comparisonSummary = comparison.data as StatsSummaryResponse | undefined;

	// The summary response is a flat object, so `useReport`'s generic `hasData`
	// (which looks for `.summary`/`.data`/`.steps`) never matches it — gate on the
	// summary directly. Cover the widget only on the cold load; once a period's
	// totals are on screen, a date-range change refetches in the background and we
	// layer the overlay over the stale tiles instead of blanking them.
	const hasSummary = !! summary;
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasSummary;
	const isRefetching = isFetching && hasSummary;

	// Only wire comparison values when the comparison period actually returned a
	// summary; otherwise the tiles render as bare current-period totals rather
	// than showing a delta derived from missing data.
	const previousByMetric = useMemo( () => {
		const map = new Map< keyof StatsSummaryResponse, number >();
		if ( hasComparison && comparisonSummary ) {
			for ( const metric of METRICS ) {
				map.set( metric.key, comparisonSummary[ metric.key ] );
			}
		}
		return map;
	}, [ hasComparison, comparisonSummary ] );

	let content;
	if ( isError ) {
		content = (
			<div className={ styles.state }>
				<Text>{ __( 'Unable to load site overview.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	} else if ( isInitialLoading ) {
		content = <WidgetLoadingOverlay />;
	} else if ( ! summary ) {
		content = (
			<div className={ styles.state }>
				<Text>{ __( 'No stats recorded for this period.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	} else {
		content = (
			<div className={ styles.grid }>
				{ METRICS.map( metric => (
					<div key={ metric.key } className={ styles.tile }>
						<div className={ styles.tileHeader }>
							<Icon className={ styles.tileIcon } icon={ metric.icon } size={ 24 } />
							<Text className={ styles.tileLabel }>{ metric.label }</Text>
						</div>
						<MetricWithComparison
							className={ styles.tileValue }
							value={ summary[ metric.key ] }
							previousValue={ previousByMetric.get( metric.key ) }
							dataFormat={ COUNT_FORMAT }
							fontSize="xl"
						/>
					</div>
				) ) }
			</div>
		);
	}

	// The states share the `.root` body wrapper so sizing stays consistent
	// whether data, a spinner, or a message shows. `.root` is positioned, so the
	// refetch overlay layers over the tiles while a new period loads.
	return (
		<div className={ styles.root }>
			{ content }
			{ isRefetching && <WidgetLoadingOverlay /> }
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner report — resolved from the dashboard date range
 * and comparison state via context, the same way the other Stats widgets read
 * them.
 *
 * @param {SiteOverviewWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SiteOverview( { attributes = {} }: SiteOverviewWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SiteOverviewReport />
		</WidgetRoot>
	);
}
