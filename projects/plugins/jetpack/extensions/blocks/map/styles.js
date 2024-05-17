import { __ } from '@wordpress/i18n';
import blackAndWhiteTheme from './previews/map-theme_black_and_white.jpg';
import blackAndWhiteThemeMapkit from './previews/map-theme_black_and_white_mapkit.jpg';
import defaultTheme from './previews/map-theme_default.jpg';
import defaultThemeMapkit from './previews/map-theme_default_mapkit.jpg';
import satelliteTheme from './previews/map-theme_satellite.jpg';
import satelliteThemeMapkit from './previews/map-theme_satellite_mapkit.jpg';
import terrainTheme from './previews/map-theme_terrain.jpg';
import { getMapProvider } from './utils';

const provider = getMapProvider();

export default [
	{
		name: 'default',
		label: __( 'Basic', 'jetpack' ),
		preview: provider === 'mapkit' ? defaultThemeMapkit : defaultTheme,
		isDefault: true,
	},
	{
		name: 'black_and_white',
		label:
			provider === 'mapkit'
				? __( 'Muted', 'jetpack', /* dummy arg to avoid bad minification */ 0 )
				: __( 'Black & White', 'jetpack' ),
		preview: provider === 'mapkit' ? blackAndWhiteThemeMapkit : blackAndWhiteTheme,
	},
	{
		name: 'satellite',
		label: __( 'Satellite', 'jetpack' ),
		preview: provider === 'mapkit' ? satelliteThemeMapkit : satelliteTheme,
	},
	{
		name: 'terrain',
		label: __( 'Terrain', 'jetpack' ),
		preview: terrainTheme,
	},
];
