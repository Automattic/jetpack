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
import type { AllTimeStatsAttributes } from './widget';
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

// Lifetime totals shown, in display order, each keyed to its summary field and
// Stats icon. Rows whose field is absent from the response are skipped.
const ROWS = [
	{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ), icon: seen },
	{ key: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ), icon: people },
	{ key: 'posts', label: __( 'Posts', 'jetpack-premium-analytics' ), icon: postContent },
	{ key: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ), icon: comment },
] as const;

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
 * and renders the lifetime totals as a labelled list of icon rows. Only fields
 * present in the response are shown. There is no comparison period for this
 * module, so each value renders as a bare number.
 *
 * @return The widget content.
 */
function AllTimeStatsReport() {
	// The summary is all-time, so the query takes no date params — its key stays
	// stable across dashboard date-range and comparison changes.
	const { data, isLoading, isError } = useStatsSite();

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	const rows = useMemo(
		() =>
			ROWS.map( row => ( { ...row, value: readCount( summary, row.key ) } ) ).filter(
				( row ): row is ( typeof ROWS )[ number ] & { value: number } => row.value !== undefined
			),
		[ summary ]
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
				<Text>{ __( 'No stats recorded yet.', 'jetpack-premium-analytics' ) }</Text>
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
			<AllTimeStatsReport />
		</WidgetRoot>
	);
}
