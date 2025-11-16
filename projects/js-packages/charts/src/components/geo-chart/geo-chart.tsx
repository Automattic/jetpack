/**
 * External dependencies
 */
import { localPoint } from '@visx/event';
import { Mercator, Graticule } from '@visx/geo';
import { scaleLinear, scaleSqrt } from '@visx/scale';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import * as topojson from 'topojson-client';
/**
 * Internal dependencies
 */
import { useGlobalChartsTheme } from '../../providers';
import styles from './geo-chart.module.scss';
import topology from './private/world-topo.json';
import { GeoChartProps, FeatureShape, TooltipData, ViewType } from './types';

// @ts-expect-error - topojson-client types don't match topology structure
const world = topojson.feature( topology, topology.objects.units ) as {
	type: 'FeatureCollection';
	features: FeatureShape[];
};

/**
 * Renders a geographical chart using Mercator projection to visualize data by country or city.
 *
 * @param props              - The props for the GeoChart component
 * @param props.data         - Record mapping country IDs to numeric values
 * @param props.citiesData   - Array of city data with coordinates and values
 * @param props.view         - Current view type (countries, regions, or cities)
 * @param props.onViewChange - Callback when view changes
 * @param props.width        - Width of the chart in pixels
 * @param props.height       - Height of the chart in pixels
 * @param props.className    - Additional CSS class name for the chart container
 * @return A React component displaying an interactive world map with data visualization
 */
