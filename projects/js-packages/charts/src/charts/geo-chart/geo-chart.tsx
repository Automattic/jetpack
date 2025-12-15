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
 * Lightens a hex color by blending it with white.
 * Google Charts colorAxis only accepts 6-digit hex colors, not rgba or 8-digit hex.
 *
 * @param hex   - Hex color string (e.g., '#98C8DF')
 * @param blend - Blend amount with white (0 = original color, 1 = white)
 * @return Lightened hex color string (e.g., '#d5e7f2')
 */
function lightenHexColor( hex: string, blend: number ): string {
	const r = parseInt( hex.slice( 1, 3 ), 16 );
	const g = parseInt( hex.slice( 3, 5 ), 16 );
	const b = parseInt( hex.slice( 5, 7 ), 16 );

	// Blend with white (255, 255, 255)
	const newR = Math.round( r + ( 255 - r ) * blend );
	const newG = Math.round( g + ( 255 - g ) * blend );
	const newB = Math.round( b + ( 255 - b ) * blend );

	return `#${ newR.toString( 16 ).padStart( 2, '0' ) }${ newG
		.toString( 16 )
		.padStart( 2, '0' ) }${ newB.toString( 16 ).padStart( 2, '0' ) }`;
}

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
	// Create a lighter version by blending with white (Google Charts only accepts 6-digit hex)
	const isHexColor = /^#[0-9A-F]{6}$/i.test( fullColor );
	const lightColor = isHexColor ? lightenHexColor( fullColor, 0.7 ) : fullColor;

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
