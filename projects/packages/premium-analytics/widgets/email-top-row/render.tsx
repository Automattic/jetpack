/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chartBar, link, people, percent, seen, send } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailTopRowAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are dashboard-driven, but this widget reads the all-time
// `stats/emails/summary` endpoint and ignores the date range. The host (and
// Storybook) may still inject them via `attributes`, so accept them here.
type EmailTopRowRenderAttributes = EmailTopRowAttributes & Partial< ReportParamsFieldAttributes >;
type EmailTopRowWidgetProps = WidgetRenderProps< EmailTopRowRenderAttributes >;

// A single row from the emails summary report, holding one email's all-time totals.
type EmailSummaryRow = StatsEmailSummary[ 'data' ][ number ][ 'items' ][ number ];

type TileIcon = ComponentProps< typeof Icon >[ 'icon' ];

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
};

/**
 * A single top-row tile: an icon, a label, and the formatted metric value.
 */
export type EmailTopRowMetric = {
	/**
	 * Stable key for the tile.
	 */
	key: string;
	/**
	 * Icon shown alongside the label.
	 */
	icon: TileIcon;
	/**
	 * Label shown next to the icon (e.g. "Total opens").
	 */
	label: string;
	/**
	 * The numeric value to render. Rates are fractions (0–1); counts are integers.
	 */
	value: number;
	/**
	 * How to format the value.
	 */
	dataFormat: DataFormat;
};

/**
 * Maps one email's summary row onto the ordered top-row tiles. Mirrors the union
 * of the Jetpack Stats "Email top row" opens and clicks views: send/open counts,
 * unique opens, clicks, and the open/click rates. Rates arrive as 0–100
 * percentages and are converted to fractions for the percentage formatter.
 *
 * @param row - The selected email's summary row.
 * @return The ordered metric tiles.
 */
export function toEmailTopRowMetrics( row: EmailSummaryRow ): EmailTopRowMetric[] {
	return [
		{
			key: 'total_sends',
			icon: send,
			label: __( 'Total sends', 'jetpack-premium-analytics' ),
			value: row.total_sends,
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'opens',
			icon: seen,
			label: __( 'Total opens', 'jetpack-premium-analytics' ),
			value: row.opens,
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'unique_opens',
			icon: people,
			label: __( 'Unique opens', 'jetpack-premium-analytics' ),
			value: row.unique_opens,
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'opens_rate',
			icon: percent,
			label: __( 'Open rate', 'jetpack-premium-analytics' ),
			value: row.opens_rate / 100,
			dataFormat: RATE_FORMAT,
		},
		{
			key: 'clicks',
			icon: link,
			label: __( 'Total clicks', 'jetpack-premium-analytics' ),
			value: row.clicks,
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'clicks_rate',
			icon: chartBar,
			label: __( 'Click rate', 'jetpack-premium-analytics' ),
			value: row.clicks_rate / 100,
			dataFormat: RATE_FORMAT,
		},
	];
}

/**
 * Finds the summary row for a specific email. The summary endpoint returns the
 * latest emails newest-first with no per-post filter, so the widget selects the
 * matching row by ID. Returns `undefined` when no email is selected or the
 * selected email is not in the returned page.
 *
 * @param report - The normalized email-summary report, or undefined while loading.
 * @param postId - The selected email's post ID.
 * @return The matching row, or undefined when unavailable.
 */
export function selectEmailRow(
	report: StatsEmailSummary | undefined,
	postId?: number
): EmailSummaryRow | undefined {
	if ( ! postId ) {
		return undefined;
	}

	const items = report?.data?.[ 0 ]?.items ?? [];

	return items.find( item => Number( item.id ) === postId );
}

type EmailTopRowTilesProps = {
	/**
	 * The ordered metric tiles to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	metrics?: EmailTopRowMetric[];
	/**
	 * Whether an email is selected. Drives which empty-state message is shown when
	 * there are no metrics: prompt to select an email when `false`, or an
	 * "unavailable" message when `true` (the selected email is not in the summary).
	 */
	hasSelection?: boolean;
	/**
	 * When `true` and there is no data yet, the full loading overlay is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, a background refetch is in progress. Existing tiles stay
	 * visible; the grid is marked busy for assistive tech.
	 */
	isFetching?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the tiles.
	 */
	isError?: boolean;
};

/**
 * Presentational top row for the "Email top row" widget. Renders the selected
 * email's headline totals as bordered metric tiles and owns the loading, error,
 * empty, and populated states. Exported so Storybook and tests can exercise
 * those states with fixture metrics. The emails summary has no comparison period,
 * so each tile shows a bare formatted value with no delta.
 *
 * @param {EmailTopRowTilesProps} props - The component props.
 * @return The rendered top row.
 */
export const EmailTopRowTiles = ( {
	metrics,
	hasSelection = false,
	isLoading = false,
	isFetching = false,
	isError = false,
}: EmailTopRowTilesProps ) => {
	if ( isError ) {
		return (
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __( 'Unable to load email stats.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
		);
	}

	if ( isLoading && ! metrics ) {
		return (
			<div className={ styles.root }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	if ( ! metrics ) {
		const message = hasSelection
			? __(
					"This email's stats aren't available yet — it may be older than your most recent sent emails.",
					'jetpack-premium-analytics'
			  )
			: __( 'Select an email to see its opens and clicks.', 'jetpack-premium-analytics' );

		return (
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>{ message }</Text>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<div className={ styles.grid } aria-busy={ isFetching }>
				{ metrics.map( metric => (
					<div key={ metric.key } className={ styles.tile }>
						<div className={ styles.tileHeader }>
							<Icon icon={ metric.icon } size={ 24 } className={ styles.tileIcon } />
							<Text className={ styles.tileLabel }>{ metric.label }</Text>
						</div>
						<MetricWithComparison
							value={ metric.value }
							dataFormat={ metric.dataFormat }
							fontSize="xl"
							className={ styles.tileValue }
						/>
					</div>
				) ) }
			</div>
		</div>
	);
};

type EmailTopRowReportProps = {
	/**
	 * The selected email's post ID.
	 */
	postId?: number;
};

/**
 * Fetches the emails summary through `useStatsEmailSummary`, selects the row for
 * the given `postId`, and hands its top-row metrics to `EmailTopRowTiles`. The
 * summary is all-time and site-wide, so it does not read the dashboard date
 * range; it is requested at its maximum row count to widen the chance the
 * selected email is present.
 *
 * @param {EmailTopRowReportProps} props - The component props.
 * @return The widget content.
 */
function EmailTopRowReport( { postId }: EmailTopRowReportProps ) {
	// The summary endpoint accepts 1–30 rows; request its maximum so a recently
	// selected email is likely to be in the returned page.
	const { data, isLoading, isFetching, isError } = useStatsEmailSummary( { quantity: 30 } );

	const row = useMemo( () => selectEmailRow( data, postId ), [ data, postId ] );
	const metrics = useMemo( () => ( row ? toEmailTopRowMetrics( row ) : undefined ), [ row ] );

	return (
		<EmailTopRowTiles
			metrics={ metrics }
			hasSelection={ Boolean( postId ) }
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * The email is selected by the `postId` attribute supplied by the host. Host
 * attributes (including `reportParams`) are passed through to `<WidgetRoot>` for
 * the widget contract even though this all-time summary ignores the date range.
 *
 * @param {EmailTopRowWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailTopRow( { attributes = {} }: EmailTopRowWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTopRowReport postId={ attributes.postId } />
		</WidgetRoot>
	);
}
