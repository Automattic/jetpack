import { act, renderHook } from '@testing-library/react';
import useAddressLookup from '../use-address-lookup';

const point = ( latitude = 1, longitude = 2 ) => ( {
	coordinates: { latitude, longitude },
} );
const saved = [ point() ];
let requests;
let lookup;
let onSuccess;
let onError;

const mount = ( props = {} ) =>
	renderHook(
		( { address, points, provider, success } ) =>
			useAddressLookup( address, points, provider, success, onError ),
		{
			initialProps: {
				address: 'Original',
				points: saved,
				provider: lookup,
				success: onSuccess,
				...props,
			},
		}
	);

beforeEach( () => {
	requests = [];
	lookup = jest.fn(
		() => new Promise( ( resolve, reject ) => requests.push( { resolve, reject } ) )
	);
	onSuccess = jest.fn();
	onError = jest.fn();
} );

it( 'preserves stored locations on mount and after remounting discarded edits', () => {
	const { unmount } = mount();
	unmount();
	mount();
	expect( lookup ).not.toHaveBeenCalled();
	expect( onSuccess ).not.toHaveBeenCalled();
} );

it( 'waits for the provider before resolving an address without coordinates', async () => {
	const points = [];
	const { rerender } = mount( { points, provider: null } );
	expect( lookup ).not.toHaveBeenCalled();
	rerender( { address: 'Original', points, provider: lookup, success: onSuccess } );
	await act( async () => requests[ 0 ].resolve( saved ) );
	expect( onSuccess ).toHaveBeenCalledWith( saved );
	rerender( { address: 'Original', points: saved, provider: lookup, success: onSuccess } );
	expect( lookup ).toHaveBeenCalledTimes( 1 );
} );

it.each( [ false, true ] )( 'resolves an address-only change (cloned points: %s)', async cloned => {
	const { rerender } = mount();
	rerender( {
		address: 'New',
		points: cloned ? JSON.parse( JSON.stringify( saved ) ) : saved,
		provider: lookup,
		success: onSuccess,
	} );
	expect( lookup ).toHaveBeenCalledWith( 'New' );
	const moved = [ point( 3, 4 ) ];
	await act( async () => requests[ 0 ].resolve( moved ) );
	expect( onSuccess ).toHaveBeenCalledWith( moved );
} );

it( 'preserves an address and coordinates supplied together by a tool', () => {
	const { rerender } = mount();
	rerender( { address: 'New', points: [ point( 3, 4 ) ], provider: lookup, success: onSuccess } );
	expect( lookup ).not.toHaveBeenCalled();
} );

it( 'does not restore locations the user removed', () => {
	const { rerender } = mount();
	rerender( { address: 'Original', points: [], provider: lookup, success: onSuccess } );
	expect( lookup ).not.toHaveBeenCalled();
} );

it( 'ignores old results after the address changes', async () => {
	const points = [];
	const { rerender } = mount( { points } );
	rerender( { address: 'New', points, provider: lookup, success: onSuccess } );
	await act( async () => requests[ 0 ].resolve( saved ) );
	expect( onSuccess ).not.toHaveBeenCalled();
	const moved = [ point( 3, 4 ) ];
	await act( async () => requests[ 1 ].resolve( moved ) );
	expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	expect( onSuccess ).toHaveBeenCalledWith( moved );
} );

it( 'does not overwrite coordinates supplied while a lookup is pending', async () => {
	const { rerender } = mount( { points: [] } );
	rerender( { address: 'Original', points: saved, provider: lookup, success: onSuccess } );
	await act( async () => requests[ 0 ].resolve( [ point( 3, 4 ) ] ) );
	expect( onSuccess ).not.toHaveBeenCalled();
} );

it( 'ignores results after unmounting', async () => {
	const { unmount } = mount( { points: [] } );
	unmount();
	await act( async () => requests[ 0 ].resolve( saved ) );
	expect( onSuccess ).not.toHaveBeenCalled();
} );

it( 'uses the latest callback without restarting the lookup', async () => {
	const points = [];
	const { rerender } = mount( { points } );
	const success = jest.fn();
	rerender( { address: 'Original', points, provider: lookup, success } );
	await act( async () => requests[ 0 ].resolve( saved ) );
	expect( lookup ).toHaveBeenCalledTimes( 1 );
	expect( onSuccess ).not.toHaveBeenCalled();
	expect( success ).toHaveBeenCalledWith( saved );
} );

it( 'reports failures without writing any points', async () => {
	mount( { points: [] } );
	const error = new Error( 'Lookup failed' );
	await act( async () => requests[ 0 ].reject( error ) );
	expect( onError ).toHaveBeenCalledWith( error );
	expect( onSuccess ).not.toHaveBeenCalled();
} );

it( 'does not look up an empty address', () => {
	mount( { address: '', points: [] } );
	expect( lookup ).not.toHaveBeenCalled();
} );

it( 'resolves invalid saved coordinates', () => {
	mount( { points: [ { coordinates: {} } ] } );
	expect( lookup ).toHaveBeenCalledWith( 'Original' );
} );

it( 'keeps resolving an address-only edit when unchanged points are cloned during loading', async () => {
	const { rerender } = mount( { provider: null } );
	rerender( { address: 'New', points: saved, provider: null, success: onSuccess } );
	rerender( {
		address: 'New',
		points: JSON.parse( JSON.stringify( saved ) ),
		provider: lookup,
		success: onSuccess,
	} );
	expect( lookup ).toHaveBeenCalledWith( 'New' );
	await act( async () => requests[ 0 ].resolve( [ point( 3, 4 ) ] ) );
	expect( onSuccess ).toHaveBeenCalledWith( [ point( 3, 4 ) ] );
} );
