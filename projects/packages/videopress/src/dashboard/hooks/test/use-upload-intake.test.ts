import analytics from '@automattic/jetpack-analytics';
import { renderHook } from '@testing-library/react';
import { FREE_TIER_AT_LIMIT_MESSAGE } from '../../components/free-tier-notice';
import {
	INVALID_FILE_NOTICE_ID,
	NOT_A_VIDEO_MESSAGE,
} from '../../components/upload-dropzone/video-files';
import { useUploadIntake } from '../use-upload-intake';
import { useVideoPressUpgrade } from '../use-videopress-upgrade';
import type { FreeTierState } from '../use-free-tier';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
const recordEvent = analytics.tracks.recordEvent as jest.Mock;

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
	useVideoPressUpgrade: jest.fn( () => mockRunUpgrade ),
} ) );

const mockCreateErrorNotice = jest.fn();
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn( () => ( { name: 'mock-store' } ) ),
	createSelector: jest.fn( selector => selector ),
	keyedReducer: jest.fn( ( _key, reducer ) => reducer ),
	register: jest.fn(),
	select: jest.fn( () => ( {} ) ),
	dispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => ( {} ) ),
	useRegistry: jest.fn( () => ( { select: jest.fn(), dispatch: jest.fn() } ) ),
	useDispatch: () => ( { createErrorNotice: mockCreateErrorNotice } ),
} ) );

const video = ( name: string ): File => new File( [ 'x' ], name, { type: 'video/mp4' } );

const intake = () => renderHook( () => useUploadIntake( 'library_intake' ) ).result.current;

describe( 'useUploadIntake', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockFreeTier = {
			isFree: false,
			isAtomic: false,
			isUnlimited: false,
			videoCount: 0,
			videoCountKnown: true,
			limit: 1,
			isAtLimit: false,
		};
	} );

	it( 'starts an upload per accepted file and reports the count', () => {
		mockFreeTier = { ...mockFreeTier, knownVideoCount: 4 };
		const files = [ video( 'a.mp4' ), video( 'b.mp4' ) ];

		expect( intake()( files ) ).toBe( 2 );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockStartUpload ).toHaveBeenNthCalledWith( 1, files[ 0 ], {
			isFree: false,
			videoCountBefore: 4,
		} );
		expect( mockStartUpload ).toHaveBeenNthCalledWith( 2, files[ 1 ], {
			isFree: false,
			videoCountBefore: 5,
		} );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'leaves unknown-plan uploads to the server without a quota upsell', () => {
		mockFreeTier = { ...mockFreeTier, isFree: null, videoCount: 4 };
		const files = [ video( 'a.mp4' ), video( 'b.mp4' ) ];

		expect( intake()( files ) ).toBe( 2 );
		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
		expect( mockRunUpgrade ).not.toHaveBeenCalled();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'refuses a selection with no videos in it', () => {
		const files = [ new File( [ 'x' ], 'doc.pdf', { type: 'application/pdf' } ) ];

		expect( intake()( files ) ).toBe( 0 );

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upload_refused', {
			location: 'library_intake',
			reason: 'file_validation',
			files_known: true,
			attempted_files: 1,
			skipped_files: 1,
		} );
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( NOT_A_VIDEO_MESSAGE, {
			id: INVALID_FILE_NOTICE_ID,
			type: 'snackbar',
		} );
	} );

	it( 'refuses everything at the free-tier limit, offering the upgrade', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true, videoCount: 1, isAtLimit: true };

		expect( intake()( [ video( 'a.mp4' ) ] ) ).toBe( 0 );
		expect( useVideoPressUpgrade ).toHaveBeenCalledWith( 'upload_limit' );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upload_refused', {
			location: 'library_intake',
			reason: 'plan_limit',
			files_known: true,
			attempted_files: 1,
			skipped_files: 1,
		} );

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( FREE_TIER_AT_LIMIT_MESSAGE, {
			actions: [ { label: 'Upgrade', onClick: mockRunUpgrade } ],
			type: 'snackbar',
		} );
	} );

	it( 'uploads up to the free-tier allowance and surfaces the skipped rest', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true };
		const files = [ video( 'a.mp4' ), video( 'b.mp4' ), video( 'c.mp4' ) ];

		expect( intake()( files ) ).toBe( 1 );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockStartUpload ).toHaveBeenCalledWith( files[ 0 ], {
			isFree: true,
			videoCountBefore: undefined,
		} );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upload_refused', {
			location: 'library_intake',
			reason: 'plan_limit',
			files_known: true,
			attempted_files: 3,
			skipped_files: 2,
		} );
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'2 videos weren’t uploaded because they exceed your plan’s limit.',
			{ type: 'snackbar' }
		);
	} );

	it( 'separates invalid files from videos skipped by the limit in a mixed selection', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true };
		intake()( [
			video( 'a.mp4' ),
			new File( [ 'x' ], 'doc.pdf', { type: 'application/pdf' } ),
			video( 'b.mp4' ),
		] );
		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_videopress_upload_refused',
				{
					location: 'library_intake',
					reason: 'file_validation',
					files_known: true,
					attempted_files: 3,
					skipped_files: 1,
				},
			],
			[
				'jetpack_videopress_upload_refused',
				{
					location: 'library_intake',
					reason: 'plan_limit',
					files_known: true,
					attempted_files: 3,
					skipped_files: 1,
				},
			],
		] );
		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'records deliberate repeat attempts but not hook rerenders', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true, videoCount: 1, isAtLimit: true };
		const { result, rerender } = renderHook( () => useUploadIntake( 'onboarding_intake' ) );
		rerender();
		expect( recordEvent ).not.toHaveBeenCalled();
		result.current( [ video( 'a.mp4' ) ] );
		result.current( [ video( 'a.mp4' ) ] );
		expect( recordEvent ).toHaveBeenCalledTimes( 2 );
		expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_videopress_upload_refused', {
			location: 'onboarding_intake',
			reason: 'plan_limit',
			files_known: true,
			attempted_files: 1,
			skipped_files: 1,
		} );
	} );

	it( 'does not count an empty selection or an unlimited plan as a limit refusal', () => {
		mockFreeTier = { ...mockFreeTier, isFree: true, isUnlimited: true, videoCount: 10 };
		intake()( [] );
		intake()( [ video( 'a.mp4' ), video( 'b.mp4' ) ] );
		expect( recordEvent ).not.toHaveBeenCalled();
		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
	} );
} );
