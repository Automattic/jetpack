import { forwardRef } from '@wordpress/element';
import MapboxComponent from './mapbox';
import MapkitComponent from './mapkit';

const MapComponent = forwardRef( ( props, ref ) => {
	if ( props.mapProvider === 'mapkit' ) {
		const mapkitProps = { ...props, ref: null };
		return <MapkitComponent { ...mapkitProps } ref={ ref } />;
	}
	return <MapboxComponent { ...props } ref={ ref } />;
} );

export default MapComponent;
