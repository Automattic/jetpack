/**
 * External dependencies
 */

import { Component, createPortal } from '@wordpress/element';

export class InfoWindow extends Component {
	componentDidMount() {
		const { maplibregl } = this.props;
		this.el = document.createElement( 'DIV' );
		this.infowindow = new maplibregl.Popup( {
			closeButton: true,
			closeOnClick: false,
			offset: {
				left: [ 0, 0 ],
				top: [ 0, 5 ],
				right: [ 0, 0 ],
				bottom: [ 0, -40 ],
			},
		} );
		this.infowindow.setDOMContent( this.el );
		this.infowindow.on( 'close', this.closeClick );
	}
	componentDidUpdate( prevProps ) {
		if ( this.props.activeMarker !== prevProps.activeMarker ) {
			this.props.activeMarker ? this.openWindow() : this.closeWindow();
		}
	}
	render() {
		// Use React portal to render components directly into the Mapbox info window.
		return this.el ? createPortal( this.props.children, this.el ) : null;
	}
	closeClick = () => {
		this.props.unsetActiveMarker();
	};
	openWindow() {
		const { map, activeMarker } = this.props;
		this.infowindow.setLngLat( activeMarker.getPoint() ).addTo( map );
	}
	closeWindow() {
		this.infowindow.remove();
	}
}

InfoWindow.defaultProps = {
	unsetActiveMarker: () => {},
	activeMarker: null,
	map: null,
	maplibregl: null,
};

export default InfoWindow;
