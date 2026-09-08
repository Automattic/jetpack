import { GlobalChartsProvider, LineChart, useGlobalChartsContext } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner, VisuallyHidden } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import { Button, Card, EmptyState, Notice } from '@wordpress/ui';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from '@wordpress/element';
import UpgradeCTA from './upgrade-cta';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { DataPointDate, SeriesData } from '@automattic/charts';
import type { ComponentProps, CSSProperties } from 'react';

type ChartMargin = { left: number; right: number; bottom: number };
type TooltipAnchor = { fraction: number; margin: ChartMargin };
type DeviceColors = { desktop?: string; mobile?: string };

type History = NonNullable< PerformanceHistoryData >;
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

function readStyleNumber( styles: CSSStyleDeclaration, property: string ): number | undefined {
	const value = parseFloat( styles.getPropertyValue( property ) );
	return Number.isFinite( value ) ? value : undefined;
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
	const anchorRef = useRef< HTMLDivElement >( null );
	const [ origin, setOrigin ] = useState( { left: 0, top: 0 } );
	const [ width, setWidth ] = useState( 0 );
	const [ plotWidth, setPlotWidth ] = useState( 0 );
	const [ edgeGap, setEdgeGap ] = useState( 0 );
	const isAnchored = anchor !== undefined;
	useLayoutEffect( () => {
		const element = tooltipRef.current;
		if ( ! element || ! isAnchored ) {
			return;
		}
		const marker = anchorRef.current;
		const plot = marker?.offsetParent;
		const measure = () => {
			setWidth( element.getBoundingClientRect().width );
			setPlotWidth( plot?.clientWidth ?? 0 );
			const rect = marker?.getBoundingClientRect();
			if ( rect ) {
				setOrigin( previous =>
					previous.left === rect.left && previous.top === rect.top
						? previous
						: { left: rect.left, top: rect.top }
				);
			}
			setEdgeGap(
				readStyleNumber(
					getComputedStyle( marker ?? element ),
					'--jetpack-boost-overview-chart-edge-gap'
				) ?? 0
			);
		};
		measure();
		const observer = new ResizeObserver( measure );
		observer.observe( element );
		if ( plot ) {
			observer.observe( plot );
		}
		window.addEventListener( 'scroll', measure, true );
		window.addEventListener( 'resize', measure );
		return () => {
			observer.disconnect();
			window.removeEventListener( 'scroll', measure, true );
			window.removeEventListener( 'resize', measure );
		};
	}, [ isAnchored ] );
	const anchorX =
		( anchor?.margin.left ?? 0 ) +
		( anchor?.fraction ?? 0 ) *
			( plotWidth - ( anchor?.margin.left ?? 0 ) - ( anchor?.margin.right ?? 0 ) );
	const left = anchor
		? Math.max( edgeGap, Math.min( anchorX - width / 2, plotWidth - width - edgeGap ) )
		: 0;
	const dimensions = period.dimensions;
	const content = (
		<>
			<div className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', new Date( period.timestamp ), false ) }
			</div>
			<dl>
				<div className="jetpack-boost-overview__tooltip-section">
					<dt>{ __( 'Overall score', 'jetpack-boost' ) }</dt>
					<dd>
						{ getScoreLetter( dimensions.mobile_overall_score, dimensions.desktop_overall_score ) }
					</dd>
				</div>
				{ ( [ 'desktop', 'mobile' ] as const ).map( device => (
					<div key={ device } className="jetpack-boost-overview__tooltip-section">
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
					</div>
				) ) }
			</dl>
		</>
	);
	const tooltip = (
		<div
			ref={ tooltipRef }
			aria-hidden={ isAnchored || undefined }
			className="jetpack-boost-overview__history-tooltip"
			style={
				anchor
					? {
							position: 'fixed',
							left: origin.left + left,
							top: origin.top,
							maxInlineSize: plotWidth ? plotWidth - 2 * edgeGap : undefined,
					  }
					: undefined
			}
		>
			{ content }
			{ anchor && (
				<span
					className="jetpack-boost-overview__tooltip-pointer"
					style={ { left: anchorX - left } }
					aria-hidden="true"
				/>
			) }
		</div>
	);
	return anchor ? (
		<>
			<div
				ref={ anchorRef }
				style={ {
					position: 'absolute',
					left: 0,
					top: 'calc(100% - var(--wpds-dimension-size-md))',
				} }
			/>
			<VisuallyHidden>{ content }</VisuallyHidden>
			{ createPortal( tooltip, document.body ) }
		</>
	) : (
		tooltip
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
	isVisible = true,
	isError,
	error,
	onRetry,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const series = useMemo( () => buildHistorySeries( data ), [ data ] );
	const [ chartMargin, setChartMargin ] = useState< ChartMargin >();
	const [ chartWidth, setChartWidth ] = useState( 0 );
	const [ chartKey, setChartKey ] = useState( 0 );
	const cardRef = useRef< HTMLDivElement >( null );
	useLayoutEffect( () => {
		const node = cardRef.current;
		if ( ! node ) {
			return;
		}
		const measure = () => {
			const styles = getComputedStyle( node );
			const padding = readStyleNumber( styles, '--jetpack-boost-overview-chart-padding' ) ?? 0;
			setChartWidth( Math.max( 0, node.clientWidth - 2 * padding ) );
			const left = readStyleNumber( styles, '--jetpack-boost-overview-chart-margin-left' );
			const right = readStyleNumber( styles, '--jetpack-boost-overview-chart-margin-right' );
			const bottom = readStyleNumber( styles, '--jetpack-boost-overview-chart-margin-bottom' );
			if ( left !== undefined && right !== undefined && bottom !== undefined ) {
				setChartMargin( { left, right, bottom } );
			}
		};
		measure();
		const observer = new ResizeObserver( measure );
		observer.observe( node );
		return () => observer.disconnect();
	}, [] );
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
			if ( ! period || ! data || ! chartMargin ) {
				return null;
			}
			return (
				<ThemedHistoryTooltip
					series={ series }
					period={ period }
					anchor={ {
						fraction: ( period.timestamp - startDate ) / ( data.endDate - startDate ),
						margin: chartMargin,
					} }
				/>
			);
		},
		[ data, series, startDate, chartMargin ]
	);
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
					style={
						{
							'--jetpack-boost-overview-hover-column-width': `${
								( chartWidth - ( chartMargin?.left ?? 0 ) - ( chartMargin?.right ?? 0 ) ) *
								Math.min( 1, ( 24 * 60 * 60 * 1000 ) / ( data.endDate - startDate ) )
							}px`,
						} as CSSProperties
					}
				>
					{ isVisible && (
						<LineChart
							key={ chartKey }
							data={ series }
							margin={ chartMargin }
							showLegend
							legend={ { position: 'bottom', alignment: 'center', interactive: false } }
							withGradientFill={ false }
							withTooltipCrosshairs={ { showVertical: true } }
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
								{ data.annotations
									.filter(
										annotation =>
											annotation.timestamp >= startDate && annotation.timestamp <= data.endDate
									)
									.map( ( annotation, index ) => (
										<LineChart.Annotation
											key={ `${ annotation.timestamp }-${ index }` }
											datum={ { date: new Date( annotation.timestamp ), value: 100 } }
											title={ annotation.text }
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
		<Card.Root ref={ cardRef } className="jetpack-boost-overview__history-card">
			<Card.Header>
				<Card.Title>{ __( 'Historical performance', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
