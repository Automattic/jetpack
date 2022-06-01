import { Button, Dashicon, TextareaControl, TextControl } from '@wordpress/components';
import { Children, Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { assign, debounce, get } from 'lodash';
import {
	getLoadContext,
	loadBlockEditorAssets,
	waitForObject,
} from '../../shared/block-editor-asset-loader';
import editorAssets from './block-editor-assets.json';
import InfoWindow from './info-window/';
import MapMarker from './map-marker/';
import { mapboxMapFormatter } from './mapbox-map-formatter/';
export class Map extends Component {
	// Lifecycle
	constructor() {
		super( ...arguments );

		this.state = {
			map: null,
			fit_to_bounds: false,
			loaded: false,
			mapboxgl: null,
		};

		// Refs
		this.mapRef = createRef();

		// Debouncers
		this.debouncedSizeMap = debounce( this.sizeMap, 250 );
	}
	render() {
		const { points, admin, children, markerColor } = this.props;
		const { map, activeMarker, mapboxgl } = this.state;
		const { onMarkerClick, deleteActiveMarker, updateActiveMarker } = this;
		const currentPoint = get( activeMarker, 'props.point' ) || {};
		const { title, caption } = currentPoint;
		const addPoint = Children.map( children, child => {
			const tagName = get( child, 'props.tagName' );
			if ( 'AddPoint' === tagName ) {
				return child;
			}
		} );
		const mapMarkers =
			map &&
			mapboxgl &&
			points.map( ( point, index ) => {
				return (
					<MapMarker
						mapRef={ this.mapRef }
						key={ index }
						point={ point }
						index={ index }
						map={ map }
						mapboxgl={ mapboxgl }
						markerColor={ markerColor }
						onClick={ onMarkerClick }
					/>
				);
			} );
		const infoWindow = mapboxgl && (
			<InfoWindow
				activeMarker={ activeMarker }
				map={ map }
				mapboxgl={ mapboxgl }
				unsetActiveMarker={ () => this.setState( { activeMarker: null } ) }
			>
				{ activeMarker && admin && (
					<Fragment>
						<TextControl
							label={ __( 'Marker Title', 'jetpack' ) }
							value={ title }
							onChange={ value => updateActiveMarker( { title: value } ) }
						/>
						<TextareaControl
							className="wp-block-jetpack-map__marker-caption"
							label={ __( 'Marker Caption', 'jetpack' ) }
							value={ caption }
							rows="2"
							tag="textarea"
							onChange={ value => updateActiveMarker( { caption: value } ) }
						/>
						<Button onClick={ deleteActiveMarker } className="wp-block-jetpack-map__delete-btn">
							<Dashicon icon="trash" size="15" /> { __( 'Delete Marker', 'jetpack' ) }
						</Button>
					</Fragment>
				) }

				{ activeMarker && ! admin && (
					<Fragment>
						<h3>{ title }</h3>
						<p>{ caption }</p>
					</Fragment>
				) }
			</InfoWindow>
		);
		return (
			<Fragment>
				<div className="wp-block-jetpack-map__gm-container" ref={ this.mapRef }>
					{ mapMarkers }
				</div>
				{ infoWindow }
				{ addPoint }
			</Fragment>
		);
	}
	componentDidMount() {
		const { apiKey } = this.props;
		if ( apiKey ) {
			this.loadMapLibraries();
		}
	}
	componentWillUnmount() {
		this.debouncedSizeMap.cancel();
		window.removeEventListener( 'resize', this.debouncedSizeMap );
	}
	componentDidUpdate( prevProps ) {
		const {
			admin,
			apiKey,
			children,
			points,
			mapStyle,
			mapDetails,
			scrollToZoom,
			showFullscreenButton,
		} = this.props;
		const { map, fullscreenControl } = this.state;
		if ( apiKey && apiKey.length > 0 && apiKey !== prevProps.apiKey ) {
			this.loadMapLibraries();
		}
		// If the user has just clicked to show the Add Point component, hide info window.
		// AddPoint is the only possible child.
		if ( children !== prevProps.children && children !== false ) {
			this.clearCurrentMarker();
		}
		if ( points !== prevProps.points ) {
			this.setBoundsByMarkers();
		}
		if ( points.length !== prevProps.points.length ) {
			this.clearCurrentMarker();
		}
		if ( mapStyle !== prevProps.mapStyle || mapDetails !== prevProps.mapDetails ) {
			map.setStyle( this.getMapStyle() );
		}

		// Only allow scroll zooming when the `scrollToZoom` is set.
		if ( scrollToZoom !== prevProps.scrollToZoom ) {
			if ( scrollToZoom ) {
				map.scrollZoom.enable();
			} else {
				map.scrollZoom.disable();
			}
		}
		if ( showFullscreenButton !== prevProps.showFullscreenButton ) {
			if ( showFullscreenButton ) {
				map.addControl( fullscreenControl );
				if ( admin && fullscreenControl._fullscreenButton ) {
					fullscreenControl._fullscreenButton.disabled = true;
				}
			} else {
				map.removeControl( fullscreenControl );
			}
		}
	}
	/* Event handling */
	onMarkerClick = marker => {
		const { onMarkerClick } = this.props;
		this.setState( { activeMarker: marker } );
		onMarkerClick();
	};
	onMapClick = () => {
		this.setState( { activeMarker: null } );
	};
	clearCurrentMarker = () => {
		this.setState( { activeMarker: null } );
	};
	updateActiveMarker = updates => {
		const { points } = this.props;
		const { activeMarker } = this.state;
		const { index } = activeMarker.props;
		const newPoints = points.slice( 0 );

		assign( newPoints[ index ], updates );
		this.props.onSetPoints( newPoints );
	};
	deleteActiveMarker = () => {
		const { points } = this.props;
		const { activeMarker } = this.state;
		const { index } = activeMarker.props;
		const newPoints = points.slice( 0 );

		newPoints.splice( index, 1 );
		this.props.onSetPoints( newPoints );
		this.setState( { activeMarker: null } );
	};
	// Various map functions
	sizeMap = () => {
		const { mapHeight } = this.props;
		const { map } = this.state;
		const mapEl = this.mapRef.current;
		if ( mapHeight ) {
			mapEl.style.height = mapHeight + 'px';
		} else {
			const blockWidth = mapEl.offsetWidth;
			const maxHeight =
				window.location.search.indexOf( 'map-block-counter' ) > -1
					? window.innerHeight
					: window.innerHeight * 0.8;
			const blockHeight = Math.min( blockWidth * ( 3 / 4 ), maxHeight );
			mapEl.style.height = blockHeight + 'px';
		}
		map.resize();
		this.setBoundsByMarkers();
	};
	updateZoom = () => {
		const { zoom } = this.props;
		const { map } = this.state;

		map.setZoom( zoom );
		map.updateZoom( zoom );
	};
	setBoundsByMarkers = () => {
		const { admin, onSetMapCenter, onSetZoom, points, zoom } = this.props;
		const { map, activeMarker, mapboxgl, zoomControl, boundsSetProgrammatically } = this.state;
		if ( ! map ) {
			return;
		}
		// Do not allow map dragging in the editor if there are markers, because the positioning will be programmatically overridden.
		if ( points.length && admin ) {
			map.dragPan.disable();
		} else {
			map.dragPan.enable();
		}
		// If there are no points at all, there is no data to set bounds to. Abort the function.
		if ( ! points.length ) {
			return;
		}
		// If there is an open info window, resizing will probably move the info window which complicates interaction.
		if ( activeMarker ) {
			return;
		}
		const bounds = new mapboxgl.LngLatBounds();
		points.forEach( point => {
			bounds.extend( [ point.coordinates.longitude, point.coordinates.latitude ] );
		} );
		onSetMapCenter( bounds.getCenter() );

		// If there are multiple points, zoom is determined by the area they cover, and zoom control is removed.
		if ( points.length > 1 ) {
			map.fitBounds( bounds, {
				padding: {
					top: 80,
					bottom: 80,
					left: 40,
					right: 40,
				},
			} );
			this.setState( { boundsSetProgrammatically: true } );
			try {
				map.removeControl( zoomControl );
			} catch ( e ) {}
			return;
		}
		// If there is only one point, center map around it.
		map.setCenter( bounds.getCenter() );

		// If the number of markers has just changed from > 1 to 1, set an arbitrary tight zoom, which feels like the original default.
		if ( boundsSetProgrammatically ) {
			const newZoom = 12;
			map.setZoom( newZoom );
			onSetZoom( newZoom );
		} else {
			// If there are one (or zero) points, and this is not a recent change, respect user's chosen zoom.
			map.setZoom( parseInt( zoom, 10 ) );
		}
		map.addControl( zoomControl );
		this.setState( { boundsSetProgrammatically: false } );
	};
	getMapStyle() {
		const { mapStyle, mapDetails } = this.props;
		return mapboxMapFormatter( mapStyle, mapDetails );
	}
	getMapType() {
		const { mapStyle } = this.props;
		switch ( mapStyle ) {
			case 'satellite':
				return 'HYBRID';
			case 'terrain':
				return 'TERRAIN';
			case 'black_and_white':
			default:
				return 'ROADMAP';
		}
	}
	// Script loading, browser geolocation
	scriptsLoaded = () => {
		const { mapCenter, points } = this.props;
		this.setState( { loaded: true } );

		// If the map has any points, skip geolocation and use what we have.
		if ( points.length > 0 ) {
			this.initMap( mapCenter );
			return;
		}
		this.initMap( mapCenter );
	};

	loadMapLibraries() {
		const { apiKey } = this.props;
		const { currentWindow } = getLoadContext( this.mapRef.current );
		const callbacks = {
			'mapbox-gl-js': () => {
				waitForObject( currentWindow, 'mapboxgl' ).then( mapboxgl => {
					mapboxgl.accessToken = apiKey;
					this.setState( { mapboxgl: mapboxgl }, this.scriptsLoaded );
				} );
			},
		};

		loadBlockEditorAssets( editorAssets, callbacks, this.mapRef.current );
	}

	initMap( mapCenter ) {
		const { mapboxgl } = this.state;
		const { zoom, onMapLoaded, onError, scrollToZoom, showFullscreenButton, admin } = this.props;
		let map = null;

		try {
			map = new mapboxgl.Map( {
				container: this.mapRef.current,
				style: this.getMapStyle(),
				center: this.googlePoint2Mapbox( mapCenter ),
				zoom: parseInt( zoom, 10 ),
				pitchWithRotate: false,
				attributionControl: false,
				dragRotate: false,
			} );
		} catch ( e ) {
			onError( 'mapbox_error', e.message );
			return;
		}

		// If the map block doesn't have the focus in the editor, or
		// it hasn't been enabled on the front end, disable scroll zooming.
		if ( ! scrollToZoom ) {
			map.scrollZoom.disable();
		}

		const fullscreenControl = new mapboxgl.FullscreenControl();

		map.on( 'error', e => {
			onError( 'mapbox_error', e.error.message );
		} );
		const zoomControl = new mapboxgl.NavigationControl( {
			showCompass: false,
			showZoom: true,
		} );
		map.on( 'zoomend', () => {
			this.props.onSetZoom( map.getZoom() );
		} );
		map.on( 'moveend', () => {
			const { onSetMapCenter, points } = this.props;
			// If there are no markers, user repositioning controls map center. If there are markers, set programmatically.
			if ( points.length < 1 ) {
				onSetMapCenter( map.getCenter() );
			}
		} );
		/* Listen for clicks on the Map background, which hides the current popup. */
		map.getCanvas().addEventListener( 'click', this.onMapClick );
		this.setState( { map, zoomControl, fullscreenControl }, () => {
			this.debouncedSizeMap();
			map.addControl( zoomControl );
			if ( showFullscreenButton ) {
				map.addControl( fullscreenControl );
				if ( admin && fullscreenControl._fullscreenButton ) {
					fullscreenControl._fullscreenButton.disabled = true;
				}
			}
			this.mapRef.current.addEventListener( 'alignmentChanged', this.debouncedSizeMap );
			map.resize();
			onMapLoaded();
			this.setState( { loaded: true } );
			window.addEventListener( 'resize', this.debouncedSizeMap );
		} );
	}
	googlePoint2Mapbox = google_point =>
		google_point.hasOwnProperty( 'lat' ) && google_point.hasOwnProperty( 'lng' )
			? google_point // Already a valid Mapbox point.
			: {
					// Legacy point, supported here to avoid block deprecation.
					lat: google_point.latitude || 0,
					lng: google_point.longitude || 0,
			  };
}

Map.defaultProps = {
	points: [],
	mapStyle: 'default',
	zoom: 13,
	onSetZoom: () => {},
	onSetMapCenter: () => {},
	onMapLoaded: () => {},
	onMarkerClick: () => {},
	onError: () => {},
	markerColor: 'red',
	apiKey: null,
	mapCenter: {},
};

export default Map;
