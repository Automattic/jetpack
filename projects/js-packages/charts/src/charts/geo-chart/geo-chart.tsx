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
import { lightenHexColor, normalizeColorToHex } from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { withResponsive } from '../private/with-responsive';
import styles from './geo-chart.module.scss';
import { GeoChartProps } from './types';

const DEFAULT_FEATURE_FILL_COLOR = '#ffffff';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';

/**
 * Renders a geographical chart using Google Charts GeoChart to visualize data by country.
 *
 * Supports the full Google Charts data format including custom tooltips, formatted values,
 * and multiple data columns for maximum flexibility.
 *
 * Countries can be identified by full name (e.g., 'United States') or ISO 3166-1 alpha-2
 * codes (e.g., 'US'). Full country names are recommended for better readability.
 *
 * @param props                   - The props for the GeoChart component
 * @param props.data              - Data in Google Charts format (array of arrays with headers)
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

	// Google charts doesn't accept CSS variables, so we need to convert them to hex colors
	const fullColorHex = getElementStyles( { index: 0 } ).color;
	const lightColorHex = lightenHexColor( fullColorHex, 0.8 );
	// Use normalizeColorToHex to ensure HSL/RGB values from CSS variables are converted to hex
	const backgroundColorHex =
		normalizeColorToHex( backgroundColor, null, resolveCssVariable ) || DEFAULT_BACKGROUND_COLOR;
	const defaultFillColorHex =
		normalizeColorToHex( featureFillColor, null, resolveCssVariable ) || DEFAULT_FEATURE_FILL_COLOR;

	const options: GoogleChartOptions = {
		colorAxis: { colors: [ lightColorHex, fullColorHex ] },
		backgroundColor: backgroundColorHex,
		datalessRegionColor: defaultFillColorHex,
		defaultColor: defaultFillColorHex,
		tooltip: { trigger: 'focus' },
		legend: 'none',
		keepAspectRatio: true,
	};

	return (
		<div
			className={ clsx( 'geo-chart', styles.container, className ) }
			data-testid="geo-chart"
			style={ { width, height, backgroundColor } }
		>
			<Chart
				chartType="GeoChart"
				width={ width }
				height={ height }
				data={ data }
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
