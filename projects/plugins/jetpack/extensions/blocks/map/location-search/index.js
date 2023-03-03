import { getMapProvider } from '../utils';
import MapboxLocationSearch from './mapbox';
import MapkitLocationSearch from './mapkit';

const LocationSearch = props => {
	const provider = getMapProvider();
	const LocationSearchComponent =
		provider === 'mapbox' ? MapboxLocationSearch : MapkitLocationSearch;
	return <LocationSearchComponent { ...props } />;
};

export default LocationSearch;
