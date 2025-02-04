import { curveCatmullRom, curveLinear } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import {
	XYChart,
	AnimatedAreaSeries,
	AnimatedAxis,
	AnimatedGrid,
	Tooltip,
	buildChartTheme,
} from '@visx/xychart';
import clsx from 'clsx';
import { FC, useMemo } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { withResponsive } from '../shared/with-responsive';
import styles from './line-chart.module.scss';
import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	withGradientFill: boolean;
	smoothing?: boolean;
}

type TooltipData = {
	date: Date;
	[ key: string ]: number | Date;
};

type TooltipDatum = {
	key: string;
	value: number;
};

const renderTooltip = ( {
	tooltipData,
}: {
	tooltipData?: {
		nearestDatum?: {
			datum: TooltipData;
			key: string;
		};
		datumByKey?: { [ key: string ]: { datum: TooltipData } };
	};
} ) => {
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: TooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-date' ] }>
				{ nearestDatum.date.toLocaleDateString() }
			</div>
			{ tooltipPoints.map( point => (
				<div key={ point.key } className={ styles[ 'line-chart__tooltip-row' ] }>
					<span className={ styles[ 'line-chart__tooltip-label' ] }>{ point.key }:</span>
					<span className={ styles[ 'line-chart__tooltip-value' ] }>{ point.value }</span>
				</div>
			) ) }
		</div>
	);
};

const formatDateTick = ( value: number ) => {
	const date = new Date( value );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				isNaN( point.date.getTime() )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

const LineChart: FC< LineChartProps > = ( {
	data,
	width,
	height,
	className,
	margin,
	withTooltips = true,
	showLegend = false,
	legendOrientation = 'horizontal',
	withGradientFill = false,
	smoothing = true,
	options = {},
} ) => {
	const providerTheme = useChartTheme();

	const theme = useMemo( () => {
		const seriesColors =
			data?.map( series => series.options?.stroke ?? '' ).filter( Boolean ) ?? [];
		return buildChartTheme( {
			...providerTheme,
			colors: [ ...seriesColors, ...providerTheme.colors ],
		} );
	}, [ providerTheme, data ] );

	margin = useMemo( () => {
		// Auto-margin unless specified to make room for axis labels.
		// Default margin is for bottom and left axis labels.
		let defaultMargin = {};
		if ( options.axis?.y?.orientation === 'right' ) {
			defaultMargin = { ...defaultMargin, right: 40, left: 0 };
		}
		if ( options.axis?.x?.orientation === 'top' ) {
			defaultMargin = { ...defaultMargin, top: 40, bottom: 0 };
		}
		// Merge default margin with user-specified margin.
		return { ...defaultMargin, ...margin };
	}, [ margin, options ] );

	const error = validateData( data );
	if ( error ) {
		return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = data.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: providerTheme.colors[ index % providerTheme.colors.length ],
	} ) );

	const accessors = {
		xAccessor: ( d: DataPointDate ) => d.date,
		yAccessor: ( d: DataPointDate ) => d.value,
	};

	return (
		<div
			className={ clsx( 'line-chart', styles[ 'line-chart' ], className ) }
			data-testid="line-chart"
			role="img"
			aria-label="line chart"
		>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height }
				margin={ { top: 0, right: 0, bottom: 0, left: 0, ...margin } }
				xScale={ { type: 'time', ...options?.xScale } }
				yScale={ { type: 'linear', nice: true, zero: false, ...options?.yScale } }
			>
				<AnimatedGrid columns={ false } numTicks={ 4 } />
				<AnimatedAxis
					orientation="bottom"
					numTicks={ 5 }
					tickFormat={ formatDateTick }
					{ ...options?.axis?.x }
				/>
				<AnimatedAxis orientation="left" numTicks={ 4 } { ...options?.axis?.y } />

				{ data.map( ( seriesData, index ) => {
					const stroke = seriesData.options?.stroke ?? theme.colors[ index % theme.colors.length ];
					return (
						<g key={ seriesData?.label || index }>
							{ withGradientFill && (
								<LinearGradient
									id={ `area-gradient-${ index + 1 }` }
									from={ stroke }
									to="white"
									toOpacity={ 0.1 }
									{ ...seriesData.options?.gradient }
									data-testid="line-gradient"
								/>
							) }
							<AnimatedAreaSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								{ ...accessors }
								fill={ withGradientFill ? `url(#area-gradient-${ index + 1 })` : undefined }
								renderLine={ true }
								curve={ smoothing ? curveCatmullRom : curveLinear }
							/>
						</g>
					);
				} ) }

				{ withTooltips && (
					<Tooltip
						snapTooltipToDatumX
						snapTooltipToDatumY
						showSeriesGlyphs
						renderTooltip={ renderTooltip }
					/>
				) }
			</XYChart>

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					className={ styles[ 'line-chart-legend' ] }
				/>
			) }
		</div>
	);
};

export default withResponsive< LineChartProps >( LineChart );
