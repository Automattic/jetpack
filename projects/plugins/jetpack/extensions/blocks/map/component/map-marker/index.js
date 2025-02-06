import { Component } from '@wordpress/element';
import { getLoadContext } from '../../../../shared/block-editor-asset-loader';
import { setMarkerHTML } from '../../mapbox-utils';

import './style.scss';

export class MapMarker extends Component {
	componentDidMount() {
		this.renderMarker();
	}
	componentWillUnmount() {
		if ( this.marker ) {
			this.marker.remove();
			this.marker = null;
		}
	}
	componentDidUpdate() {
		this.renderMarker();
	}
	handleClick = () => {
		const { onClick } = this.props;
		onClick( this );
	};
	getPoint = () => {
		const { point } = this.props;
		return [ point.coordinates.longitude, point.coordinates.latitude ];
	};
	renderMarker() {
		const { map, point, mapboxgl, markerColor, mapRef } = this.props;
		const { handleClick } = this;
		const mapboxPoint = [ point.coordinates.longitude, point.coordinates.latitude ];
		const { currentDoc } = getLoadContext( mapRef.current );
		const el = this.marker ? this.marker.getElement() : currentDoc.createElement( 'div' );
		if ( this.marker ) {
			this.marker.setLngLat( mapboxPoint );
		} else {
			el.className = 'wp-block-jetpack-map-marker';
			this.marker = new mapboxgl.Marker( el )
				.setLngLat( mapboxPoint )
				.setOffset( [ 0, -19 ] )
				.addTo( map );

			this.marker.getElement().addEventListener( 'click', handleClick );
		}
		setMarkerHTML( el, markerColor );
	}
	render() {
		return null;
	}
}

MapMarker.defaultProps = {
	point: {},
	map: null,
	markerColor: '#000000',
	mapboxgl: null,
	onClick: () => {},
};

export default MapMarker;
