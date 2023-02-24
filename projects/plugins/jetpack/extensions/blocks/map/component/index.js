import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Component } from '@wordpress/element';
import MapboxComponent from './mapbox';
import MapkitComponent from './mapkit';

class MapComponent extends Component {
	render() {
		const props = this.props;
		if ( isAtomicSite() || isSimpleSite() || window.location.search.includes( 'mapkit' ) ) {
			return <MapkitComponent { ...props } />;
		}
		return <MapboxComponent { ...props } />;
	}
}

export default MapComponent;
