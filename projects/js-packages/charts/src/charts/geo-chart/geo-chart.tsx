/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FC, useContext, useMemo } from 'react';
import { Chart } from 'react-google-charts';
/**
 * Internal dependencies
 */
import { GlobalChartsContext, GlobalChartsProvider, useGlobalChartsContext } from '../../providers';
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
		theme: { geoChart, backgroundColor },
	} = useGlobalChartsContext();

	// Transform data from Record<string, number> to Google Charts format
	// Google Charts expects [['Country', 'Value'], ['USA', 100], ['CAN', 50], ...]
	const chartData = useMemo( () => {
		const rows = Object.entries( data ).map( ( [ countryCode, value ] ) => [ countryCode, value ] );
		return [ [ 'Country', 'Value' ], ...rows ];
	}, [ data ] );

	// Get theme colors for the color axis
	const fullColor = getElementStyles( { index: 0 } ).color;
	// Verify it's a hex color before appending alpha
	const isHexColor = /^#[0-9A-F]{6}$/i.test( fullColor );
	const lightColor = isHexColor ? fullColor + '33' : fullColor; // ~20% opacity

	// Google Charts options
	const options = useMemo(
		() => ( {
			colorAxis: { colors: [ lightColor, fullColor ] },
			backgroundColor,
			datalessRegionColor: geoChart.featureFillColor,
			defaultColor: geoChart.featureFillColor,
			tooltip: { trigger: 'focus' },
			legend: 'none',
			keepAspectRatio: false,
		} ),
		[ lightColor, fullColor, backgroundColor, geoChart.featureFillColor ]
	);

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
