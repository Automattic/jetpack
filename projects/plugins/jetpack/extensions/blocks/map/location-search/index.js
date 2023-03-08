import MapboxLocationSearch from './mapbox';
import MapkitLocationSearch from './mapkit';

const LocationSearch = props => {
	const LocationSearchComponent =
		props.mapProvider === 'mapbox' ? MapboxLocationSearch : MapkitLocationSearch;
	return <LocationSearchComponent { ...props } />;
};

export default LocationSearch;
