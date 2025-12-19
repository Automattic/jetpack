/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FC, useContext, useMemo } from 'react';
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
 * Renders a geographical chart using Google Charts GeoChart to visualize data.
 *
 * Supports the full Google Charts data format including custom tooltips, formatted values,
 * and multiple data columns for maximum flexibility.
 *
 * Locations can be identified by full name (e.g., 'United States', 'California') or codes
 * (e.g., 'US', 'US-CA'). Full names are recommended for better readability in tooltips.
 *
 * @param props                   - The props for the GeoChart component
 * @param props.data              - Data in Google Charts format (array of arrays with headers)
 * @param props.width             - Width of the chart in pixels
 * @param props.height            - Height of the chart in pixels
 * @param props.region            - Region to display ('world', 'US', or ISO 3166-1 alpha-2 code)
 * @param props.resolution        - Resolution level ('countries', 'provinces', or 'metros')
 * @param props.className         - Additional CSS class name for the chart container
 * @param props.renderPlaceholder - Optional render function for the loading placeholder
 * @return A React component displaying an interactive map with data visualization
 */
const GeoChartInternal: FC< GeoChartProps > = ( {
	className,
	data,
	width,
	height,
	region = 'world',
	resolution = 'countries',
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

	// Check if data has HTML tooltips (column with role: 'tooltip' and p.html: true)
	const hasHtmlTooltips = useMemo(
		() =>
			data.length > 0 &&
			data[ 0 ].some(
				col =>
					typeof col === 'object' &&
					col !== null &&
					'role' in col &&
					col.role === 'tooltip' &&
					'p' in col &&
					typeof col.p === 'object' &&
					col.p !== null &&
					'html' in col.p &&
					col.p.html === true
			),
		[ data ]
	);

	const options: GoogleChartOptions = useMemo(
		() => ( {
			...( region !== 'world' && { region } ),
			...( resolution !== 'countries' && { resolution } ),
			colorAxis: { colors: [ lightColorHex, fullColorHex ] },
			backgroundColor: backgroundColorHex,
			datalessRegionColor: defaultFillColorHex,
			defaultColor: defaultFillColorHex,
			tooltip: { trigger: 'focus', isHtml: hasHtmlTooltips },
			legend: 'none',
			keepAspectRatio: true,
		} ),
		[
			region,
			resolution,
			lightColorHex,
			fullColorHex,
			backgroundColorHex,
			defaultFillColorHex,
			hasHtmlTooltips,
		]
	);

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
