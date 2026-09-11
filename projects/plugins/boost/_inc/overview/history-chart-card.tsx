import { GlobalChartsProvider, LineChart, useGlobalChartsContext } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { RawHTML } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info, trendingUp } from '@wordpress/icons';
import { Card, EmptyState, Notice } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import UpgradeCTA from './upgrade-cta';
import type {
	PerformanceHistoryData,
	PerformanceHistoryPeriod,
} from './lib/use-performance-history';
import type { DataPointDate, SeriesData } from '@automattic/charts';
import type { ComponentProps } from 'react';

type DeviceColors = { desktop?: string; mobile?: string };

type Props = {
	data?: PerformanceHistoryData | null;
	isLoading?: boolean;
	isVisible?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry: () => void;
	needsUpgrade?: boolean;
	isFreshStart?: boolean;
	onDismissFreshStart: () => void;
};

export function buildHistorySeries(
	data?: PerformanceHistoryData | null
): ( SeriesData & { data: DataPointDate[] } )[] {
	if ( ! data?.periods.length ) {
		return [];
	}
	const periods = [ ...data.periods ].sort( ( a, b ) => a.timestamp - b.timestamp );
	return ( [ 'desktop', 'mobile' ] as const ).map( device => ( {
		label:
			device === 'desktop' ? __( 'Desktop', 'jetpack-boost' ) : __( 'Mobile', 'jetpack-boost' ),
		options: { stroke: `var(--jetpack-boost-overview-chart-${ device })` },
		data: periods.map( period => ( {
			date: new Date( period.timestamp ),
			value: period.dimensions[ `${ device }_overall_score` ],
		} ) ),
	} ) );
}

export function HistoryTooltip( {
	period,
	colors,
}: {
	period: PerformanceHistoryPeriod;
	colors?: DeviceColors;
} ) {
	const dimensions = period.dimensions;
	const content = (
		<>
			<div className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', new Date( period.timestamp ), false ) }
			</div>
			<div>
				<dl className="jetpack-boost-overview__tooltip-section">
					<dt>{ __( 'Overall score', 'jetpack-boost' ) }</dt>
					<dd>
						{ getScoreLetter( dimensions.mobile_overall_score, dimensions.desktop_overall_score ) }
					</dd>
				</dl>
				{ ( [ 'desktop', 'mobile' ] as const ).map( device => (
					<dl key={ device } className="jetpack-boost-overview__tooltip-section">
						<dt>
							<span
								className="jetpack-boost-overview__series-swatch"
								style={ { backgroundColor: colors?.[ device ] } }
								aria-hidden="true"
							/>
							{ device === 'desktop'
								? __( 'Desktop score', 'jetpack-boost' )
								: __( 'Mobile score', 'jetpack-boost' ) }
						</dt>
						<dd>
							{ sprintf(
								/* translators: %d is the performance score. */
								__( '%d / 100', 'jetpack-boost' ),
								dimensions[ `${ device }_overall_score` ]
							) }
						</dd>
						<dt>{ __( 'Largest Contentful Paint', 'jetpack-boost' ) }</dt>
						<dd>
							{ sprintf(
								/* translators: %s is a duration in seconds. */
								__( '%ss', 'jetpack-boost' ),
								formatNumber( dimensions[ `${ device }_lcp` ], { decimals: 2 } )
							) }
						</dd>
						<dt>{ __( 'Total Blocking Time', 'jetpack-boost' ) }</dt>
						<dd>
							{ sprintf(
								/* translators: %s is a duration in seconds. */
								__( '%ss', 'jetpack-boost' ),
								formatNumber( dimensions[ `${ device }_tbt` ], { decimals: 2 } )
							) }
						</dd>
						<dt>{ __( 'Cumulative Layout Shift', 'jetpack-boost' ) }</dt>
						<dd>{ formatNumber( dimensions[ `${ device }_cls` ], { decimals: 2 } ) }</dd>
					</dl>
				) ) }
			</div>
		</>
	);
	return <div className="jetpack-boost-overview__history-tooltip">{ content }</div>;
}

function ThemedHistoryTooltip( {
	series,
	...props
}: ComponentProps< typeof HistoryTooltip > & { series: SeriesData[] } ) {
	const { getElementStyles } = useGlobalChartsContext();
	return (
		<HistoryTooltip
			{ ...props }
			colors={ {
				desktop: getElementStyles( { data: series[ 0 ], index: 0 } ).color,
				mobile: getElementStyles( { data: series[ 1 ], index: 1 } ).color,
			} }
		/>
	);
}

