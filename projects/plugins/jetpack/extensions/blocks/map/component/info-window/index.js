import MapboxInfoWindow from './mapbox';
import MapkitInfoWindow from './mapkit';

const InfoWindow = props => {
	if ( props.mapProvider === 'mapkit' ) {
		return <MapkitInfoWindow { ...props } />;
	}
	return <MapboxInfoWindow { ...props } />;
};

export default InfoWindow;
