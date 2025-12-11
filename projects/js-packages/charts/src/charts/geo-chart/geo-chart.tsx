/**
 * External dependencies
 */
import { localPoint } from '@visx/event';
import { Mercator, Graticule } from '@visx/geo';
import { scaleLinear } from '@visx/scale';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import clsx from 'clsx';
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

// @ts-expect-error - topojson-client types don't match topology structure
const world = topojson.feature( topology, topology.objects.units ) as {
	type: 'FeatureCollection';
	features: FeatureShape[];
};

/**
 * Renders a geographical chart using Mercator projection to visualize data by country.
 *
 * @param props           - The props for the GeoChart component
 * @param props.data      - Record mapping country IDs to numeric values
 * @param props.width     - Width of the chart in pixels
 * @param props.height    - Height of the chart in pixels
 * @param props.className - Additional CSS class name for the chart container
 * @param props.scale     - Scale factor for the map projection (defaults to fit within bounds)
 * @param props.center    - Geographic center point as [longitude, latitude] for zooming into regions
 * @return A React component displaying an interactive world map with data visualization
 */
const GeoChartInternal: FC< GeoChartProps > = ( {
	className,
	data,
	width,
	height,
	scale,
	center,
} ) => {
	const {
		getElementStyles,
		theme: { geoChart, backgroundColor },
	} = useGlobalChartsContext();
	const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
		useTooltip< TooltipData >();

	// Default scale to fit the world map within the chart bounds
	// Scale is calculated to fit the full 360° longitude span exactly
	const mapScale = scale ?? width / ( 2 * Math.PI );
	// Translation to center the map in the chart
	// Apply vertical offset only when no custom center is defined (for better default world map display)
	const translateX = width / 2;
	const translateY = height / 2 + ( center ? 0 : 50 );

	// Get the max order count to scale the colors
	const maxOrderCount = Math.max( ...Object.values( data ), 1 );

	// Create a color scale using alpha transparency
	const fullColor = getElementStyles( { index: 0 } ).color;
	// Verify it's a hex color before appending alpha
	const isHexColor = /^#[0-9A-F]{6}$/i.test( fullColor );
	const lightColor = isHexColor ? fullColor + '20' : fullColor; // 20% opacity (hex: 33/255)
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
		<div className={ clsx( 'geo-chart', styles.container, className ) }>
			<svg width={ width } height={ height }>
				<rect x={ 0 } y={ 0 } width={ width } height={ height } fill={ backgroundColor } />
				<Mercator< FeatureShape >
					data={ world.features }
					scale={ mapScale }
					translate={ [ translateX, translateY ] }
					center={ center }
				>
					{ mercator => (
						<g>
							{ /* eslint-disable-next-line react/jsx-no-bind */ }
							<Graticule graticule={ g => mercator.path( g ) || '' } stroke="transparent" />
							{ mercator.features.map( ( { feature, path }, i ) => {
								const orderCount = data[ feature.id ] || 0;
								const fillColor =
									orderCount > 0 ? colorScale( orderCount ) : geoChart.featureFillColor;

								return (
									<path
										key={ `map-feature-${ i }` }
										d={ path || '' }
										fill={ fillColor }
										stroke={ backgroundColor }
										strokeWidth={ 0.5 }
										className={ styles.country }
										onMouseMove={ handleMouseMove( feature, orderCount ) }
										onMouseLeave={ handleMouseLeave }
									/>
								);
							} ) }
						</g>
					) }
				</Mercator>
			</svg>

			{ tooltipOpen && tooltipData && (
				<TooltipWithBounds
					left={ tooltipLeft }
					top={ tooltipTop }
					style={ defaultStyles }
					className={ styles.tooltip }
				>
					<div className={ styles.tooltip__content }>
						<strong>{ tooltipData.countryName }</strong>
						<div>Orders: { tooltipData.value }</div>
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