export default function GeoChart( {
	className,
	data,
	citiesData = [],
	view: controlledView,
	onViewChange,
	width,
	height,
}: GeoChartProps ) {
	const { colors, geoChart, backgroundColor } = useGlobalChartsTheme();
	const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } =
		useTooltip< TooltipData >();

	// Use controlled or uncontrolled view state
	const [ internalView, setInternalView ] = useState< ViewType >( 'countries' );
	const currentView = controlledView || internalView;

	const centerX = width / 2;
	const centerY = height / 2;
	const scale = width * 0.16;

	// Get the max order count to scale the colors
	const maxOrderCount = Math.max( ...Object.values( data ), 1 );

	// Create a color scale using alpha transparency
	const fullColor = colors[ 0 ];
	// Verify it's a hex color before appending alpha
	const isHexColor = /^#[0-9A-F]{6}$/i.test( fullColor );
	const lightColor = isHexColor ? fullColor + '80' : fullColor; // 50% opacity (hex: 128/255)
	const colorScale = scaleLinear( {
		domain: [ 0, maxOrderCount ],
		range: [ lightColor, fullColor ], // 50% to 100% opacity
	} );

	// City bubble radius scale
	const maxCityValue = citiesData.length > 0 ? Math.max( ...citiesData.map( c => c.value ), 1 ) : 1;
	const radiusScale = scaleSqrt( {
		domain: [ 0, maxCityValue ],
		range: [ 3, 20 ], // Min and max pixel radius
	} );

	// Handle view change
	const handleViewChange = useCallback(
		( newView: ViewType ) => {
			if ( onViewChange ) {
				onViewChange( newView );
			} else {
				setInternalView( newView );
			}
		},
		[ onViewChange ]
	);

	const handleCountriesClick = useCallback(
		() => handleViewChange( 'countries' ),
		[ handleViewChange ]
	);
	const handleRegionsClick = useCallback(
		() => handleViewChange( 'regions' ),
		[ handleViewChange ]
	);
	const handleCitiesClick = useCallback( () => handleViewChange( 'cities' ), [ handleViewChange ] );

	// Event handlers for countries
	const handleCountryMouseMove = useCallback(
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

	// Event handlers for cities
	const handleCityMouseMove = useCallback(
		( city: { name: string; id: string; value: number; countryName?: string } ) =>
			( event: React.MouseEvent ) => {
				const point = localPoint( event );
				showTooltip( {
					tooltipLeft: point?.x,
					tooltipTop: point?.y,
					tooltipData: {
						cityName: city.name,
						cityId: city.id,
						countryName: city.countryName,
						value: city.value,
					},
				} );
			},
		[ showTooltip ]
	);

	const handleMouseLeave = useCallback( () => {
		hideTooltip();
	}, [ hideTooltip ] );

	return (
		<div className={ clsx( styles.container, className ) }>
			{ /* View controls tabs */ }
			<div
				className={ styles[ 'view-controls' ] }
				style={
					{
						'--view-controls-border-color': geoChart.viewControlsBorderColor,
						'--view-controls-active-color': geoChart.viewControlsActiveColor,
					} as React.CSSProperties
				}
			>
				<button
					className={ clsx(
						styles[ 'view-tab' ],
						currentView === 'countries' && styles[ 'view-tab--active' ]
					) }
					onClick={ handleCountriesClick }
					aria-label="View countries data"
					aria-pressed={ currentView === 'countries' }
				>
					Countries
				</button>
				<button
					className={ clsx(
						styles[ 'view-tab' ],
						currentView === 'regions' && styles[ 'view-tab--active' ]
					) }
					onClick={ handleRegionsClick }
					aria-label="View regions data"
					aria-pressed={ currentView === 'regions' }
					disabled
					title="Coming soon"
				>
					Regions
				</button>
				<button
					className={ clsx(
						styles[ 'view-tab' ],
						currentView === 'cities' && styles[ 'view-tab--active' ]
					) }
					onClick={ handleCitiesClick }
					aria-label="View cities data"
					aria-pressed={ currentView === 'cities' }
				>
					Cities
				</button>
			</div>

			<svg width={ width } height={ height }>
				<rect
					x={ 0 }
					y={ 0 }
					width={ width }
					height={ height }
					fill={ backgroundColor }
					rx={ 14 }
				/>
				<Mercator< FeatureShape >
					data={ world.features }
					scale={ scale }
					translate={ [ centerX, centerY + 50 ] }
				>
					{ mercator => (
						<g>
							{ /* eslint-disable-next-line react/jsx-no-bind */ }
							<Graticule graticule={ g => mercator.path( g ) || '' } stroke="transparent" />
							{ /* Render country paths */ }
							{ mercator.features.map( ( { feature, path }, i ) => {
								const orderCount = data[ feature.id ] || 0;
								const fillColor =
									orderCount > 0 ? colorScale( orderCount ) : geoChart.countryFillColor;
								const isDimmed = currentView === 'cities';

								return (
									<path
										key={ `map-feature-${ i }` }
										d={ path || '' }
										fill={ fillColor }
										stroke={ backgroundColor }
										strokeWidth={ 0.5 }
										className={ clsx( styles.country, isDimmed && styles[ 'country--dimmed' ] ) }
										style={
											{
												'--country-dimmed-opacity': geoChart.countryDimmedOpacity,
											} as React.CSSProperties
										}
										onMouseMove={ handleCountryMouseMove( feature, orderCount ) }
										onMouseLeave={ handleMouseLeave }
									/>
								);
							} ) }

							{ /* Render city bubbles when in cities view */ }
							{ currentView === 'cities' &&
								citiesData.map( city => {
									// Convert lat/lng to SVG coordinates using Mercator projection
									const coords = mercator.projection( [ city.lng, city.lat ] );
									if ( ! coords ) {
										return null;
									}

									const [ x, y ] = coords;
									const radius = radiusScale( city.value );
									const bubbleColor = colorScale( city.value );

									return (
										<circle
											key={ `city-${ city.id }` }
											cx={ x }
											cy={ y }
											r={ radius }
											fill={ bubbleColor }
											stroke={ geoChart.cityBubbleStroke }
											strokeWidth={ geoChart.cityBubbleStrokeWidth }
											opacity={ geoChart.cityBubbleOpacity }
											className={ styles[ 'city-bubble' ] }
											onMouseMove={ handleCityMouseMove( {
												name: city.name,
												id: city.id,
												value: city.value,
												countryName: city.countryName,
											} ) }
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
						{ tooltipData.cityName ? (
							<>
								<strong>{ tooltipData.cityName }</strong>
								{ tooltipData.countryName && <div>{ tooltipData.countryName }</div> }
								<div>Value: { tooltipData.value }</div>
							</>
						) : (
							<>
								<strong>{ tooltipData.countryName }</strong>
								<div>Value: { tooltipData.value }</div>
							</>
						) }
					</div>
				</TooltipWithBounds>
			) }
		</div>
	);
}
