/**
 * External dependencies
 */
import { localPoint } from '@visx/event';
import { CustomProjection, Graticule } from '@visx/geo';
import { scaleLinear } from '@visx/scale';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import clsx from 'clsx';
import { geoNaturalEarth1 } from 'd3-geo';
import { FC, useCallback, useContext } from 'react';
import * as topojson from 'topojson-client';
/**
 * Internal dependencies
 */
import { GlobalChartsContext, GlobalChartsProvider, useGlobalChartsContext } from '../../providers';
import { withResponsive } from '../private/with-responsive';
import styles from './geo-chart.module.scss';
import topology from './private/world-topo.json';
import { GeoChartProps, FeatureShape, TooltipData } from './types';

// Cast through unknown to satisfy topojson-client's strict typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = topojson.feature( topology as any, topology.objects.units as any ) as unknown as {
	type: 'FeatureCollection';
	features: FeatureShape[];
};

// Filter out Antarctica as it won't have any data
const worldFeatures = world.features.filter( feature => feature.id !== 'ATA' );

/**
 * Renders a geographical chart using Natural Earth projection to visualize data by country.
 *
 * @param props           - The props for the GeoChart component
 * @param props.data      - Record mapping country IDs to numeric values
 * @param props.width     - Width of the chart in pixels
 * @param props.height    - Height of the chart in pixels
 * @param props.className - Additional CSS class name for the chart container
 * @param props.scale     - Scale factor for the map projection (defaults to fit within bounds)
 * @return A React component displaying an interactive world map with data visualization
 */
const GeoChartInternal: FC< GeoChartProps > = ( { className, data, width, height, scale } ) => {
	const {
		getElementStyles,
		theme: { geoChart, backgroundColor },
	} = useGlobalChartsContext();
	const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
		useTooltip< TooltipData >();

	// Default scale to fit the world map within the chart bounds
	// Natural Earth projection uses a scale factor approximately 180/π for width
	// Scale increased slightly since Antarctica is excluded
	const mapScale = scale ?? width / 5;
	// Translation to center the map in the chart
	// X and Y offset adjusted to account for excluded Antarctica, shifting the map down and left
	const translateX = width * 0.46;
	const translateY = height * 0.58;

	// Get the max order count to scale the colors
	const maxOrderCount = Math.max( ...Object.values( data ), 1 );

	// Create a color scale using alpha transparency
	const fullColor = getElementStyles( { index: 0 } ).color;
	// Verify it's a hex color before appending alpha
	const isHexColor = /^#[0-9A-F]{6}$/i.test( fullColor );
	const lightColor = isHexColor ? fullColor + '20' : fullColor; // ~12.5% opacity (hex: 32/255)
	const colorScale = scaleLinear( {
		domain: [ 0, maxOrderCount ],
		range: [ lightColor, fullColor ], // Transparent to full opacity
	} );

	// Event handlers
	const handleMouseMove = useCallback(
		( feature: FeatureShape, orderCount: number ) => ( event: React.MouseEvent ) => {
			const point = localPoint( event );
			showTooltip( {
				tooltipLeft: point?.x,
				tooltipTop: point?.y,
				tooltipData: {
					countryName: feature.properties.name,
					countryId: feature.id,
					value: orderCount,
				},
			} );
		},
		[ showTooltip ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	return (
		<div className={ clsx( 'geo-chart', styles.container, className ) } data-testid="geo-chart">
			<svg width={ width } height={ height } data-testid="geo-chart-svg">
				<rect x={ 0 } y={ 0 } width={ width } height={ height } fill={ backgroundColor } />
				<CustomProjection< FeatureShape >
					data={ worldFeatures }
					projection={ geoNaturalEarth1 }
					scale={ mapScale }
					translate={ [ translateX, translateY ] }
				>
					{ projection => (
						<g>
							{ /* eslint-disable-next-line react/jsx-no-bind */ }
							<Graticule graticule={ g => projection.path( g ) || '' } stroke="transparent" />
							{ projection.features.map( ( { feature, path }, i ) => {
								const orderCount = data[ feature.id ] || 0;
								const fillColor =
									orderCount > 0 ? colorScale( orderCount ) : geoChart.featureFillColor;

								return (
									<path
										key={ `geo-chart-feature-${ i }` }
										d={ path || '' }
										fill={ fillColor }
										stroke={ backgroundColor }
										strokeWidth={ 0.5 }
										className={ styles.country }
										data-testid={ `geo-chart-country-${ feature.id }` }
										onMouseMove={ handleMouseMove( feature, orderCount ) }
										onMouseLeave={ handleMouseLeave }
									/>
								);
							} ) }
						</g>
					) }
				</CustomProjection>
			</svg>

			{ tooltipOpen && tooltipData && (
				<TooltipWithBounds
					left={ tooltipLeft }
					top={ tooltipTop }
					style={ defaultStyles }
					className={ styles.tooltip }
				>
					<div className={ styles.tooltip__content } data-testid="geo-chart-tooltip">
						<strong>{ tooltipData.countryName }</strong>
						<div>{ tooltipData.value }</div>
					</div>
				</TooltipWithBounds>
			) }
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
