import { getMapProvider } from '../../utils';
import MapboxInfoWindow from './mapbox';
import MapkitInfoWindow from './mapkit';

const InfoWindow = props => {
	const mapProvider = getMapProvider();
	if ( mapProvider === 'mapkit' ) {
		return <MapkitInfoWindow { ...props } />;
	}
	return <MapboxInfoWindow { ...props } />;
};

export default InfoWindow;
