import { LineChart, useGlobalChartsContext } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import { Button, Card, EmptyState, Notice, Text } from '@wordpress/ui';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import UpgradeCTA from './upgrade-cta';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { DataPointDate, SeriesData } from '@automattic/charts';
import type { ComponentProps } from 'react';

const CHART_MARGIN = { left: 40, right: 20, bottom: 32 };

type TooltipAnchor = { fraction: number };
type DeviceColors = { desktop?: string; mobile?: string };

type History = NonNullable< PerformanceHistoryData >;
type Props = {
	data?: PerformanceHistoryData | null;
	isLoading?: boolean;
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
	return [
		{
			label: __( 'Desktop', 'jetpack-boost' ),
			data: periods.map( period => ( {
				date: new Date( period.timestamp ),
				value: period.dimensions.desktop_overall_score,
			} ) ),
		},
		{
			label: __( 'Mobile', 'jetpack-boost' ),
			data: periods.map( period => ( {
				date: new Date( period.timestamp ),
				value: period.dimensions.mobile_overall_score,
			} ) ),
		},
	];
}

export function HistoryTooltip( {
	period,
	anchor,
	colors,
}: {
	period: History[ 'periods' ][ number ];
	anchor?: TooltipAnchor;
	colors?: DeviceColors;
} ) {
	const tooltipRef = useRef< HTMLDivElement >( null );
	const [ width, setWidth ] = useState( 0 );
	const [ plotWidth, setPlotWidth ] = useState( 0 );
	const isAnchored = anchor !== undefined;
	useLayoutEffect( () => {
		const element = tooltipRef.current;
		if ( ! element || ! isAnchored ) {
			return;
		}
		const plot = element.offsetParent;
		const measure = () => {
			setWidth( element.getBoundingClientRect().width );
			setPlotWidth( plot?.clientWidth ?? 0 );
		};
		measure();
		const observer = new ResizeObserver( measure );
		observer.observe( element );
		if ( plot ) {
			observer.observe( plot );
		}
		return () => observer.disconnect();
	}, [ isAnchored ] );
	const anchorX =
		CHART_MARGIN.left +
		( anchor?.fraction ?? 0 ) * ( plotWidth - CHART_MARGIN.left - CHART_MARGIN.right );
	const left = anchor ? Math.max( 8, Math.min( anchorX - width / 2, plotWidth - width - 8 ) ) : 0;
	const dimensions = period.dimensions;
	return (
		<div
			ref={ tooltipRef }
			className="jetpack-boost-overview__history-tooltip"
			style={
				anchor
					? { position: 'absolute', left, top: `calc(100% - ${ CHART_MARGIN.bottom }px)` }
					: undefined
			}
		>
			<Text>{ dateI18n( 'F j, Y', new Date( period.timestamp ), false ) }</Text>
			<dl>
				<dt>{ __( 'Overall score', 'jetpack-boost' ) }</dt>
				<dd>
					{ getScoreLetter( dimensions.mobile_overall_score, dimensions.desktop_overall_score ) }
				</dd>
				{ ( [ 'desktop', 'mobile' ] as const ).map( device => (
					<div key={ device }>
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
						<dd>{ sprintf( '%.2fs', dimensions[ `${ device }_lcp` ] ) }</dd>
						<dt>{ __( 'Total Blocking Time', 'jetpack-boost' ) }</dt>
						<dd>{ sprintf( '%.2fs', dimensions[ `${ device }_tbt` ] ) }</dd>
						<dt>{ __( 'Cumulative Layout Shift', 'jetpack-boost' ) }</dt>
						<dd>{ sprintf( '%.2f', dimensions[ `${ device }_cls` ] ) }</dd>
					</div>
				) ) }
			</dl>
			{ anchor && (
				<span
					className="jetpack-boost-overview__tooltip-pointer"
					style={ { left: anchorX - left } }
					aria-hidden="true"
				/>
			) }
		</div>
	);
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
	isError,
	error,
	onRetry,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const series = useMemo( () => buildHistorySeries( data ), [ data ] );
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
			if ( ! period || ! data ) {
				return null;
			}
			return (
				<ThemedHistoryTooltip
					series={ series }
					period={ period }
					anchor={ {
						fraction: ( period.timestamp - startDate ) / ( data.endDate - startDate ),
					} }
				/>
			);
		},
		[ data, series, startDate ]
	);
	// Supply text announcements so WordPress does not serialize action components with hooks.
	let content;
	if ( isLoading && ! data?.periods.length ) {
		content = (
			<div className="jetpack-boost-overview__chart-loading">
				<Spinner />
			</div>
		);
	} else if ( isError && ! isLoading ) {
		content = (
			<Notice.Root
				intent="error"
				spokenMessage={ __( 'Failed to load performance history', 'jetpack-boost' ) }
			>
				<Notice.Title>{ __( 'Failed to load performance history', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>{ error?.message }</Notice.Description>
				<Notice.Actions>
					<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-boost' ) }</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( needsUpgrade ) {
		content = (
			<Notice.Root
				intent="info"
				spokenMessage={ __( 'Unlock historical performance', 'jetpack-boost' ) }
			>
				<Notice.Title>{ __( 'Unlock historical performance', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'Upgrade and learn more about your site performance over time.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<UpgradeCTA />
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isFreshStart ) {
		content = (
			<Notice.Root
				intent="success"
				spokenMessage={ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
			>
				<Notice.Title>
					{ __( 'Hello there! Jetpack Boost premium has been activated.', 'jetpack-boost' ) }
				</Notice.Title>
				<Notice.Description>
					{ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<Button onClick={ onDismissFreshStart }>
						{ __( 'Okay, got it!', 'jetpack-boost' ) }
					</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( ! data || ! series.length ) {
		content = (
			<EmptyState.Root>
				<EmptyState.Icon icon={ trendingUp } />
				<EmptyState.Title>{ __( 'No performance history yet', 'jetpack-boost' ) }</EmptyState.Title>
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
			<div className="jetpack-boost-overview__chart-canvas">
				<LineChart
					data={ series }
					height={ 300 }
					margin={ CHART_MARGIN }
					showLegend
					legend={ { position: 'bottom', alignment: 'center', interactive: false } }
					withGradientFill={ false }
					curveType="linear"
					withEndGlyphs={ data.periods.length === 1 }
					renderTooltip={ renderTooltip }
					options={ {
						axis: {
							x: { tickFormat: value => dateI18n( 'M j', new Date( value ), false ) },
						},
						xScale: { domain: [ new Date( startDate ), new Date( data.endDate ) ] },
						yScale: { domain: [ 0, 100 ], nice: false },
					} }
				>
					<LineChart.AnnotationsOverlay>
						{ data.annotations.map( ( annotation, index ) => (
							<LineChart.Annotation
								key={ `${ annotation.timestamp }-${ index }` }
								datum={ { date: new Date( annotation.timestamp ), value: 100 } }
								title={ annotation.text }
								subjectType="line-vertical"
							/>
						) ) }
					</LineChart.AnnotationsOverlay>
				</LineChart>
			</div>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__history-card">
			<Card.Header>
				<Card.Title>{ __( 'Historical performance', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
