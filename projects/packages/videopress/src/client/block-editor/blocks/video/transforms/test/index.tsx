/**
 * External dependencies
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { createBlobURL } from '@wordpress/blob';
import { createBlock, getBlockTransforms, findTransform } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import transforms from '../index';

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn(),
	getBlockTransforms: jest.fn(),
	findTransform: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

type MockFile = File & { type: string };

interface MockFileArray extends Array< MockFile >, HTMLDivElement {
	className: string;
	allowResponsive: boolean;
	providerNameSlug: 'videopress';
	responsive: boolean;
	type: 'video';
	url: string;
}

describe( 'transforms', () => {
	describe( 'transformFromFile', () => {
		const transformFromFile = transforms.from.find( transform => transform.type === 'files' );

		beforeEach( () => {
			jest.clearAllMocks();
			( findTransform as jest.Mock ).mockReturnValue( null );
		} );

		it( 'should return false when no files are provided', () => {
			expect( transformFromFile.isMatch( [] ) ).toBe( false );
			expect( transformFromFile.isMatch( null ) ).toBe( false );
		} );

		it( 'should return true if at least one video file is present', () => {
			const files: MockFile[] = [
				new File( [ '' ], 'video.mp4', { type: 'video/mp4' } ),
				new File( [ '' ], 'document.txt', { type: 'text/plain' } ),
			];

			expect( transformFromFile.isMatch( files ) ).toBe( true );
		} );

		it( 'should transform video files into videopress/video blocks and handle other file types appropriately', () => {
			const videoFile = new File( [ '' ], 'video.mp4', { type: 'video/mp4' } );
			const textFile = new File( [ '' ], 'document.txt', { type: 'text/plain' } );
			const files = [ videoFile, textFile ] as unknown as MockFileArray;

			// Mock implementations
			( createBlobURL as jest.Mock ).mockReturnValue( 'blob:video-url' );
			( createBlock as jest.Mock ).mockImplementation( ( blockName, attrs ) => ( {
				blockName,
				attrs,
			} ) );

			const mockTransform = {
				type: 'files',
				isMatch: () => true,
				transform: () => createBlock( 'core/file' ),
			};

			( getBlockTransforms as jest.Mock ).mockReturnValue( [ mockTransform ] );
			( findTransform as jest.Mock ).mockReturnValue( mockTransform );

			const result = transformFromFile.transform( files );

			// Verify video block creation
			expect( createBlock ).toHaveBeenCalledWith( 'videopress/video', { src: 'blob:video-url' } );

			// Ensure two blocks are returned: one video, one file
			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ] ).toEqual( {
				blockName: 'videopress/video',
				attrs: { src: 'blob:video-url' },
			} );
			expect( result[ 1 ] ).toEqual( { blockName: 'core/file', attrs: undefined } );
		} );

		it( 'should ignore files without matching transforms and only process valid ones', () => {
			const videoFile = new File( [ '' ], 'video.mp4', { type: 'video/mp4' } );
			const unknownFile = new File( [ '' ], 'unknown.xyz', { type: 'application/unknown' } );
			const files = [ videoFile, unknownFile ] as unknown as MockFileArray;

			Object.assign( files, {
				className: '',
				allowResponsive: true,
				providerNameSlug: 'videopress',
				responsive: true,
				type: 'video',
				url: 'test-url',
			} );

			// Mock behavior
			( createBlobURL as jest.Mock ).mockReturnValue( 'blob:video-url' );
			( getBlockTransforms as jest.Mock ).mockReturnValue( [] );

			const result = transformFromFile.transform( files );

			// Only the video file should create a block
			expect( result ).toHaveLength( 1 );
			expect( createBlock ).toHaveBeenCalledTimes( 1 );
			expect( createBlock ).toHaveBeenCalledWith( 'videopress/video', { src: 'blob:video-url' } );
		} );

		it( 'should preserve the order of transformed files', () => {
			const videoFile1 = new File( [ '' ], 'video1.mp4', { type: 'video/mp4' } );
			const textFile = new File( [ '' ], 'document.txt', { type: 'text/plain' } );
			const videoFile2 = new File( [ '' ], 'video2.mp4', { type: 'video/mp4' } );
			const files = [ videoFile1, textFile, videoFile2 ] as unknown as MockFileArray;

			// Mock implementations
			( createBlobURL as jest.Mock ).mockImplementation( ( file: File ) => `blob:${ file.name }` );
			( createBlock as jest.Mock ).mockImplementation( ( blockName, attrs ) => ( {
				blockName,
				attrs,
			} ) );

			const mockTransform = {
				type: 'files',
				isMatch: () => true,
				transform: () => createBlock( 'core/file' ),
			};

			( getBlockTransforms as jest.Mock ).mockReturnValue( [ mockTransform ] );
			( findTransform as jest.Mock ).mockReturnValue( mockTransform );

			const result = transformFromFile.transform( files );

			// Ensure the transformed blocks maintain the original file order
			expect( result ).toEqual( [
				{ blockName: 'videopress/video', attrs: { src: 'blob:video1.mp4' } },
				{ blockName: 'core/file', attrs: undefined },
				{ blockName: 'videopress/video', attrs: { src: 'blob:video2.mp4' } },
			] );
		} );

		it( 'should return an empty array when no valid transformations exist', () => {
			const unknownFile = new File( [ '' ], 'unknown.xyz', { type: 'application/unknown' } );
			const files = [ unknownFile ] as unknown as MockFileArray;

			// No transforms available
			( getBlockTransforms as jest.Mock ).mockReturnValue( [] );
			( findTransform as jest.Mock ).mockReturnValue( null );

			const result = transformFromFile.transform( files );

			// Should return an empty array
			expect( result ).toHaveLength( 0 );
		} );

		it( 'should transform valid files and ignore unmatched files while preserving order', () => {
			const videoFile = new File( [ '' ], 'video.mp4', { type: 'video/mp4' } );
			const textFile = new File( [ '' ], 'document.txt', { type: 'text/plain' } );
			const unknownFile = new File( [ '' ], 'unknown.xyz', { type: 'application/unknown' } );
			const files = [ videoFile, textFile, unknownFile ] as unknown as MockFileArray;

			// Mock implementations
			( createBlobURL as jest.Mock ).mockImplementation( ( file: File ) => `blob:${ file.name }` );
			( createBlock as jest.Mock ).mockImplementation( ( blockName, attrs ) => ( {
				blockName,
				attrs,
			} ) );

			// Mock a valid transform for text files but no transform for unknown files
			const mockTransform = {
				type: 'files',
				isMatch: ( inputFiles: File[] ) => inputFiles[ 0 ].type === 'text/plain',
				transform: () => createBlock( 'core/file' ),
			};

			( getBlockTransforms as jest.Mock ).mockReturnValue( [ mockTransform ] );
			( findTransform as jest.Mock ).mockImplementation(
				( _, predicate: ( t: typeof mockTransform ) => boolean ) =>
					predicate( mockTransform ) ? mockTransform : null
			);

			const result = transformFromFile.transform( files );

			// Ensure that only the video and text file are transformed, while the unknown file is ignored
			expect( result ).toEqual( [
				{ blockName: 'videopress/video', attrs: { src: 'blob:video.mp4' } },
				{ blockName: 'core/file', attrs: undefined }, // text file transformed successfully
			] );

			// Ensure the unmatched file didn't cause issues
			expect( result ).toHaveLength( 2 );
		} );
	} );
} );
