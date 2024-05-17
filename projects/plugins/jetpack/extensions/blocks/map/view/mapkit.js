import { debounce } from '../../../shared/debounce';
import {
	convertZoomLevelToCameraDistance,
	loadMapkitLibrary,
	fetchMapkitKey,
} from '../mapkit-utils';
import resizeMapContainer from '../utils/resize-map-container';

class MapkitBlock {
	constructor( root ) {
		this.root = root;
		this.blog_id = this.root.getAttribute( 'data-blog-id' );
		this.center = JSON.parse( this.root.getAttribute( 'data-map-center' || '{}' ) );
		this.points = JSON.parse( this.root.getAttribute( 'data-points' ) || '[]' );
		this.color = this.root.getAttribute( 'data-marker-color' ) || 'red';
		this.zoom = parseFloat( this.root.getAttribute( 'data-zoom' ) ) || 10;
		this.scrollToZoom = this.root.getAttribute( 'data-scroll-to-zoom' ) === 'true';
		this.mapStyle = this.root.getAttribute( 'data-map-style' ) || 'default';
		this.mapHeight = this.root.getAttribute( 'data-map-height' ) || null;
		this.onError = () => {};
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
			loadMapkitLibrary( document, window ).then( mapkit => {
				this.mapkit = mapkit;
				this.mapkit.addEventListener( 'error', event => {
					// because Apple uses an event listener for errors, we can't just throw here
					this.onError( event );
				} );
				resolve();
			} );
		} );
	}

	fetchKey() {
		return fetchMapkitKey( this.mapkit, this.blog_id, window );
	}

	initMap() {
		const center = new this.mapkit.Coordinate( this.center.lat, this.center.lng );
		const mapType = ( () => {
			switch ( this.mapStyle ) {
				case 'satellite':
					return this.mapkit.Map.MapTypes.Satellite;
				case 'black_and_white':
					return this.mapkit.Map.MapTypes.MutedStandard;
				case 'hybrid':
					return this.mapkit.Map.MapTypes.Hybrid;
				default:
					return this.mapkit.Map.MapTypes.Standard;
			}
		} )();

		this.map = new this.mapkit.Map( this.container, {
			center,
			mapType,
			showsMapTypeControl: false,
		} );

		if ( this.points.length < 2 && this.zoom ) {
			this.setZoom();
		}

		if ( this.scrollToZoom ) {
			this.map._allowWheelToZoom = true;
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
			return new this.mapkit.MarkerAnnotation( coordinate, {
				color: this.color,
				title: point.title,
				callout: {
					calloutContentForAnnotation: function ( annotation ) {
						const element = document.createElement( 'div' );
						element.style.width = annotation.element.parentElement.offsetWidth / 2 + 'px';

						const title = element.appendChild( document.createElement( 'div' ) );
						title.style.fontSize = '17px';
						title.style.fontWeight = '600';
						title.style.lineHeight = '19px';
						title.style.marginTop = '8px';
						title.textContent = annotation.title;

						const caption = element.appendChild( document.createElement( 'p' ) );
						caption.style.fontSize = '14px';
						caption.style.margin = '0px 0px 4px 0px';
						caption.textContent = annotation.data?.caption;

						return element;
					},
				},
				calloutEnabled: true,
				data: {
					caption: point.caption,
				},
			} );
		} );
		this.map.showItems( annotations );
	}
}

export default MapkitBlock;
