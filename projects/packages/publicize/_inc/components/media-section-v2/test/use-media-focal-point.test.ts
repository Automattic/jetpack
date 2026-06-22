import { act, renderHook, waitFor } from '@testing-library/react';
import { FOCAL_POINT_META_KEY } from '../../../utils/focal-point';
import {
	clearFocalPointOverlay,
	setFocalPointOverlay,
	useFocalPointOverlay,
} from '../../../utils/focal-point-overlay';
import { useMediaFocalPoint } from '../use-media-focal-point';

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

jest.mock( '../../../utils/focal-point-overlay', () => ( {
	...jest.requireActual( '../../../utils/focal-point-overlay' ),
	useFocalPointOverlay: jest.fn(),
	setFocalPointOverlay: jest.fn(),
	clearFocalPointOverlay: jest.fn(),
} ) );

const mockUseFocalPointOverlay = useFocalPointOverlay as jest.Mock;
const mockSetFocalPointOverlay = setFocalPointOverlay as jest.Mock;
const mockClearFocalPointOverlay = clearFocalPointOverlay as jest.Mock;

describe( 'useMediaFocalPoint', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetEntityRecord.mockReturnValue( undefined );
		mockCanUser.mockReturnValue( true );
		mockUseFocalPointOverlay.mockReturnValue( undefined );
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

	it( 'should return the centered default when the stored point is invalid', () => {
		mockGetEntityRecord.mockReturnValue( {
			meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25 } },
		} );

		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		expect( result.current.value ).toEqual( { x: 0.5, y: 0.5 } );
	} );

	it( 'should prefer the live overlay point over the stored one', () => {
		mockGetEntityRecord.mockReturnValue( {
			meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
		} );
		mockUseFocalPointOverlay.mockReturnValue( { x: 0.1, y: 0.9 } );

		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		expect( result.current.value ).toEqual( { x: 0.1, y: 0.9 } );
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

	it( 'should show a point live via the overlay without saving', () => {
		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		act( () => {
			result.current.setPreviewFocalPoint( { x: 0.3, y: 0.6 } );
		} );

		expect( mockSetFocalPointOverlay ).toHaveBeenCalledWith( 123, { x: 0.3, y: 0.6 } );
		expect( mockSaveEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'should optimistically overlay the point and save it (setFocalPoint)', () => {
		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		act( () => {
			result.current.setFocalPoint( { x: 0.3, y: 0.6 } );
		} );

		expect( mockSetFocalPointOverlay ).toHaveBeenCalledWith( 123, { x: 0.3, y: 0.6 } );
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{
				id: 123,
				meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.3, y: 0.6 } },
			},
			{ throwOnError: true }
		);
	} );

	it( 'should clear its overlay (by value) once the save succeeds', async () => {
		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		act( () => {
			result.current.setFocalPoint( { x: 0.3, y: 0.6 } );
		} );

		await waitFor( () => {
			expect( mockClearFocalPointOverlay ).toHaveBeenCalledWith( 123, { x: 0.3, y: 0.6 } );
		} );
	} );

	it( 'should revert (clear the overlay) when the save fails', async () => {
		mockSaveEntityRecord.mockRejectedValueOnce( new Error( 'Unable to save focal point' ) );

		const { result } = renderHook( () => useMediaFocalPoint( 123 ) );

		act( () => {
			result.current.setFocalPoint( { x: 0.3, y: 0.6 } );
		} );

		await waitFor( () => {
			expect( mockClearFocalPointOverlay ).toHaveBeenCalledWith( 123, { x: 0.3, y: 0.6 } );
		} );
	} );

	it( 'should clear its overlay when the attachment changes', () => {
		const { rerender, unmount } = renderHook(
			( { attachmentId } ) => useMediaFocalPoint( attachmentId ),
			{
				initialProps: { attachmentId: 123 },
			}
		);

		rerender( { attachmentId: 456 } );

		expect( mockClearFocalPointOverlay ).toHaveBeenCalledWith( 123 );

		unmount();
		expect( mockClearFocalPointOverlay ).toHaveBeenCalledWith( 456 );
	} );
} );
