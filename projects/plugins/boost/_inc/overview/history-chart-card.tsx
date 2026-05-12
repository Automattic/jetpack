import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { Spinner } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Notice, Text } from '@wordpress/ui';
import { buildDummyHistory } from './lib/dummy-history';
import type { PerformanceHistoryData } from './lib/use-performance-history';

// Series accent colours. Desktop reads as the canonical brand blue
// (matches the design's deep blue line); Mobile gets a vivid green so the
// two series stay distinguishable for users with red-green colour vision
// differences and in the chart's legend swatches.
const DESKTOP_LINE_COLOR = '#1d4ed8';
const MOBILE_LINE_COLOR = '#16a34a';

const CHART_HEIGHT = 240;

type Props = {
	data: PerformanceHistoryData | undefined;
	isLoading?: boolean;
	/**
	 * When true, the chart renders a blurred, non-interactive dummy curve
	 * with an upgrade Notice overlaid on top — matching the legacy
	 * `DummyGraph` upgrade prompt that Boost shows free users.
	 */
	needsUpgrade?: boolean;
	/** Called when the visitor clicks the upgrade CTA inside the overlay. */
	onUpgrade?: () => void;
};

type ChartSeries = { label: string; data: { date: Date; value: number }[]; options?: object };

/**
 * Flatten the Data-Sync `periods` payload into the two series the chart
 * needs (Desktop, Mobile). The endpoint returns timestamps in seconds; the
 * LineChart expects native `Date` objects.
 *
 * @param periods - Time-series rows from the performance-history endpoint.
 * @return Two-series chart input.
 */
function buildSeries( periods: PerformanceHistoryData ): ChartSeries[] {
	if ( ! periods?.periods?.length ) {
		return [];
	}

	const desktop: ChartSeries[ 'data' ] = [];
	const mobile: ChartSeries[ 'data' ] = [];
	for ( const p of periods.periods ) {
		const date = new Date( p.timestamp * 1000 );
		desktop.push( { date, value: p.dimensions.desktop_overall_score } );
		mobile.push( { date, value: p.dimensions.mobile_overall_score } );
	}

	return [
		{
			label: __( 'Desktop', 'jetpack-boost' ),
			data: desktop,
			options: { stroke: DESKTOP_LINE_COLOR },
		},
		{
			label: __( 'Mobile', 'jetpack-boost' ),
			data: mobile,
			options: { stroke: MOBILE_LINE_COLOR },
		},
	];
}

/**
 * Card wrapping the Historical Performance line chart.
 *
 * On paid plans (or when `needsUpgrade` is false) the card renders a
 * two-series `LineChart` from `@automattic/charts` driven by the cached
 * performance-history time series. On free plans the same chart renders
 * with a believable dummy curve, blurred and non-interactive, and an
 * upgrade Notice sits on top — mirroring the legacy `DummyGraph`
 * treatment so free users still see the value proposition.
 *
 * @param props              - Component props.
 * @param props.data         - Performance-history payload from `usePerformanceHistory()`.
 * @param props.isLoading    - True while the initial fetch is in flight.
 * @param props.needsUpgrade - When true, overlays the upgrade Notice.
 * @param props.onUpgrade    - Called when the upgrade CTA is clicked.
 * @return The chart card element.
 */
export default function HistoryChartCard( {
	data,
	isLoading,
	needsUpgrade,
	onUpgrade,
}: Props ): JSX.Element {
	const series = useMemo(
		() => buildSeries( needsUpgrade ? buildDummyHistory() : data ?? null ),
		[ data, needsUpgrade ]
	);
	const hasData = series.length > 0 && series[ 0 ].data.length > 0;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Historical performance', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ isLoading && ! hasData && (
					<div className="jetpack-boost-overview__chart-loading">
						<Spinner />
					</div>
				) }
				{ ! isLoading && ! hasData && (
					<Text variant="body-md">
						{ __(
							'Performance history will appear here once enough data has been collected.',
							'jetpack-boost'
						) }
					</Text>
				) }
				{ hasData && (
					<div className="jetpack-boost-overview__chart-wrapper">
						<div
							className={
								needsUpgrade
									? 'jetpack-boost-overview__chart-canvas jetpack-boost-overview__chart-canvas--locked'
									: 'jetpack-boost-overview__chart-canvas'
							}
							aria-hidden={ needsUpgrade ? 'true' : undefined }
						>
							<LineChart
								data={ series }
								height={ CHART_HEIGHT }
								showLegend
								withGradientFill={ false }
							/>
						</div>
						{ needsUpgrade && (
							<div className="jetpack-boost-overview__chart-overlay">
								<Notice.Root intent="success" className="jetpack-boost-overview__upgrade-notice">
									<Notice.Title>
										{ __( 'Unlock Historical performance', 'jetpack-boost' ) }
									</Notice.Title>
									<Notice.Description>
										{ __(
											'Upgrade and learn more about your site performance over time.',
											'jetpack-boost'
										) }
									</Notice.Description>
									<Notice.Actions>
										<Button variant="solid" size="compact" onClick={ onUpgrade }>
											{ __( 'Upgrade now', 'jetpack-boost' ) }
										</Button>
									</Notice.Actions>
								</Notice.Root>
							</div>
						) }
					</div>
				) }
			</Card.Content>
		</Card.Root>
	);
}
