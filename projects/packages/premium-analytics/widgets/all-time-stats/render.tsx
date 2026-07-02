/**
 * External dependencies
 */
import { reportParamsToStatsQueryParams, useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
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

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
// The totals are all-time regardless; the params only key the query.
type AllTimeStatsRenderAttributes = AllTimeStatsAttributes & Partial< ReportParamsFieldAttributes >;

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
	const { reportParams } = useWidgetRootContext();

	const statsParams = useMemo(
		() => reportParamsToStatsQueryParams( reportParams ),
		[ reportParams ]
	);

	const { data, isLoading, isError } = useStatsSite( statsParams );

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	const rows = useMemo(
		() =>
			ROWS.map( row => ( { ...row, value: readCount( summary, row.key ) } ) ).filter(
				( row ): row is ( typeof ROWS )[ number ] & { value: number } => row.value !== undefined
			),
		[ summary ]
	);

	if ( isError ) {
		return (
			<div className={ styles.state }>
				<Text>{ __( 'Unable to load all-time stats.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	if ( isLoading && rows.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	if ( rows.length === 0 ) {
		return (
			<div className={ styles.state }>
				<Text>{ __( 'No stats recorded yet.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
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

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner list — resolved from the dashboard date range via
 * context, the same way the other Stats widgets read them.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function AllTimeStats( {
	attributes = {},
}: WidgetRenderProps< AllTimeStatsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport />
		</WidgetRoot>
	);
}
