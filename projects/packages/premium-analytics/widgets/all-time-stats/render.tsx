/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Icon, comment, people, postContent, seen } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	ALL_TIME_STATS_METRICS,
	DEFAULT_ALL_TIME_STATS_METRICS,
	type AllTimeStatsAttributes,
	type AllTimeStatsMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The host (and Storybook) may inject report params via `attributes`, but the
// totals are all-time: the summary query takes no date params, so the picker's
// range and comparison state do not change what this widget shows.
type AllTimeStatsRenderAttributes = AllTimeStatsAttributes & Partial< ReportParamsFieldAttributes >;
type AllTimeStatsWidgetProps = WidgetRenderProps< AllTimeStatsRenderAttributes >;

/**
 * The all-time summary carries dynamic WPCOM keys (`views`, `visitors`,
 * `posts`, `comments`, …); values arrive numeric or as numeric strings, so
 * each field is read defensively.
 */
type StatsSummary = Record< string, unknown >;

const COUNT_FORMAT = {
	type: 'number' as const,
	options: { decimals: 0 },
};

/**
 * Render-only config per metric: the row icon. Ids and labels are shared with
 * the settings checkboxes via `ALL_TIME_STATS_METRICS` in `widget.ts`; the id
 * doubles as the summary field the row reads.
 */
const ROW_CONFIG: Record< AllTimeStatsMetricId, { icon: typeof seen } > = {
	views: { icon: seen },
	visitors: { icon: people },
	posts: { icon: postContent },
	comments: { icon: comment },
};

type AllTimeStatsRow = {
	key: AllTimeStatsMetricId;
	label: string;
	icon: typeof seen;
	value: number;
};

/**
 * Reads a numeric summary field, returning `undefined` when the key is absent
 * or not a finite number, so rows for missing fields can be skipped.
 *
 * @param summary - The normalized all-time summary.
 * @param key     - The summary field to read.
 * @return The numeric value, or undefined when unavailable.
 */
function readCount( summary: StatsSummary | undefined, key: string ): number | undefined {
	const value = summary?.[ key ];
	const parsed = typeof value === 'string' ? Number( value ) : value;

	return typeof parsed === 'number' && Number.isFinite( parsed ) ? parsed : undefined;
}

/**
 * Fetches the all-time site summary through the designated `useStatsSite` hook
 * and renders the lifetime totals as a labelled list of icon rows. Which rows
 * appear is controlled by the `metrics` attribute; fields absent from the
 * response are skipped. There is no comparison period for this module, so each
 * value renders as a bare number.
 *
 * @param {AllTimeStatsMetricId[]} metrics - Enabled metric row ids.
 * @return The widget content.
 */
function AllTimeStatsReport( {
	metrics = DEFAULT_ALL_TIME_STATS_METRICS,
}: {
	metrics?: AllTimeStatsMetricId[];
} ) {
	// The summary is all-time, so the query takes no date params — its key stays
	// stable across dashboard date-range and comparison changes.
	const { data, isLoading, isError } = useStatsSite();

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	// Resolve selected ids against the canonical definitions so the row order
	// stays stable regardless of the order the ids were toggled in.
	const enabledMetrics = useMemo( () => {
		const selected = new Set( metrics );
		return ALL_TIME_STATS_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metrics ] );

	const rows = useMemo(
		() =>
			enabledMetrics.flatMap( ( { id, label } ): AllTimeStatsRow[] => {
				const value = readCount( summary, id );
				return value === undefined
					? []
					: [ { key: id, label, icon: ROW_CONFIG[ id ].icon, value } ];
			} ),
		[ enabledMetrics, summary ]
	);

	let content;
	if ( isError ) {
		content = (
			<div className={ styles.state }>
				<Text>{ __( 'Unable to load all-time stats.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	} else if ( isLoading && rows.length === 0 ) {
		content = <WidgetLoadingOverlay />;
	} else if ( rows.length === 0 ) {
		content = (
			<div className={ styles.state }>
				<Text>
					{ enabledMetrics.length === 0
						? __( 'Select at least one metric to display.', 'jetpack-premium-analytics' )
						: __( 'No stats recorded yet.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
		);
	} else {
		content = (
			<div className={ styles.list }>
				{ rows.map( row => (
					<div key={ row.key } className={ styles.row }>
						<Icon className={ styles.icon } icon={ row.icon } />
						<Text className={ styles.label }>{ row.label }</Text>
						<MetricWithComparison
							className={ styles.value }
							value={ row.value }
							dataFormat={ COUNT_FORMAT }
							fontSize="md"
						/>
					</div>
				) ) }
			</div>
		);
	}

	// The states share the `.root` body wrapper so sizing (and the widget-picker
	// aspect-ratio) stays consistent whether data, a spinner, or a message shows.
	return <div className={ styles.root }>{ content }</div>;
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner
 * report needs. This widget is all-time, so it does not read the dashboard date
 * range; report params still flow into WidgetRoot for parity with the other
 * Stats widgets.
 *
 * @param {AllTimeStatsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AllTimeStats( { attributes = {} }: AllTimeStatsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
