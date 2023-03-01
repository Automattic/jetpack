import { forwardRef } from '@wordpress/element';
import { getMapProvider } from '../utils';
import MapboxComponent from './mapbox';
import MapkitComponent from './mapkit';

const MapComponent = forwardRef( ( props, ref ) => {
	const mapProvider = getMapProvider();
	if ( mapProvider === 'mapkit' && props.mapStyle !== 'terrain' ) {
		const mapkitProps = { ...props, ref: null };
		return <MapkitComponent { ...mapkitProps } ref={ ref } />;
	}
	return <MapboxComponent { ...props } ref={ ref } />;
} );

export default MapComponent;
