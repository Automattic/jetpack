import { act, render } from '@testing-library/react';
import AddPoint from '../add-point';
import Map from '../component';
import Controls from '../controls';
import MapEdit from '../edit';
import useAddressLookup from '../use-address-lookup';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getBlockIconComponent: () => () => null,
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { children } ) => children,
	InspectorControls: ( { children } ) => children,
	useBlockProps: () => ( {} ),
} ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ResizableBox: ( { children } ) => children,
	Placeholder: ( { children } ) => children,
	Spinner: () => null,
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { toggleSelection: () => {} } ),
	useSelect: () => ( { isPreviewMode: false } ),
} ) );
jest.mock( '@wordpress/ui', () => ( {} ) );
jest.mock( '../utils/get-map-provider', () => () => 'mapkit' );
jest.mock( '../add-point', () => jest.fn( () => null ) );
jest.mock( '../component', () => ( {
	__esModule: true,
	default: require( '@wordpress/element' ).forwardRef( jest.fn( ( { children } ) => children ) ),
} ) );
jest.mock( '../controls', () => jest.fn( () => null ) );

const paris = { id: 'paris', coordinates: { latitude: 48.8566, longitude: 2.3522 } };
const london = { id: 'london', coordinates: { latitude: 51.5074, longitude: -0.1278 } };
const noticeOperations = { removeAllNotices: jest.fn(), createErrorNotice: jest.fn() };

it( 'centers a new map when a search result adds its first marker', () => {
	const setAttributes = jest.fn();
	render(
		<MapEdit
			attributes={ { points: [] } }
			setAttributes={ setAttributes }
			noticeOperations={ noticeOperations }
			isSelected
		/>
	);
	act( () => Map.render.mock.calls.at( -1 )[ 0 ].onMapLoaded() );
	act( () => AddPoint.mock.calls.at( -1 )[ 0 ].onAddPoint( paris ) );
	expect( setAttributes ).toHaveBeenCalledWith( {
		points: [ paris ],
		mapCenter: { lat: 48.8566, lng: 2.3522 },
	} );
} );

it.each( [ 'map', 'sidebar' ] )(
	'saves the center with marker additions and removals through the %s',
	source => {
		const setAttributes = jest.fn();
		const { rerender } = render(
			<MapEdit
				attributes={ { points: [ paris ], address: 'Paris' } }
				setAttributes={ setAttributes }
				noticeOperations={ noticeOperations }
			/>
		);
		const setPoints = () =>
			( source === 'map' ? Map.render : Controls ).mock.calls.at( -1 )[ 0 ].onSetPoints;
		act( () => setPoints()( [ paris, london ] ) );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			points: [ paris, london ],
			mapCenter: { lat: expect.closeTo( 50.182 ), lng: expect.closeTo( 1.1122 ) },
		} );
		rerender(
			<MapEdit
				attributes={ { points: [ paris, london ], address: 'Paris' } }
				setAttributes={ setAttributes }
				noticeOperations={ noticeOperations }
			/>
		);
		act( () => setPoints()( [ london ] ) );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			points: [ london ],
			mapCenter: { lat: 51.5074, lng: -0.1278 },
		} );
	}
);

it.each( [ 'map', 'sidebar' ] )(
	'keeps the last marker deleted after saving and reloading through the %s',
	source => {
		const setAttributes = jest.fn();
		const { unmount } = render(
			<MapEdit
				attributes={ { points: [ paris ], address: 'Paris' } }
				setAttributes={ setAttributes }
				noticeOperations={ noticeOperations }
			/>
		);
		act( () =>
			( source === 'map' ? Map.render : Controls ).mock.calls.at( -1 )[ 0 ].onSetPoints( [] )
		);
		const saved = setAttributes.mock.calls.at( -1 )[ 0 ];
		expect( saved ).toEqual( { points: [], address: '' } );
		unmount();
		const lookup = jest.fn();
		const Lookup = () => {
			useAddressLookup( saved.address, saved.points, lookup, setAttributes );
			return null;
		};
		render( <Lookup /> );
		expect( lookup ).not.toHaveBeenCalled();
	}
);

it( 'preserves a panned center when editing a marker title', () => {
	const setAttributes = jest.fn();
	render(
		<MapEdit
			attributes={ { points: [ paris ], mapCenter: { lat: 49, lng: 3 } } }
			setAttributes={ setAttributes }
			noticeOperations={ noticeOperations }
		/>
	);
	expect( setAttributes ).not.toHaveBeenCalled();
	const points = [ { ...paris, title: 'New title' } ];
	act( () => Map.render.mock.calls.at( -1 )[ 0 ].onSetPoints( points ) );
	expect( setAttributes ).toHaveBeenCalledWith( { points } );
} );
