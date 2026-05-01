import { jest } from '@jest/globals';
import analytics from '../index';

describe( 'analytics', () => {
	it( 'returns an object with methods', () => {
		expect( typeof analytics ).toBe( 'object' );
		expect( analytics.initialize ).toBeInstanceOf( Function );
	} );
} );

describe( 'analytics.tracks.recordEvent blog_id injection', () => {
	let tkqPush;

	beforeEach( () => {
		window._tkq = [];
		tkqPush = jest.spyOn( window._tkq, 'push' );
		// Reset super props between tests.
		analytics.setSuperProps( undefined );
		delete window.jpTracksContext;
	} );

	afterEach( () => {
		tkqPush.mockRestore();
	} );

	it( 'adds blog_id from jpTracksContext when not explicitly set', () => {
		window.jpTracksContext = { blog_id: 12345 };

		analytics.tracks.recordEvent( 'jetpack_test_event', { foo: 'bar' } );

		expect( tkqPush ).toHaveBeenCalledWith( [
			'recordEvent',
			'jetpack_test_event',
			expect.objectContaining( { blog_id: 12345, foo: 'bar' } ),
		] );
	} );

	it( 'does not override explicit blog_id from caller', () => {
		window.jpTracksContext = { blog_id: 12345 };

		analytics.tracks.recordEvent( 'jetpack_test_event', { blog_id: 99999 } );

		expect( tkqPush ).toHaveBeenCalledWith( [
			'recordEvent',
			'jetpack_test_event',
			expect.objectContaining( { blog_id: 99999 } ),
		] );
	} );

	it( 'super props blog_id overrides context blog_id', () => {
		window.jpTracksContext = { blog_id: 12345 };
		analytics.setSuperProps( { blog_id: 67890 } );

		analytics.tracks.recordEvent( 'jetpack_test_event', {} );

		expect( tkqPush ).toHaveBeenCalledWith( [
			'recordEvent',
			'jetpack_test_event',
			expect.objectContaining( { blog_id: 67890 } ),
		] );
	} );

	it( 'does not add blog_id when jpTracksContext is absent', () => {
		analytics.tracks.recordEvent( 'jetpack_test_event', { foo: 'bar' } );

		const props = tkqPush.mock.calls[ 0 ][ 0 ][ 2 ];
		expect( props ).not.toHaveProperty( 'blog_id' );
		expect( props.foo ).toBe( 'bar' );
	} );

	it( 'does not add blog_id when jpTracksContext.blog_id is 0', () => {
		window.jpTracksContext = { blog_id: 0 };

		analytics.tracks.recordEvent( 'jetpack_test_event', { foo: 'bar' } );

		const props = tkqPush.mock.calls[ 0 ][ 0 ][ 2 ];
		expect( props ).not.toHaveProperty( 'blog_id' );
	} );

	it( 'blog_id survives setSuperProps() and initialize() calls', () => {
		window.jpTracksContext = { blog_id: 12345 };

		// Simulate typical consumer: initialize without blog_id, then setSuperProps.
		analytics.initialize( 1, 'testuser' );
		analytics.setSuperProps( { some_prop: 'value' } );

		analytics.tracks.recordEvent( 'jetpack_test_event', {} );

		expect( tkqPush ).toHaveBeenLastCalledWith( [
			'recordEvent',
			'jetpack_test_event',
			expect.objectContaining( { blog_id: 12345, some_prop: 'value' } ),
		] );
	} );
} );
