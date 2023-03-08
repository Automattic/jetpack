import {
	getLoadContext,
	loadBlockEditorAssets,
	waitForObject,
} from '../../../shared/block-editor-asset-loader';
import { debounce } from '../../../shared/debounce';
import editorAssets from '../block-editor-assets.json';
import { mapboxMapFormatter } from '../mapbox-map-formatter/';
import {
	createInfoWindowPopup,
	fitMapToBounds,
	getMapBounds,
	googlePoint2Mapbox,
	setMarkerHTML,
} from '../mapbox-utils';
import resizeMapContainer from '../utils/resize-map-container';

import '../style.scss';
import '../component/map-marker/style.scss';

class MapBoxBlock {
	constructor( root, onError = () => {} ) {
		// Root element for the block.
		this.root = root;

		const { currentDoc, currentWindow } = getLoadContext( this.root );
		this.document = currentDoc;
		this.window = currentWindow;
		this.onError = onError;

		// Block attributes.
		this.mapStyle = this.root.getAttribute( 'data-map-style' ) || 'default';
		this.mapDetails = this.root.getAttribute( 'data-map-details' ) === 'true';
		this.apiKey = this.root.getAttribute( 'data-api-key' ) || null;
		this.scrollToZoom = this.root.getAttribute( 'data-scroll-to-zoom' ) === 'true';
		this.showFullscreenButton = this.root.getAttribute( 'data-show-fullscreen-button' ) === 'true';
		this.points = JSON.parse( this.root.getAttribute( 'data-points' ) || '[]' );
		this.mapCenter = JSON.parse( this.root.getAttribute( 'data-map-center' ) || '{}' );
		this.mapHeight = this.root.getAttribute( 'data-map-height' ) || null;
		this.markerColor = this.root.getAttribute( 'data-marker-color' ) || 'red';
		const zoom = this.root.getAttribute( 'data-zoom' );
		this.zoom = zoom && zoom.length ? parseInt( this.root.getAttribute( 'data-zoom' ), 10 ) : 13;

		this.activeMarker = null;

		// Hide list of markers, if present.
		const markerList = this.root.querySelector( 'ul' );
		if ( markerList ) {
			markerList.style.display = 'none';
		}

		if ( ! this.apiKey || ! this.apiKey.length ) {
			throw new Error( 'API key missing' );
		}
	}

	initDOM() {
		this.root.innerHTML = `<div class="wp-block-jetpack-map__gm-container"></div>`;
		this.container = this.root.querySelector( '.wp-block-jetpack-map__gm-container' );
	}

	loadMapLibraries() {
		return new Promise( resolve => {
			const callbacks = {
				'mapbox-gl-js': () => {
					waitForObject( this.window, 'mapboxgl' ).then( mapboxgl => {
						this.mapboxgl = mapboxgl;
						mapboxgl.accessToken = this.apiKey;
						resolve( mapboxgl );
					} );
				},
			};

			loadBlockEditorAssets( editorAssets, callbacks, this.root );
		} );
	}

	initMap() {
		try {
			this.map = new this.mapboxgl.Map( {
				container: this.container,
				style: mapboxMapFormatter( this.mapStyle, this.mapDetails ),
				center: googlePoint2Mapbox( this.mapCenter ),
				zoom: this.zoom,
				pitchWithRotate: false,
				attributionControl: false,
				dragRotate: false,
			} );
		} catch ( e ) {
			this.onError( 'mapbox_error', e.message );
			return;
		}

		// Disable scroll zooming if not enabled in block options.
		if ( ! this.scrollToZoom ) {
			this.map.scrollZoom.disable();
		}

		if ( this.showFullscreenButton ) {
			this.map.addControl( new this.mapboxgl.FullscreenControl() );
		}

		this.map.on( 'error', e => {
			this.onError( 'mapbox_error', e.error.message );
		} );

		this.zoomControl = new this.mapboxgl.NavigationControl( {
			showCompass: false,
			showZoom: true,
		} );
	}

	initInfoWindow() {
		this.infoWindowContent = this.document.createElement( 'div' );
		this.infoWindow = createInfoWindowPopup( this.mapboxgl );
		this.infoWindow.setDOMContent( this.infoWindowContent );
	}

	setBoundsByMarkers() {
		if ( ! this.map ) {
			return;
		}
		this.map.dragPan.enable();
		// If there are no points at all, there is no data to set bounds to. Abort the function.
		if ( ! this.points.length ) {
			return;
		}
		// If there is an open info window, resizing will probably move the info window which complicates interaction.
		if ( this.activeMarker ) {
			return;
		}

		const bounds = getMapBounds( this.mapboxgl, this.points );

		if ( this.points.length > 1 ) {
			fitMapToBounds( this.map, bounds );
		} else {
			// If there is only one point, center map around it.
			this.map.setCenter( bounds.getCenter() );
			this.map.addControl( this.zoomControl );
		}
	}

	sizeMap = () => {
		resizeMapContainer( this.container, this.mapHeight );
		this.map.resize();
		this.setBoundsByMarkers();
	};

	initMapSize() {
		this.setBoundsByMarkers();
		this.debouncedSizeMap = debounce( this.sizeMap, 250 );
		this.debouncedSizeMap();
	}

	closeInfoWindow = () => {
		this.activeMarker = null;
		this.infoWindow.remove();
	};

	initHandlers() {
		this.map.getCanvas().addEventListener( 'click', this.closeInfoWindow );
		window.addEventListener( 'resize', this.debouncedSizeMap );
	}

	showInfoWindow( marker, point ) {
		const mapboxPoint = [ point.coordinates.longitude, point.coordinates.latitude ];
		this.activeMarker = marker;
		this.infoWindowContent.innerHTML = `<h3></h3><p></p>`;
		this.infoWindowContent.querySelector( 'h3' ).textContent = point.title;
		this.infoWindowContent.querySelector( 'p' ).textContent = point.caption;
		this.infoWindow.setLngLat( mapboxPoint ).addTo( this.map );
	}

	initMarkers() {
		this.points.forEach( point => {
			const mapboxPoint = [ point.coordinates.longitude, point.coordinates.latitude ];
			const el = this.document.createElement( 'div' );
			el.className = 'wp-block-jetpack-map-marker';
			const marker = new this.mapboxgl.Marker( el )
				.setLngLat( mapboxPoint )
				.setOffset( [ 0, -19 ] )
				.addTo( this.map );

			marker.getElement().addEventListener( 'click', () => this.showInfoWindow( marker, point ) );
			setMarkerHTML( el, this.markerColor );
		} );
	}

	async init() {
		this.initDOM();
		await this.loadMapLibraries();
		this.initMap();
		this.initInfoWindow();
		this.initMapSize();
		this.initHandlers();
		this.initMarkers();
	}
}

export default MapBoxBlock;
