import { Component } from '@wordpress/element';
import { getMapProvider } from '../utils';
import MapboxComponent from './mapbox';
import MapkitComponent from './mapkit';

class MapComponent extends Component {
	render() {
		const props = this.props;
		const mapProvider = getMapProvider();
		if ( mapProvider === 'mapkit' ) {
			return <MapkitComponent { ...props } />;
		}
		return <MapboxComponent { ...props } />;
	}
}

export default MapComponent;
