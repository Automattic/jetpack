/**
 * External dependencies
 */
import {
	useStatsWordAdsEarnings,
	type StatsWordAdsEarnings,
	type StatsWordAdsEarningsBreakdown,
} from '@jetpack-premium-analytics/data';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	MetricValue,
	WidgetLoadingOverlay,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _x } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { WordAdsEarningsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The host (and Storybook) may inject report params via `attributes`, but the
// earnings endpoint takes no date params: totals are cumulative and the
// breakdown is the full per-period history, so the picker's range and
// comparison state do not change what this widget shows.
type WordAdsEarningsRenderAttributes = WordAdsEarningsAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsEarningsWidgetProps = WidgetRenderProps< WordAdsEarningsRenderAttributes >;

const CURRENCY_FORMAT = { type: 'currency' as const };
const COUNT_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

// The three earnings sources returned by the WordAds earnings endpoint, in the
// order Jetpack Stats presents them, each with its section heading.
const BREAKDOWN_SECTIONS = [
	{ key: 'wordads', label: __( 'WordAds', 'jetpack-premium-analytics' ) },
	{ key: 'sponsored', label: __( 'Sponsored content', 'jetpack-premium-analytics' ) },
	{ key: 'adjustment', label: __( 'Adjustments', 'jetpack-premium-analytics' ) },
] as const;

/**
 * Payment status labels for a breakdown row, matching the codes returned by the
 * WordAds earnings endpoint. Unknown codes fall back to a generic label.
 *
 * @param status - The numeric payment status code.
 * @return The translatable status label.
 */
function statusLabel( status: number ): string {
	switch ( status ) {
		case 0:
			return __( 'Unpaid', 'jetpack-premium-analytics' );
		case 1:
			return __( 'Paid', 'jetpack-premium-analytics' );
		case 2:
			return __( 'a8c-only', 'jetpack-premium-analytics' );
		case 3:
			return __( 'Pending (Missing Tax Info)', 'jetpack-premium-analytics' );
		case 4:
			return __( 'Pending (Invalid PayPal)', 'jetpack-premium-analytics' );
		default:
			return __( 'Unknown', 'jetpack-premium-analytics' );
	}
}

/**
 * Formats a `YYYY-MM` period key as a human month/year label (e.g. `May 2026`).
 * Falls back to the raw key when it is not a parseable period.
 *
 * @param period - The `YYYY-MM` period key.
 * @return The formatted period label.
 */
function formatPeriod( period: string ): string {
	const [ year, month ] = period.split( '-' ).map( Number );

	if ( ! Number.isFinite( year ) || ! Number.isFinite( month ) ) {
		return period;
	}

	return formatDate( new Date( year, month - 1, 1 ), 'monthYear' );
}

type EarningsRow = {
	period: string;
	amount: number;
	pageviews: number;
	status: number;
};

/**
 * Turns an earnings breakdown map into rows sorted most-recent period first.
 *
 * @param breakdown - The per-period breakdown map, keyed by `YYYY-MM`.
 * @return The breakdown rows, newest period first.
 */
function toRows( breakdown: StatsWordAdsEarningsBreakdown ): EarningsRow[] {
	return Object.entries( breakdown )
		.map( ( [ period, values ] ) => ( { period, ...values } ) )
		.sort( ( a, b ) => b.period.localeCompare( a.period ) );
}

type BreakdownSectionProps = {
	/**
	 * Section heading, naming the earnings source.
	 */
	label: string;
	/**
	 * The rows to render, already sorted newest first.
	 */
	rows: EarningsRow[];
};

/**
 * A single earnings source (WordAds, sponsored, or adjustments) rendered as a
 * table of periods.
 *
 * @param {BreakdownSectionProps} props - The section props.
 * @return The rendered section.
 */
function BreakdownSection( { label, rows }: BreakdownSectionProps ) {
	return (
		<section className={ styles.section }>
			<Text className={ styles.sectionHeading }>{ label }</Text>
			<table className={ styles.table }>
				<thead>
					<tr>
						<th className={ styles.colPeriod } scope="col">
							{ __( 'Period', 'jetpack-premium-analytics' ) }
						</th>
						<th className={ styles.colNumeric } scope="col">
							{ __( 'Earnings', 'jetpack-premium-analytics' ) }
						</th>
						<th className={ styles.colNumeric } scope="col">
							{ __( 'Ads served', 'jetpack-premium-analytics' ) }
						</th>
						<th className={ styles.colStatus } scope="col">
							{ _x( 'Status', 'payment status', 'jetpack-premium-analytics' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					{ rows.map( row => (
						<tr key={ row.period }>
							<td className={ styles.colPeriod }>{ formatPeriod( row.period ) }</td>
							<td className={ styles.colNumeric }>
								{ formatMetricValue( row.amount, 'currency' ) }
							</td>
							<td className={ styles.colNumeric }>
								{ formatMetricValue( row.pageviews, 'number', COUNT_FORMAT.options ) }
							</td>
							<td className={ styles.colStatus }>{ statusLabel( row.status ) }</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</section>
	);
}

/**
 * Fetches the WordAds earnings report and renders the headline totals plus a
 * per-period breakdown for each earnings source that has data. The endpoint has
 * no comparison period, so values render without deltas.
 *
 * @return The widget content.
 */
function WordAdsEarningsReport() {
	const { data, isLoading, isError } = useStatsWordAdsEarnings();

	const earnings = data as StatsWordAdsEarnings | undefined;

	const sections = useMemo(
		() =>
			BREAKDOWN_SECTIONS.map( section => ( {
				...section,
				rows: toRows( earnings?.[ section.key ] ?? {} ),
			} ) ).filter( section => section.rows.length > 0 ),
		[ earnings ]
	);

	const hasData = earnings !== undefined;

	let content;
	if ( isError ) {
		content = (
			<div className={ styles.state }>
				<Text>{ __( 'Unable to load WordAds earnings.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	} else if ( isLoading && ! hasData ) {
		content = <WidgetLoadingOverlay />;
	} else if ( ! hasData || sections.length === 0 ) {
		content = (
			<div className={ styles.state }>
				<Text>
					{ __(
						'No WordAds earnings yet. Earnings appear here once your ads start generating revenue.',
						'jetpack-premium-analytics'
					) }
				</Text>
			</div>
		);
	} else {
		content = (
			<>
				<div className={ styles.totals }>
					<div className={ styles.total }>
						<Text className={ styles.totalLabel }>
							{ __( 'Total earnings', 'jetpack-premium-analytics' ) }
						</Text>
						<MetricValue
							value={ earnings.total_earnings }
							dataFormat={ CURRENCY_FORMAT }
							fontSize="xl"
						/>
					</div>
					<div className={ styles.total }>
						<Text className={ styles.totalLabel }>
							{ __( 'Amount owed', 'jetpack-premium-analytics' ) }
						</Text>
						<MetricValue
							value={ earnings.total_amount_owed }
							dataFormat={ CURRENCY_FORMAT }
							fontSize="xl"
						/>
					</div>
				</div>
				{ sections.map( section => (
					<BreakdownSection key={ section.key } label={ section.label } rows={ section.rows } />
				) ) }
			</>
		);
	}

	// The states share the `.root` body wrapper so sizing stays consistent
	// whether data, a spinner, or a message shows.
	return <div className={ styles.root }>{ content }</div>;
}

/**
 * WordAds earnings widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner
 * report needs. This widget shows cumulative earnings, so it does not read the
 * dashboard date range; report params still flow into WidgetRoot for parity
 * with the other Stats widgets.
 *
 * @param {WordAdsEarningsWidgetProps} props - The widget render props.
 * @return The rendered WordAds earnings widget.
 */
export default function WordAdsEarnings( { attributes = {} }: WordAdsEarningsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsEarningsReport />
		</WidgetRoot>
	);
}
