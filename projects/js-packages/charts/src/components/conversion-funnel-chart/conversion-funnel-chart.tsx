import { __experimentalText as Text } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import clsx from 'clsx';
import { type FC, useRef, useMemo } from 'react';
import { useChartTheme } from '../../providers/theme';
import styles from './conversion-funnel-chart.module.scss';
import { useFunnelSelection } from './hooks/use-funnel-selection';
import { hexToRgba } from './utils/color-utils';

/**
 * Represents a single step in the conversion funnel
 */
export interface FunnelStep {
	/** Step identifier */
	id: string;
	/** Display label for the step */
	label: string;
	/** Conversion rate as percentage (0-100) */
	rate: number;
	/** Absolute count (optional, for tooltip/details) */
	count?: number;
}

/**
 * Props for the ConversionFunnelChart component
 */
export interface ConversionFunnelChartProps {
	/** Main conversion rate to highlight */
	mainRate: number;
	/** Change indicator (e.g., +2%, -1.5%) */
	changeIndicator?: string;
	/** Array of funnel steps */
	steps: FunnelStep[];
	/** Whether the chart is in loading state */
	loading?: boolean;
	/** Additional CSS class name */
	className?: string;
	/** Custom styling */
	style?: React.CSSProperties;
}

/**
 * Default settings for ConversionFunnelChart component
 */
const DEFAULT_FUNNEL_SETTINGS = {
	primaryColor: '#4F46E5',
	backgroundColor: '#F3F4F6',
	positiveChangeColor: '#10B981',
	negativeChangeColor: '#EF4444',
} as const;

/**
 * ConversionFunnelChart component displays a conversion funnel with main metric and visualization
 *
 * @param props                 - Component props
 * @param props.mainRate        - Main conversion rate to highlight
 * @param props.changeIndicator - Change indicator (e.g., +2%, -1.5%)
 * @param props.steps           - Array of funnel steps
 * @param props.loading         - Whether the chart is in loading state
 * @param props.className       - Additional CSS class name
 * @param props.style           - Custom styling
 * @return JSX element representing the conversion funnel chart
 */
export const ConversionFunnelChart: FC< ConversionFunnelChartProps > = ( {
	mainRate,
	changeIndicator,
	steps,
	loading = false,
	className,
	style,
} ) => {
	const theme = useChartTheme();
	const chartRef = useRef< HTMLDivElement >( null );

	// Use custom hook for selection management
	const { handleChartClick, handleChartKeyDown, handleBarClick, handleBarKeyDown, getStepState } =
		useFunnelSelection();

	// Create handler factories to avoid arrow functions in JSX
	const stepHandlers = useMemo( () => {
		const handlers: Record<
			string,
			{
				onClick: ( event: React.MouseEvent ) => void;
				onKeyDown: ( event: React.KeyboardEvent ) => void;
			}
		> = {};

		steps.forEach( step => {
			handlers[ step.id ] = {
				onClick: ( event: React.MouseEvent ) => handleBarClick( step.id, event ),
				onKeyDown: ( event: React.KeyboardEvent ) => handleBarKeyDown( step.id, event ),
			};
		} );

		return handlers;
	}, [ steps, handleBarClick, handleBarKeyDown ] );

	// Get component settings from theme with fallbacks
	const funnelSettings = theme.conversionFunnelChart;
	const primaryColor = funnelSettings?.primaryColor || DEFAULT_FUNNEL_SETTINGS.primaryColor;
	const positiveChangeColor =
		funnelSettings?.positiveChangeColor || DEFAULT_FUNNEL_SETTINGS.positiveChangeColor;
	const negativeChangeColor =
		funnelSettings?.negativeChangeColor || DEFAULT_FUNNEL_SETTINGS.negativeChangeColor;

	// Determine change indicator color
	const isPositiveChange = changeIndicator?.startsWith( '+' );
	const changeColor = isPositiveChange ? positiveChangeColor : negativeChangeColor;

	// Create light background version of primary color
	const lightBackgroundColor = hexToRgba( primaryColor, 0.08 );

	const chartStyle = {
		'--primary-color': primaryColor,
		'--light-background-color': lightBackgroundColor,
		'--change-color': changeColor,
		...style,
	} as React.CSSProperties;

	// Handle empty or undefined data
	if ( ! steps || steps.length === 0 ) {
		return (
			<div
				className={ clsx( styles.conversionFunnelChart, loading && styles.loading, className ) }
				style={ chartStyle }
			>
				<div className={ styles.emptyState }>{ loading ? 'Loading...' : 'No data available' }</div>
			</div>
		);
	}

	// Calculate bar heights relative to the maximum (first step)
	const maxRate = Math.max( ...steps.map( step => step.rate ) );

	return (
		<div
			ref={ chartRef }
			className={ clsx( styles.conversionFunnelChart, loading && styles.loading, className ) }
			style={ chartStyle }
			onClick={ handleChartClick }
			onKeyDown={ handleChartKeyDown }
			role="button"
			tabIndex={ 0 }
		>
			{ /* Main Metric */ }
			<div className={ styles.mainMetric }>
				<Text className={ styles.mainRate }>{ mainRate.toFixed( 1 ) }%</Text>
				{ changeIndicator && (
					<Text className={ styles.changeIndicator } style={ { color: changeColor } }>
						{ changeIndicator }
					</Text>
				) }
			</div>

			{ /* Funnel Steps */ }
			<div className={ styles.funnelContainer }>
				{ steps.map( step => {
					const barHeight = ( step.rate / maxRate ) * 100;
					const { isClicked, isBlurred } = getStepState( step.id );

					return (
						<div
							key={ step.id }
							className={ clsx( styles.funnelStep, isBlurred && styles.blurred ) }
						>
							{ /* Step Label and Rate */ }
							<div className={ styles.stepHeader }>
								<Text className={ styles.stepLabel }>{ step.label }</Text>
								<Text className={ styles.stepRate }>{ step.rate.toFixed( 1 ) }%</Text>
							</div>

							{ /* Funnel Bar */ }
							<div
								className={ clsx(
									styles.barContainer,
									isClicked && styles.selected,
									isBlurred && styles.disabled
								) }
								onClick={ stepHandlers[ step.id ].onClick }
								onKeyDown={ stepHandlers[ step.id ].onKeyDown }
								role="button"
								tabIndex={ isBlurred ? -1 : 0 }
							>
								<div
									className={ clsx( styles.funnelBar, isClicked && styles.selected ) }
									style={ {
										height: `${ barHeight }%`,
										backgroundColor: primaryColor,
									} }
								/>

								{ /* Tooltip */ }
								{ isClicked && (
									<div className={ styles.tooltip }>
										<div className={ styles.tooltipContent }>
											<Text className={ styles.tooltipTitle }>{ step.label }</Text>
											<Text className={ styles.tooltipRate }>
												{ step.rate.toFixed( 1 ) }%
												{ step.count && ` • ${ step.count.toLocaleString() } items` }
											</Text>
										</div>
									</div>
								) }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
};

export default ConversionFunnelChart;
