import { renderHook } from '@testing-library/react';
import { FREE_TIER_AT_LIMIT_MESSAGE } from '../../components/free-tier-notice';
import {
	INVALID_FILE_NOTICE_ID,
	NOT_A_VIDEO_MESSAGE,
} from '../../components/upload-dropzone/video-files';
import { useUploadIntake } from '../use-upload-intake';
import type { FreeTierState } from '../use-free-tier';

const mockStartUpload = jest.fn();
jest.mock( '../use-upload', () => ( {
	useUpload: () => ( { uploadQueue: [], startUpload: mockStartUpload } ),
} ) );

let mockFreeTier: FreeTierState;
jest.mock( '../use-free-tier', () => ( {
	useFreeTier: () => mockFreeTier,
} ) );

const mockRunUpgrade = jest.fn();
jest.mock( '../use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => mockRunUpgrade,
} ) );

const mockCreateErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( { createErrorNotice: mockCreateErrorNotice } ),
} ) );

const video = ( name: string ): File => new File( [ 'x' ], name, { type: 'video/mp4' } );

const intake = () => renderHook( () => useUploadIntake() ).result.current;

describe( 'useUploadIntake', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockFreeTier = {
			isFree: false,
			isAtomic: false,
			isUnlimited: false,
			videoCount: 0,
			limit: 1,
			isAtLimit: false,
		};
	} );

	it( 'starts an upload per accepted file and reports the count', () => {
		const files = [ video( 'a.mp4' ), video( 'b.mp4' ) ];

		expect( intake()( files ) ).toBe( 2 );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockStartUpload ).toHaveBeenNthCalledWith( 1, files[ 0 ] );
		expect( mockStartUpload ).toHaveBeenNthCalledWith( 2, files[ 1 ] );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'refuses a selection with no videos in it', () => {
		const files = [ new File( [ 'x' ], 'doc.pdf', { type: 'application/pdf' } ) ];

		expect( intake()( files ) ).toBe( 0 );

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( NOT_A_VIDEO_MESSAGE, {
			id: INVALID_FILE_NOTICE_ID,
		} );
	} );

	it( 'refuses everything at the free-tier limit, offering the upgrade', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true, videoCount: 1, isAtLimit: true };

		expect( intake()( [ video( 'a.mp4' ) ] ) ).toBe( 0 );

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( FREE_TIER_AT_LIMIT_MESSAGE, {
			actions: [ { label: 'Upgrade', onClick: mockRunUpgrade } ],
		} );
	} );

	it( 'uploads up to the free-tier allowance and surfaces the skipped rest', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true };
		const files = [ video( 'a.mp4' ), video( 'b.mp4' ), video( 'c.mp4' ) ];

		expect( intake()( files ) ).toBe( 1 );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockStartUpload ).toHaveBeenCalledWith( files[ 0 ] );
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'2 videos weren’t uploaded because they exceed your plan’s limit.'
		);
	} );
} );
