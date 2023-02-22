import { debounce } from '../../../shared/debounce';
import { convertZoomLevelToCameraDistance } from '../mapkit-utils';
import { resizeMapContainer } from '../utils';

class MapkitBlock {
	constructor( root ) {
		this.root = root;
		this.blog_id = this.root.getAttribute( 'data-blog-id' );
		this.center = JSON.parse( this.root.getAttribute( 'data-map-center' || '{}' ) );
		this.points = JSON.parse( this.root.getAttribute( 'data-points' ) || '[]' );
		this.color = this.root.getAttribute( 'data-marker-color' ) || 'red';
		this.zoom = parseFloat( this.root.getAttribute( 'data-zoom' ) ) || 10;
		this.mapStyle = this.root.getAttribute( 'data-map-style' ) || 'default';
		this.mapHeight = this.root.getAttribute( 'data-map-height' ) || null;
	}

	async init() {
		this.initDOM();
		await this.loadLibrary();
		await this.fetchKey();
		this.initMapSize();
		this.initMap();
		this.addPoints();
		this.initHandlers();
	}

	initDOM() {
		this.root.innerHTML = `<div class="wp-block-jetpack-map__mb-container"></div>`;
		this.container = this.root.querySelector( '.wp-block-jetpack-map__mb-container' );
	}

	sizeMap = () => {
		resizeMapContainer( this.container, this.mapHeight );
	};

	initMapSize() {
		this.debouncedSizeMap = debounce( this.sizeMap, 250 );
		this.sizeMap();
	}

	initHandlers() {
		window.addEventListener( 'resize', this.debouncedSizeMap );
	}

	loadLibrary() {
		return new Promise( resolve => {
			const element = document.createElement( 'script' );
			element.addEventListener(
				'load',
				() => {
					this.mapkit = window.mapkit;
					resolve();
				},
				{ once: true }
			);
			element.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
			//element['data-libraries'] = 'services,full-map,geojson';
			element.crossOrigin = 'anonymous';
			document.head.appendChild( element );
		} );
	}

	fetchKey() {
		return new Promise( resolve => {
			this.mapkit.init( {
				authorizationCallback: done => {
					fetch( `https://public-api.wordpress.com/wpcom/v2/sites/${ this.blog_id }/mapkit` )
						.then( response => {
							if ( response.status === 200 ) {
								return response.json();
							}
							throw new Error( 'Mapkit API error' );
						} )
						.then( data => {
							done( data.wpcom_mapkit_access_token );
							resolve();
						} );
				},
			} );
		} );
	}

	initMap() {
		const center = new this.mapkit.Coordinate( this.center.lat, this.center.lng );
		const mapType = ( () => {
			switch ( this.mapStyle ) {
				case 'satellite':
					return this.mapkit.Map.MapTypes.Satellite;
				case 'muted':
					return this.mapkit.Map.MapTypes.Muted;
				case 'hybrid':
					return this.mapkit.Map.MapTypes.Hybrid;
				default:
					return this.mapkit.Map.MapTypes.Standard;
			}
		} )();

		this.map = new this.mapkit.Map( this.container, {
			center,
			mapType,
		} );

		if ( this.points.length < 2 && this.zoom ) {
			this.setZoom();
		}
	}

	setZoom() {
		this.map.cameraDistance = convertZoomLevelToCameraDistance( this.zoom, this.center.lat );
	}

	addPoints() {
		const annotations = this.points.map( point => {
			const coordinate = new this.mapkit.Coordinate(
				point.coordinates.latitude,
				point.coordinates.longitude
			);
			const annotation = new this.mapkit.MarkerAnnotation( coordinate, {
				color: this.color,
			} );
			annotation.title = point.title;
			annotation.callout = {};
			annotation.calloutEnabled = true;
			return annotation;
		} );
		this.map.showItems( annotations );
	}
}

export default MapkitBlock;