export default function HistoryChartCard( {
	data,
	isLoading,
	isVisible = true,
	isError,
	error,
	onRetry,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const series = useMemo( () => buildHistorySeries( data ), [ data ] );
	const tickValues = useMemo( () => {
		const dates = series[ 0 ]?.data.map( point => point.date ) ?? [];
		const days = dates.filter(
			( date, index ) =>
				index === 0 ||
				dateI18n( 'Y-m-d', date, false ) !== dateI18n( 'Y-m-d', dates[ index - 1 ], false )
		);
		const stride = Math.max( 1, Math.ceil( days.length / 5 ) );
		return days.filter( ( _, index ) => index % stride === 0 );
	}, [ series ] );
	const [ chartKey, setChartKey ] = useState( 0 );
	const dayBeforeEndDate = ( data?.endDate ?? 0 ) - 24 * 60 * 60 * 1000;
	const firstTimestamp = series[ 0 ]?.data[ 0 ]?.date?.getTime();
	const startDate =
		firstTimestamp === undefined
			? dayBeforeEndDate
			: Math.min(
					firstTimestamp - ( data?.periods.length === 1 ? 12 * 60 * 60 * 1000 : 0 ),
					dayBeforeEndDate
			  );
	const renderTooltip = useCallback<
		NonNullable< ComponentProps< typeof LineChart >[ 'renderTooltip' ] >
	>(
		( { tooltipData } ) => {
			const timestamp = tooltipData?.nearestDatum?.datum.date?.getTime();
			const period = data?.periods.find( entry => entry.timestamp === timestamp );
			if ( ! period ) {
				return null;
			}
			return <ThemedHistoryTooltip series={ series } period={ period } />;
		},
		[ data, series ]
	);
	let content;
	if ( needsUpgrade ) {
		content = (
			<Notice.Root intent="info" spokenMessage={ null }>
				<Notice.Title>{ __( 'Unlock historical performance', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'Upgrade and learn more about your site performance over time.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<UpgradeCTA />
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isLoading && ! data?.periods.length ) {
		content = (
			<div className="jetpack-boost-overview__chart-loading">
				<Spinner />
			</div>
		);
	} else if ( isError && ! isLoading ) {
		content = (
			<Notice.Root
				intent="error"
				spokenMessage={
					isVisible ? __( 'Failed to load performance history', 'jetpack-boost' ) : ''
				}
			>
				<Notice.Title>{ __( 'Failed to load performance history', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>{ error?.message }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ onRetry }>
						{ __( 'Try again', 'jetpack-boost' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isFreshStart ) {
		content = (
			<Notice.Root intent="success" spokenMessage={ null }>
				<Notice.Title>
					{ __( 'Hello there! Jetpack Boost premium has been activated.', 'jetpack-boost' ) }
				</Notice.Title>
				<Notice.Description>
					{ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ onDismissFreshStart }>
						{ __( 'Okay, got it!', 'jetpack-boost' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( ! data || ! series.length ) {
		content = (
			<EmptyState.Root>
				<EmptyState.Icon icon={ trendingUp } />
				<EmptyState.Title render={ <h3 /> }>
					{ __( 'No performance history yet', 'jetpack-boost' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Performance history will appear here once enough data has been collected.',
						'jetpack-boost'
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	} else {
		content = (
			<GlobalChartsProvider
				theme={ {
					legend: {
						labelStyles: { fontSize: 'var(--wpds-typography-font-size-md)' },
						containerStyles: { gap: 'var(--wpds-dimension-gap-xl)' },
					},
				} }
			>
				<div
					className="jetpack-boost-overview__chart-canvas"
					onBlur={ event => {
						if ( ! event.currentTarget.contains( event.relatedTarget as Node | null ) ) {
							// LineChart owns keyboard selection and does not expose a reset method.
							setChartKey( key => key + 1 );
						}
					} }
				>
					{ isVisible && (
						<LineChart
							key={ chartKey }
							data={ series }
							showLegend
							legend={ { position: 'bottom', alignment: 'center', interactive: false } }
							withGradientFill={ false }
							withTooltipCrosshairs={ {
								showVertical: true,
								verticalStyle: {
									stroke: 'var(--wpds-color-background-surface-neutral-weak)',
									strokeWidth: 'var(--wpds-dimension-size-lg)',
								},
							} }
							curveType="linear"
							withEndGlyphs={ data.periods.length === 1 }
							renderTooltip={ renderTooltip }
							tooltipPlacement="below-axis"
							tooltipStyle={ {
								background: 'var(--wpds-color-foreground-content-neutral)',
								color: 'var(--wpds-color-background-surface-neutral)',
								padding: 'var(--wpds-dimension-padding-lg)',
								borderRadius: 'var(--wpds-border-radius-md)',
								maxWidth: 'calc(100vw - var(--wpds-dimension-gap-lg))',
								boxSizing: 'border-box',
							} }
							options={ {
								axis: {
									x: {
										tickValues,
										tickFormat: value => dateI18n( 'M j', new Date( value ), false ),
									},
								},
								xScale: { domain: [ new Date( startDate ), new Date( data.endDate ) ] },
								yScale: { domain: [ 0, 100 ], nice: false },
							} }
						>
							<LineChart.AnnotationsOverlay>
								{ data.annotations
									.filter(
										annotation =>
											annotation.timestamp >= startDate && annotation.timestamp <= data.endDate
									)
									.map( ( annotation, index ) => (
										<LineChart.Annotation
											key={ `${ annotation.timestamp }-${ index }` }
											datum={ { date: new Date( annotation.timestamp ), value: 100 } }
											title={ sprintf(
												/* translators: %s is a date. */
												__( 'View performance history annotation for %s', 'jetpack-boost' ),
												dateI18n( 'F j, Y', new Date( annotation.timestamp ), false )
											) }
											renderLabel={ () => <Icon icon={ info } /> }
											renderLabelPopover={ () => (
												// Annotation text is sanitised by wp_kses_post in app/data-sync/class-performance-history-entry.php.
												<RawHTML>{ annotation.text }</RawHTML>
											) }
											subjectType="line-vertical"
										/>
									) ) }
							</LineChart.AnnotationsOverlay>
						</LineChart>
					) }
				</div>
			</GlobalChartsProvider>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__history-card">
			<Card.Header>
				<Card.Title render={ <h2 /> }>
					{ __( 'Historical performance', 'jetpack-boost' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
