import { renderHook } from '@testing-library/react';
import { FOCAL_POINT_META_KEY, useMediaFocalPoint } from '../use-media-focal-point';

const mockGetEntityRecord = jest.fn();
const mockCanUser = jest.fn();
const mockSaveEntityRecord = jest.fn( () => Promise.resolve() );

jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( cb: ( select: () => unknown ) => unknown ) =>
		cb( () => ( {
			getEntityRecord: mockGetEntityRecord,
			canUser: mockCanUser,
		} ) ),
	useDispatch: () => ( { saveEntityRecord: mockSaveEntityRecord } ),
} ) );

describe( 'useMediaFocalPoint', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetEntityRecord.mockReturnValue( undefined );
		mockCanUser.mockReturnValue( true );
	} );

	it( 'should return the centered default when the image has no stored point', () => {
		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		expect( result.current.value ).toEqual( { x: 0.5, y: 0.5 } );
		expect( mockGetEntityRecord ).toHaveBeenCalledWith( 'postType', 'attachment', 123 );
	} );

	it( 'should return the stored point of the image', () => {
		mockGetEntityRecord.mockReturnValue( {
			meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
		} );

		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		expect( result.current.value ).toEqual( { x: 0.25, y: 0.75 } );
	} );

	it( 'should report edit permission from canUser', () => {
		mockCanUser.mockReturnValue( false );

		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		expect( result.current.canEdit ).toBe( false );
		expect( mockCanUser ).toHaveBeenCalledWith( 'update', 'media', 123 );
	} );

	it( 'should not query core-data without an attachment ID', () => {
		const { result } = renderHook( () => useMediaFocalPoint( 0 ) );

		expect( result.current.canEdit ).toBe( false );
		expect( result.current.value ).toEqual( { x: 0.5, y: 0.5 } );
		expect( mockGetEntityRecord ).not.toHaveBeenCalled();
		expect( mockCanUser ).not.toHaveBeenCalled();
	} );

	it( 'should save the point to the attachment', () => {
		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		result.current.setFocalPoint( { x: 0.3, y: 0.6 } );

		expect( mockSaveEntityRecord ).toHaveBeenCalledWith( 'postType', 'attachment', {
			id: 123,
			meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.3, y: 0.6 } },
		} );
	} );
} );
