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
import { Text } from '@wordpress/ui';
import { format, isValid, parseISO } from 'date-fns';
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
 * `posts`, `views_best_day`, …); values arrive numeric or as numeric strings,
 * so each field is read defensively.
 */
type StatsSummary = Record< string, unknown >;

const COUNT_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Reads a numeric summary field, returning `undefined` when the key is absent
 * or not a finite number, so tiles for missing fields can be skipped.
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
 * Formats the best-day date (`YYYY-MM-DD`) for display, returning `undefined`
 * when the value is missing or unparseable.
 *
 * @param summary - The normalized all-time summary.
 * @return The formatted date, or undefined when unavailable.
 */
function readBestDay( summary: StatsSummary | undefined ): string | undefined {
	const value = summary?.views_best_day;

	if ( typeof value !== 'string' || value === '' ) {
		return undefined;
	}

	const date = parseISO( value );

	return isValid( date ) ? format( date, 'MMM d, yyyy' ) : undefined;
}

type StatTileProps = {
	/**
	 * The tile label, shown above the value.
	 */
	label: string;
	/**
	 * The numeric value rendered as the headline figure.
	 */
	value: number;
	/**
	 * Optional caption shown beneath the value (e.g. the best-day date).
	 */
	caption?: string;
};

/**
 * A single all-time stat tile: a muted label, the headline count, and an
 * optional caption. The count uses `MetricWithComparison` with no previous
 * value, so it renders as a bare formatted number without a delta.
 *
 * @param {StatTileProps} props - The component props.
 * @return The rendered tile.
 */
function StatTile( { label, value, caption }: StatTileProps ) {
	return (
		<div className={ styles.tile }>
			<Text variant="body-sm" className={ styles.label }>
				{ label }
			</Text>
			<MetricWithComparison value={ value } dataFormat={ COUNT_FORMAT } />
			{ caption && (
				<Text variant="body-sm" className={ styles.caption }>
					{ caption }
				</Text>
			) }
		</div>
	);
}

/**
 * Fetches the all-time site summary through the designated `useStatsSite` hook
 * and renders the lifetime totals as a grid of stat tiles. Only fields present
 * in the response are shown. There is no comparison period for this module, so
 * each value renders as a bare number.
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

	const tiles = useMemo( () => {
		const views = readCount( summary, 'views' );
		const visitors = readCount( summary, 'visitors' );
		const posts = readCount( summary, 'posts' );
		const bestDayViews = readCount( summary, 'views_best_day_total' );
		const bestDay = readBestDay( summary );

		const entries: StatTileProps[] = [];

		if ( views !== undefined ) {
			entries.push( { label: __( 'Views', 'jetpack-premium-analytics' ), value: views } );
		}
		if ( visitors !== undefined ) {
			entries.push( {
				label: __( 'Visitors', 'jetpack-premium-analytics' ),
				value: visitors,
			} );
		}
		if ( posts !== undefined ) {
			entries.push( { label: __( 'Posts', 'jetpack-premium-analytics' ), value: posts } );
		}
		if ( bestDayViews !== undefined ) {
			entries.push( {
				label: __( 'Best views ever', 'jetpack-premium-analytics' ),
				value: bestDayViews,
				caption: bestDay,
			} );
		}

		return entries;
	}, [ summary ] );

	if ( isError ) {
		return (
			<div className={ styles.state }>
				<Text>{ __( 'Unable to load all-time stats.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	if ( isLoading && tiles.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	if ( tiles.length === 0 ) {
		return (
			<div className={ styles.state }>
				<Text>{ __( 'No stats recorded yet.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			{ tiles.map( tile => (
				<StatTile
					key={ tile.label }
					label={ tile.label }
					value={ tile.value }
					caption={ tile.caption }
				/>
			) ) }
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner grid — resolved from the dashboard date range via
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
