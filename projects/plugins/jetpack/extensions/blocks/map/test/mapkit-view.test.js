import metadata from '../block.json';
import { convertZoomLevelToCameraDistance } from '../mapkit-utils';
import MapkitBlock from '../view/mapkit';

it.each( [
	[ 'default center, no markers', metadata.attributes.mapCenter.default, 0 ],
	[ 'default center, one marker', metadata.attributes.mapCenter.default, 1 ],
	[ 'saved center at the equator, no markers', { lat: 0, lng: 0 }, 0 ],
	[ 'saved center at the equator, one marker', { lat: 0, lng: 0 }, 1 ],
] )( 'renders a published MapKit map with %s', ( name, center, count ) => {
	const root = document.createElement( 'div' );
	root.setAttribute( 'data-map-center', JSON.stringify( center ) );
	root.setAttribute( 'data-zoom', '13' );
	root.setAttribute(
		'data-points',
		JSON.stringify(
			Array.from( { length: count }, () => ( {
				coordinates: { latitude: 48.8566, longitude: 2.3522 },
			} ) )
		)
	);
	const block = new MapkitBlock( root );
	const map = { showItems: jest.fn() };
	block.mapkit = {
		Coordinate: jest.fn( ( latitude, longitude ) => ( { latitude, longitude } ) ),
		Map: Object.assign(
			jest.fn( () => map ),
			{ MapTypes: { Standard: 'standard' } }
		),
		MarkerAnnotation: jest.fn( ( coordinate, options ) => ( { coordinate, ...options } ) ),
	};
	block.initDOM();
	block.initMap();
	block.addPoints();
	const latitude = center.lat ?? center.latitude;
	const longitude = center.lng ?? center.longitude;
	expect( block.mapkit.Map ).toHaveBeenCalledWith(
		block.container,
		expect.objectContaining( { center: { latitude, longitude } } )
	);
	expect( Number.isFinite( map.cameraDistance ) ).toBe( true );
	expect( map.cameraDistance ).toBe( convertZoomLevelToCameraDistance( 13, latitude ) );
	expect( map.showItems.mock.calls[ 0 ][ 0 ] ).toHaveLength( count );
} );
