/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FC, useContext } from 'react';
import { Chart, type GoogleChartOptions } from 'react-google-charts';
/**
 * Internal dependencies
 */
import { GlobalChartsContext, GlobalChartsProvider, useGlobalChartsContext } from '../../providers';
import { isValidHexColor, lightenHexColor } from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { withResponsive } from '../private/with-responsive';
import styles from './geo-chart.module.scss';
import { GeoChartProps } from './types';

/**
 * Renders a geographical chart using Google Charts GeoChart to visualize data by country.
 *
 * @param props                   - The props for the GeoChart component
 * @param props.data              - Record mapping country IDs to numeric values
 * @param props.width             - Width of the chart in pixels
 * @param props.height            - Height of the chart in pixels
 * @param props.className         - Additional CSS class name for the chart container
 * @param props.renderPlaceholder - Optional render function for the loading placeholder
 * @return A React component displaying an interactive world map with data visualization
 */
const GeoChartInternal: FC< GeoChartProps > = ( {
	className,
	data,
	width,
	height,
	renderPlaceholder,
} ) => {
	const {
		getElementStyles,
		theme: {
			geoChart: { featureFillColor },
			backgroundColor,
		},
	} = useGlobalChartsContext();

	// Render loading placeholder
	const loadingPlaceholder = (
		<div
			className={ clsx( 'geo-chart', styles.container, className ) }
			data-testid="geo-chart-loading"
			style={ { width, height } }
		>
			{ renderPlaceholder ? renderPlaceholder() : __( 'Loading map', 'jetpack-charts' ) }
		</div>
	);

	const fullColor = getElementStyles( { index: 0 } ).color;

	// Wait for color cache to be populated before rendering
	if ( ! isValidHexColor( fullColor ) ) {
		return loadingPlaceholder;
	}

	const lightColor = lightenHexColor( fullColor, 0.8 );
	const defaultColor = resolveCssVariable( featureFillColor ) ?? '#ffffff';

	// Transform data from Record<string, number> to Google Charts format
	// Google Charts expects [['Country', 'Value'], ['US', 100], ['CA', 50], ...]
	// Country codes must be ISO 3166-1 alpha-2 format (2-letter codes)
	const chartData = [ [ 'Country', 'Value' ], ...Object.entries( data ) ];

	const options: GoogleChartOptions = {
		colorAxis: { colors: [ lightColor, fullColor ] },
		backgroundColor,
		datalessRegionColor: defaultColor,
		defaultColor,
		tooltip: { trigger: 'focus' },
		legend: 'none',
		keepAspectRatio: true,
	};

	return (
		<div className={ clsx( 'geo-chart', styles.container, className ) } data-testid="geo-chart">
			<Chart
				chartType="GeoChart"
				width={ width }
				height={ height }
				data={ chartData }
				options={ options }
				loader={ loadingPlaceholder }
			/>
		</div>
	);
};

const GeoChartWithProvider: FC< GeoChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <GeoChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<GeoChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

GeoChartWithProvider.displayName = 'GeoChart';

const GeoChartResponsive = withResponsive< GeoChartProps >( GeoChartWithProvider );

export { GeoChartResponsive as default, GeoChartWithProvider as GeoChartUnresponsive };
