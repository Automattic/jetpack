/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	MetricTileGridSkeleton,
	summaryCount,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { comment, page, people, seen } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	ALL_TIME_STATS_METRICS,
	type AllTimeStatsAttributes,
	type AllTimeStatsMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params arrive from the host but change nothing here: the all-time
// summary query takes no date params.
type AllTimeStatsRenderAttributes = AllTimeStatsAttributes & Partial< ReportParamsFieldAttributes >;
type AllTimeStatsWidgetProps = WidgetRenderProps< AllTimeStatsRenderAttributes >;

/**
 * Dynamic WPCOM keys, whose values arrive numeric or as numeric strings.
 */
type StatsSummary = Record< string, unknown >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Render-only icon per metric; the id doubles as the summary field the tile reads.
 */
const TILE_CONFIG: Record< AllTimeStatsMetricId, { icon: typeof seen } > = {
	views: { icon: seen },
	visitors: { icon: people },
	posts: { icon: page },
	comments: { icon: comment },
};

type AllTimeStatsTile = {
	key: AllTimeStatsMetricId;
	label: string;
	icon: typeof seen;
	value: number;
};

function AllTimeStatsReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	const tiles = useMemo(
		() =>
			ALL_TIME_STATS_METRICS.map( ( { id, label } ): AllTimeStatsTile => ( {
				key: id,
				label,
				icon: TILE_CONFIG[ id ].icon,
				value: summaryCount( summary, id ) ?? 0,
			} ) ),
		[ summary ]
	);

	// The states share the `.root` body wrapper so sizing (and the widget-picker
	// aspect-ratio) stays consistent whether data, a spinner, or a message shows.
	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the last totals on screen, so a transient
				// refetch failure should not replace them with an error.
				isError={ ! summary && isError }
				// Highlights have no empty state: a total that is missing shows zero.
				isEmpty={ false }
				error={ {
					description: __(
						"We couldn't load all-time stats. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTileGridSkeleton tiles={ tiles.length } /> }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

export default function AllTimeStats( { attributes = {} }: AllTimeStatsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport />
		</WidgetRoot>
	);
}
