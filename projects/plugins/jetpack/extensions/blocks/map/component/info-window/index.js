import { getMapProvider } from '../../utils';
import MapboxComponent from './mapbox';
import MapkitComponent from './mapkit';

const MapComponent = props => {
	const mapProvider = getMapProvider();
	if ( mapProvider === 'mapkit' ) {
		return <MapkitComponent { ...props } />;
	}
	return <MapboxComponent { ...props } />;
};

export default MapComponent;
