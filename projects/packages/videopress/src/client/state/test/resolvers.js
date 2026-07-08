import apiFetch from '@wordpress/api-fetch';
import resolvers from '../resolvers';

jest.mock( '@wordpress/api-fetch' );

describe( 'getFeatures resolver', () => {
	const { getFeatures } = resolvers;

	describe( 'isFulfilled', () => {
		it( 'should return false when features state does not exist', () => {
			expect( getFeatures.isFulfilled( {} ) ).toBe( false );
		} );

		it( 'should return false when isVideoPressSupported is undefined', () => {
			const state = {
				features: {
					isFetching: false,
				},
			};
			expect( getFeatures.isFulfilled( state ) ).toBe( false );
		} );

		it( 'should return true when isVideoPressSupported is defined', () => {
			const state = {
				features: {
					isVideoPressSupported: true,
				},
			};
			expect( getFeatures.isFulfilled( state ) ).toBe( true );
		} );

		it( 'should return true when isVideoPressSupported is false', () => {
			const state = {
				features: {
					isVideoPressSupported: false,
				},
			};
			expect( getFeatures.isFulfilled( state ) ).toBe( true );
		} );
	} );

	describe( 'fulfill', () => {
		let dispatch;

		beforeEach( () => {
			dispatch = {
				setIsFetchingFeatures: jest.fn(),
				setFeatures: jest.fn(),
			};
			jest.clearAllMocks();
		} );

		it( 'should fetch features and dispatch actions on success', async () => {
			const mockFeatures = {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			};
			apiFetch.mockResolvedValue( mockFeatures );

			const result = await getFeatures.fulfill()( { dispatch } );

			expect( dispatch.setIsFetchingFeatures ).toHaveBeenCalledWith( true );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: 'videopress/v1/features',
				method: 'GET',
			} );
			expect( dispatch.setFeatures ).toHaveBeenCalledWith( mockFeatures );
			expect( dispatch.setIsFetchingFeatures ).toHaveBeenCalledWith( false );
			expect( result ).toEqual( mockFeatures );
		} );

		it( 'should reset isFetching on error', async () => {
			const error = new Error( 'API error' );
			apiFetch.mockRejectedValue( error );

			const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

			await getFeatures.fulfill()( { dispatch } );

			expect( dispatch.setIsFetchingFeatures ).toHaveBeenCalledWith( true );
			expect( dispatch.setFeatures ).not.toHaveBeenCalled();
			expect( dispatch.setIsFetchingFeatures ).toHaveBeenCalledWith( false );
			expect( consoleSpy ).toHaveBeenCalledWith( error );

			consoleSpy.mockRestore();
		} );

		it( 'should call setIsFetchingFeatures(false) in finally block', async () => {
			apiFetch.mockResolvedValue( {} );

			await getFeatures.fulfill()( { dispatch } );

			const calls = dispatch.setIsFetchingFeatures.mock.calls;
			expect( calls[ 0 ][ 0 ] ).toBe( true );
			expect( calls[ 1 ][ 0 ] ).toBe( false );
		} );
	} );
} );
